import { createHash } from 'node:crypto';
import { readFile, readdir, realpath, lstat } from 'node:fs/promises';
import path from 'node:path';
import { stringify, parseDocument } from 'yaml';
import { convertAstroDraft, error } from './astro-adapter.ts';
import { validateMasterDraft } from './schema.ts';
import type { Diagnostic } from './adapter.ts';
import { inspectImage, inspectPublishedContent } from '../scripts/publication-integrity.ts';
import { essaySchema } from '../src/lib/content-schema.ts';

export const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
export interface PlanInput { source: string; options?: unknown }
export interface PlannedFile { relativePath: string; content: string; sha256: string; sourceHash: string; action: 'add' | 'noop' }
export interface SourceMap { id: string; sourceHash: string; scenes: { sceneId: string; pageIndex: number }[]; excluded: string[] }
export type PublicationPlan = { ok: true; dryRun: true; files: PlannedFile[]; sources: SourceMap[]; diagnostics: Diagnostic[] }
  | { ok: false; dryRun: true; diagnostics: Diagnostic[]; files?: never; sources?: never };

function excludedPaths(value: unknown, at = ''): string[] {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, item]) => {
    const next = at ? `${at}.${key}` : key;
    return ['extensions', 'prompt', 'negativePrompt'].includes(key) ? [next] : excludedPaths(item, next);
  });
}
/** Entirely read-only. Existing files can only be byte-identical no-ops; updates are unsupported. */
export async function planPublication(rootPath: string, inputs: PlanInput[]): Promise<PublicationPlan> {
  const diagnostics: Diagnostic[] = [];
  const files: PlannedFile[] = [];
  const sources: SourceMap[] = [];
  const fail = (): PublicationPlan => ({ ok: false, dryRun: true, diagnostics });
  if (!inputs.length) { diagnostics.push(error('empty-input', '', '원본을 한 개 이상 지정하세요.')); return fail(); }
  try {
    const root = await realpath(rootPath);
    const dirs = ['src/content/books', 'src/content/essays'];
    if (await realpath(path.join(root, 'public')) !== path.join(root, 'public')) throw new Error('public symlink는 허용하지 않습니다.');
    const names = new Map<string, string[]>();
    for (const dir of dirs) {
      const full = path.join(root, dir);
      if (await realpath(full) !== full) throw new Error(`출력 디렉터리 symlink는 허용하지 않습니다: ${dir}`);
      const entries = await readdir(full);
      for (const name of entries.filter(n => /\.(json|mdx)$/i.test(n))) {
        if (!(await lstat(path.join(full, name))).isFile()) throw new Error(`일반 파일이 아닌 콘텐츠: ${dir}/${name}`);
      }
      names.set(dir, entries);
    }
    diagnostics.push(...await inspectPublishedContent(root));
    const essayOwners = new Map<string, string>();
    for (const name of names.get(dirs[1])!.filter(n => n.endsWith('.mdx'))) {
      const text = await readFile(path.join(root, dirs[1], name), 'utf8');
      const match = /^(?:\uFEFF)?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
      if (!match) throw new Error(`잘못된 frontmatter: ${name}`);
      const doc = parseDocument(match[1]);
      if (doc.errors.length) throw new Error(`잘못된 YAML: ${name}`);
      const data = essaySchema.parse(doc.toJS());
      essayOwners.set(data.bookId, `${dirs[1]}/${name}`);
    }
    const ids = new Set<string>();
    const paths = new Set<string>();
    for (const [index, input] of inputs.entries()) {
      const sourceHash = sha256(input.source);
      let value: unknown;
      try { value = JSON.parse(input.source); }
      catch { diagnostics.push(error('invalid-json', `inputs.${index}`, '올바른 JSON이 아닙니다.')); continue; }
      const parsed = validateMasterDraft(value);
      const converted = convertAstroDraft(value, input.options);
      diagnostics.push(...converted.diagnostics.filter(d => d.code !== 'asset-unverified'));
      if (!parsed.success || !converted.ok) continue;
      const draft = parsed.data;
      if (ids.has(draft.id)) { diagnostics.push(error('duplicate-id', draft.id, '여러 원본의 책 ID가 중복됩니다.')); continue; }
      ids.add(draft.id);
      const artifacts = converted.artifacts;
      for (const [i, page] of artifacts.book.pages.entries()) diagnostics.push(...await inspectImage(path.join(root, 'public'), page.image, `${draft.id}.pages.${i}.image`));
      if (artifacts.book.cover !== undefined) diagnostics.push(...await inspectImage(path.join(root, 'public'), artifacts.book.cover, `${draft.id}.cover`));
      sources.push({ id: draft.id, sourceHash, scenes: draft.story!.scenes.map((scene, pageIndex) => ({ sceneId: scene.id, pageIndex })),
        excluded: ['schemaVersion', 'status', ...draft.story!.scenes.map((_, i) => `story.scenes.${i}.id`), ...draft.images!.map((_, i) => `images.${i}.sceneId`),
          ...(draft.thinking?.activities.map((_, i) => `thinking.activities.${i}.id`) ?? []), ...excludedPaths(draft)],
      });
      const candidates = [{ relativePath: `${dirs[0]}/${draft.id}.json`, content: JSON.stringify(artifacts.book, null, 2) + '\n' }];
      if (artifacts.essay) {
        const essayId = (input.options as { essayId?: string } | undefined)?.essayId ?? draft.id;
        const relativePath = `${dirs[1]}/${essayId}.mdx`;
        const owner = essayOwners.get(draft.id);
        if (owner && owner !== relativePath) diagnostics.push(error('duplicate-essay', relativePath, `기존 에세이: ${owner}`));
        essayOwners.set(draft.id, relativePath);
        const yaml = stringify(artifacts.essay.frontmatter);
        candidates.push({ relativePath, content: `---\n${yaml}---\n${artifacts.essay.body}` });
      }
      for (const candidate of candidates) {
        const key = candidate.relativePath.toLowerCase();
        if (paths.has(key)) { diagnostics.push(error('output-collision', candidate.relativePath, '여러 원본의 출력 경로가 중복됩니다.')); continue; }
        paths.add(key);
        const dir = path.posix.dirname(candidate.relativePath);
        const name = path.posix.basename(candidate.relativePath);
        const existing = names.get(dir)!.find(n => n.toLowerCase() === name.toLowerCase());
        let action: PlannedFile['action'] = 'add';
        if (existing) {
          const current = await readFile(path.join(root, dir, existing));
          if (existing !== name || !current.equals(Buffer.from(candidate.content))) {
            diagnostics.push(error('existing-output', candidate.relativePath, `덮어쓰기 금지. 기존 ${sha256(current)}, 예상 ${sha256(candidate.content)}`)); continue;
          }
          action = 'noop';
        }
        files.push({ ...candidate, sourceHash, sha256: sha256(candidate.content), action });
      }
    }
    return diagnostics.some(d => d.severity === 'error') ? fail() : { ok: true, dryRun: true, files, sources, diagnostics };
  } catch (e) { diagnostics.push(error('repository-unavailable', rootPath, String(e))); return fail(); }
}
