import { z } from 'astro/zod';

const text = z.string().refine(value => value.trim().length > 0, '빈 문자열은 사용할 수 없습니다.');
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, '소문자·숫자·하이픈 ID를 사용하세요.');
// Explicit extension bags preserve experimental fields without hiding misspelled keys.
const extensions = z.record(z.string(), z.unknown()).optional();
const scene = z.strictObject({ id, text: text.optional(), parentHint: text.optional(), extensions });
const step = z.strictObject({
  id, title: text.optional(), goal: text.optional(), questions: z.array(text).optional(),
  explanation: text.optional(), extensions,
});
const activity = z.strictObject({
  id, title: text.optional(), description: text.optional(),
  steps: z.array(step).optional(), references: z.array(text).optional(), extensions,
});
export const masterDraftSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id,
  status: z.enum(['draft', 'review', 'ready', 'archived']),
  metadata: z.strictObject({
    title: text.optional(), theme: text.optional(), summary: text.optional(),
    categories: z.array(text).optional(), ageGroups: z.array(text).optional(), extensions,
  }).optional(),
  story: z.strictObject({ scenes: z.array(scene), extensions }).optional(),
  essay: z.strictObject({
    title: text.optional(), subtitle: text.optional(), body: text.optional(),
    tags: z.array(text).optional(), extensions,
  }).optional(),
  thinking: z.strictObject({ activities: z.array(activity), extensions }).optional(),
  images: z.array(z.strictObject({
    sceneId: id, prompt: text.optional(), negativePrompt: text.optional(),
    assetPath: text.optional(), alt: text.optional(), extensions,
  })).optional(),
  extensions,
}).superRefine((draft, ctx) => {
  const unique = (items: { id: string }[], path: (string | number)[]) => {
    const seen = new Set<string>();
    items.forEach((item, i) => {
      if (seen.has(item.id)) ctx.addIssue({ code: 'custom', path: [...path, i, 'id'], message: `ID 중복: ${item.id}` });
      seen.add(item.id);
    });
  };
  const scenes = draft.story?.scenes ?? [];
  unique(scenes, ['story', 'scenes']);
  unique(draft.thinking?.activities ?? [], ['thinking', 'activities']);
  draft.thinking?.activities.forEach((item, i) => unique(item.steps ?? [], ['thinking', 'activities', i, 'steps']));
  const sceneIds = new Set(scenes.map(item => item.id));
  const imageScenes = new Set<string>();
  draft.images?.forEach((image, i) => {
    if (!sceneIds.has(image.sceneId)) ctx.addIssue({ code: 'custom', path: ['images', i, 'sceneId'], message: '존재하지 않는 장면 참조입니다.' });
    if (imageScenes.has(image.sceneId)) ctx.addIssue({ code: 'custom', path: ['images', i, 'sceneId'], message: '같은 장면의 이미지 항목이 중복되었습니다.' });
    imageScenes.add(image.sceneId);
  });
});
export type MasterDraft = z.infer<typeof masterDraftSchema>;
export type DraftStatus = MasterDraft['status'];

/** Unknown versions and keys fail explicitly; the input is never mutated/defaulted. */
export function validateMasterDraft(input: unknown) {
  return masterDraftSchema.safeParse(input);
}
