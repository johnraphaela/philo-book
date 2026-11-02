import { readFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { pathToFileURL } from 'node:url';
import { z } from 'astro/zod';
import { validateMasterDraft } from '../../../../content-authoring/schema.ts';

const verification = z.enum(['verified', 'partially_verified', 'unverified', 'suggested']);
const nonempty = z.string().refine(value => value.trim().length > 0);
// Optional Skill metadata contract, not a new requirement on Master Draft v1.
const research = z.object({
  sources: z.array(z.object({
    id: nonempty, label: nonempty, verification,
    locator: nonempty.optional(), checkedFields: z.array(nonempty).optional(), evidenceNote: nonempty.optional(),
  }).passthrough().superRefine((source, ctx) => {
    if (source.verification === 'verified' && (!source.locator || !source.checkedFields?.length || !source.evidenceNote)) {
      ctx.addIssue({ code: 'custom', message: 'verified에는 확인 위치·범위·메모가 필요합니다.' });
    }
  })),
  claims: z.array(z.object({
    kind: z.enum(['philosophical', 'empirical', 'interpretation']), text: nonempty,
    sourceIds: z.array(nonempty).optional(), verification: verification.optional(),
  }).passthrough()).optional(),
}).passthrough().superRefine((brief, ctx) => {
  const sources = new Map(brief.sources.map(source => [source.id, source]));
  if (sources.size !== brief.sources.length) ctx.addIssue({ code: 'custom', message: '문헌 ID가 중복되었습니다.' });
  brief.claims?.forEach((claim, index) => {
    if (claim.sourceIds?.some(id => !sources.has(id))) ctx.addIssue({ code: 'custom', path: ['claims', index], message: '존재하지 않는 source ID입니다.' });
    if (claim.verification === 'verified' && claim.kind !== 'interpretation' &&
      (!claim.sourceIds?.length || claim.sourceIds.some(id => sources.get(id)?.verification !== 'verified'))) {
      ctx.addIssue({ code: 'custom', path: ['claims', index], message: '확인된 주장에는 확인된 문헌 연결이 필요합니다.' });
    }
  });
});
export function reviewResearch(input: unknown): string[] {
  const parsed = validateMasterDraft(input);
  if (!parsed.success) return parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
  const brief = parsed.data.extensions?.research;
  if (brief === undefined) return [];
  const checked = research.safeParse(brief);
  return checked.success ? [] : checked.error.issues.map(issue => `extensions.research.${issue.path.join('.')}: ${issue.message}`);
}
const escape = (value: string) => value.replace(/~/g, '~0').replace(/\//g, '~1');
function changes(before: unknown, after: unknown, path = ''): string[] {
  if (isDeepStrictEqual(before, after)) return [];
  if (before === undefined && after !== null && typeof after === 'object') {
    const entries = Object.entries(after);
    return entries.length ? entries.flatMap(([key, value]) => changes(undefined, value, `${path}/${escape(key)}`)) : [path];
  }
  if (after === undefined && before !== null && typeof before === 'object') {
    const entries = Object.entries(before);
    return entries.length ? entries.flatMap(([key, value]) => changes(value, undefined, `${path}/${escape(key)}`)) : [path];
  }
  if (before === null || after === null || typeof before !== 'object' || typeof after !== 'object' || Array.isArray(before) !== Array.isArray(after)) return [path];
  const a = before as Record<string, unknown>;
  const b = after as Record<string, unknown>;
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap(key =>
    changes(a[key], b[key], `${path}/${escape(key)}`));
}
/** Read-only guard. Allowed JSON Pointers must come from the actual user's scope. */
export function reviewCandidate(before: unknown, after: unknown, allowed: string[]) {
  const errors: string[] = [];
  const a = validateMasterDraft(before);
  const b = validateMasterDraft(after);
  if (!a.success || !b.success) return { changedPaths: [], errors: ['기준/후보가 Master Draft v1 검증에 실패했습니다.'] };
  if (!allowed.length || allowed.some(path => !/^\/(?:[^~]|~[01])+$/.test(path))) errors.push('허용 범위는 비어 있지 않은 JSON Pointer여야 합니다.');
  const changedPaths = changes(before, after);
  for (const key of ['schemaVersion', 'id', 'status'] as const) if (a.data[key] !== b.data[key]) errors.push(`보호된 루트 필드 변경: ${key}`);
  for (const path of changedPaths) if (!allowed.some(scope => path === scope || path.startsWith(`${scope}/`))) errors.push(`범위 밖 변경: ${path}`);
  const preserve = (oldIds: string[], newIds: string[], label: string) => {
    if (oldIds.some(id => !newIds.includes(id))) errors.push(`기존 ID 삭제/교체: ${label}`);
  };
  preserve(a.data.story?.scenes.map(s => s.id) ?? [], b.data.story?.scenes.map(s => s.id) ?? [], 'story.scenes');
  preserve(a.data.thinking?.activities.map(s => s.id) ?? [], b.data.thinking?.activities.map(s => s.id) ?? [], 'thinking.activities');
  a.data.thinking?.activities.forEach(activity => preserve(activity.steps?.map(s => s.id) ?? [],
    b.data.thinking?.activities.find(s => s.id === activity.id)?.steps?.map(s => s.id) ?? [], activity.id));
  errors.push(...reviewResearch(after));
  return { changedPaths, errors };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [beforePath, afterPath, ...allowed] = process.argv.slice(2);
  if (!beforePath || !afterPath || !allowed.length) {
    console.error('사용법: node --experimental-strip-types .agents/skills/philo-book-author/scripts/review-candidate.ts <기준.json> <후보.json> /허용/경로 [...]');
    process.exitCode = 1;
  } else {
    try {
      const result = reviewCandidate(JSON.parse(await readFile(beforePath, 'utf8')), JSON.parse(await readFile(afterPath, 'utf8')), allowed);
      console.log(JSON.stringify(result, null, 2));
      if (result.errors.length) process.exitCode = 1;
    } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
  }
}
