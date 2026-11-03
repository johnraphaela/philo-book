import { createProcessor, compileSync } from '@mdx-js/mdx';
import { z } from 'astro/zod';
import { bookSchema, essaySchema } from '../src/lib/content-schema.ts';
import { validateMasterDraft } from './schema.ts';
import { inspectAstroDraft, type AstroArtifacts, type ConversionResult, type Diagnostic, type PublicationAdapter } from './adapter.ts';

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const optionsSchema = z.strictObject({
  essayId: id.optional(),
  cover: z.discriminatedUnion('mode', [
    z.strictObject({ mode: z.literal('scene'), sceneId: id }),
    z.strictObject({ mode: z.literal('asset'), assetPath: z.string() }),
  ]).optional(),
  order: bookSchema.shape.order.unwrap().optional(),
  recommendedAge: bookSchema.shape.recommendedAge,
  topics: bookSchema.shape.topics.unwrap().optional(),
});
export type AstroOptions = z.infer<typeof optionsSchema>;
export type PublicationArtifacts = AstroArtifacts & { book: AstroArtifacts['book'] & {
  cover?: string; order?: number; recommendedAge?: { min: number; max: number }; topics?: string[];
} };
export const error = (code: string, path: string, message: string): Diagnostic => ({ severity: 'error', code, path, message });

/** Reject executable MDX before compilation; this converter accepts Markdown-only essays. */
export function inspectEssayBody(body: string): Diagnostic[] {
  try {
    const tree = createProcessor({ format: 'mdx' }).parse(body);
    const executable: string[] = [];
    const walk = (node: { type: string; children?: unknown[] }) => {
      if (node.type.startsWith('mdx')) executable.push(node.type);
      node.children?.forEach(child => walk(child as typeof node));
    };
    walk(tree);
    if (executable.length) return [error('executable-mdx', 'essay.body', `Markdown 본문만 지원합니다: ${[...new Set(executable)].join(', ')}`)];
    compileSync(body, { format: 'mdx' }); // Compile only, never evaluate/import the generated code.
    return [];
  } catch (e) { return [error('invalid-mdx', 'essay.body', String(e))]; }
}

/** Pure conversion: no filesystem, inferred metadata, text cleanup or editorial rearrangement. */
export function convertAstroDraft(input: unknown, options: unknown = {}): ConversionResult<PublicationArtifacts> {
  const diagnostics = inspectAstroDraft(input);
  const parsed = validateMasterDraft(input);
  const settings = optionsSchema.safeParse(options);
  if (!settings.success) diagnostics.push(...settings.error.issues.map(i => error('invalid-options', i.path.join('.'), i.message)));
  if (!parsed.success || !settings.success) return { ok: false, diagnostics };
  const draft = parsed.data;
  const config = settings.data;
  for (const [i, activity] of (draft.thinking?.activities ?? []).entries()) {
    if (activity.steps?.length || activity.references?.length)
      diagnostics.push(error('mapping-required', `thinking.activities.${i}`, '구조화된 단계·참고문헌의 직렬화 정책이 없어 변환을 중단합니다.'));
    if (/^(?:(?:대화|활동) \d+ \[|마무리:|\d+단계\s*\[)/m.test(activity.description ?? ''))
      diagnostics.push({ severity: 'warning', code: 'presentation-markers', path: `thinking.activities.${i}.description`, message: '원문에 UI 분할 마커가 있습니다. 렌더링을 수동 검토하세요. 원문은 그대로 보존합니다.' });
  }
  if (draft.essay) diagnostics.push(...inspectEssayBody(draft.essay.body ?? ''));
  if (!draft.essay && config.essayId) diagnostics.push(error('unused-option', 'essayId', '에세이가 없는 원본에 essayId를 지정할 수 없습니다.'));
  let cover: string | undefined;
  if (config.cover?.mode === 'asset') cover = config.cover.assetPath;
  if (config.cover?.mode === 'scene') {
    const sceneId = config.cover.sceneId;
    cover = draft.images?.find(image => image.sceneId === sceneId)?.assetPath;
    if (!cover) diagnostics.push(error('unknown-cover-scene', 'cover.sceneId', '표지가 참조하는 장면 이미지가 없습니다.'));
  }
  if (diagnostics.some(d => d.severity === 'error')) return { ok: false, diagnostics };
  const metadata = draft.metadata!;
  const book: PublicationArtifacts['book'] = {
    title: metadata.title!, theme: metadata.theme!, categories: [...metadata.categories!], ageGroups: [...metadata.ageGroups!],
    ...(metadata.summary !== undefined ? { summary: metadata.summary } : {}),
    ...(cover !== undefined ? { cover } : {}),
    ...(config.order !== undefined ? { order: config.order } : {}),
    ...(config.recommendedAge !== undefined ? { recommendedAge: { ...config.recommendedAge } } : {}),
    ...(config.topics !== undefined ? { topics: [...config.topics] } : {}),
    pages: draft.story!.scenes.map(scene => {
      const image = draft.images!.find(item => item.sceneId === scene.id)!;
      return { image: image.assetPath!, text: scene.text!,
        ...(scene.parentHint !== undefined ? { hint: scene.parentHint } : {}),
        ...(image.alt !== undefined ? { imageAlt: image.alt } : {}),
      };
    }),
    ...(draft.thinking ? { harvardPlay: draft.thinking.activities.map(a => ({ title: a.title!, desc: a.description! })) } : {}),
  };
  const artifacts: PublicationArtifacts = { book };
  if (draft.essay) artifacts.essay = {
    frontmatter: { title: draft.essay.title!, bookId: draft.id, tags: [...draft.essay.tags!],
      ...(draft.essay.subtitle !== undefined ? { subtitle: draft.essay.subtitle } : {}),
    }, body: draft.essay.body!,
  };
  for (const [at, result] of [['book', bookSchema.safeParse(book)], ['essay.frontmatter', artifacts.essay ? essaySchema.safeParse(artifacts.essay.frontmatter) : undefined]] as const) {
    if (result && !result.success) diagnostics.push(...result.error.issues.map(i => error('invalid-artifact', `${at}.${i.path.join('.')}`, i.message)));
  }
  return diagnostics.some(d => d.severity === 'error') ? { ok: false, diagnostics } : { ok: true, artifacts, diagnostics };
}

export const astroAdapter: PublicationAdapter<PublicationArtifacts> = {
  target: 'astro', supportedSchemaVersion: 1, inspect: inspectAstroDraft, convert: convertAstroDraft,
};
