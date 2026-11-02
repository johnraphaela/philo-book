import { validateMasterDraft, type MasterDraft } from './schema.ts';

export interface Diagnostic {
  severity: 'error' | 'warning';
  code: string;
  path: string;
  message: string;
}
/** In-memory artifacts only. Writing paths, overwriting and publishing are separate concerns. */
export interface AstroArtifacts {
  book: {
    title: string; theme: string; categories: string[]; ageGroups: string[];
    summary?: string;
    pages: { image: string; text: string; hint?: string; imageAlt?: string }[];
    harvardPlay?: { title: string; desc: string }[];
  };
  essay?: {
    frontmatter: { title: string; bookId: string; tags: string[]; subtitle?: string };
    body: string;
  };
}
export type ConversionResult<T> =
  | { ok: true; artifacts: T; diagnostics: Diagnostic[] }
  | { ok: false; diagnostics: Diagnostic[]; artifacts?: never };

/** Contract for a later converter. No file generator or converter is implemented here. */
export interface PublicationAdapter<T> {
  target: string;
  supportedSchemaVersion: 1;
  inspect(input: unknown): Diagnostic[];
  convert(draft: MasterDraft): ConversionResult<T>;
}
export type AstroAdapter = PublicationAdapter<AstroArtifacts>;

/** Checks explicit source values required by today's Astro format, without inventing them. */
export function inspectAstroDraft(input: unknown): Diagnostic[] {
  const result = validateMasterDraft(input);
  if (!result.success) return result.error.issues.map(issue => ({
    severity: 'error', code: 'invalid-draft', path: issue.path.join('.'), message: issue.message,
  }));
  const draft = result.data;
  const diagnostics: Diagnostic[] = [];
  const add = (severity: Diagnostic['severity'], code: string, path: string, message: string) =>
    diagnostics.push({ severity, code, path, message });
  if (draft.status !== 'ready') add('error', 'not-ready', 'status', '출판 검토 전 상태입니다. ready 여부를 사람이 결정해야 합니다.');
  for (const key of ['title', 'theme', 'categories', 'ageGroups'] as const) {
    if (draft.metadata?.[key] === undefined) add('error', 'missing-field', `metadata.${key}`, '현재 Astro 출판 형식의 필수값이 없습니다.');
  }
  if (!draft.story?.scenes.length) add('error', 'missing-scenes', 'story.scenes', '출판할 장면이 한 개 이상 필요합니다.');
  draft.story?.scenes.forEach((scene, i) => {
    if (scene.text === undefined) add('error', 'missing-field', `story.scenes.${i}.text`, '장면 본문이 없습니다.');
    const imageIndex = draft.images?.findIndex(image => image.sceneId === scene.id) ?? -1;
    const image = imageIndex < 0 ? undefined : draft.images?.[imageIndex];
    if (!image?.assetPath) add('error', 'missing-image', `story.scenes.${i}`, '프롬프트는 이미지 파일 경로를 대신할 수 없습니다.');
    else add('warning', 'asset-unverified', `images.${imageIndex}.assetPath`, '실제 이미지 파일의 존재 여부는 별도 확인해야 합니다.');
  });
  if (draft.essay) {
    for (const key of ['title', 'body', 'tags'] as const) {
      if (draft.essay[key] === undefined) add('error', 'missing-field', `essay.${key}`, '에세이 출판에 필요한 명시적 원문이 없습니다.');
    }
  }
  draft.thinking?.activities.forEach((activity, i) => {
    if (!activity.title || !activity.description) add('error', 'mapping-required', `thinking.activities.${i}`, '현재 harvardPlay에는 title·desc가 필요합니다. 구조화된 단계의 변환 규칙을 먼저 정해야 합니다.');
    if (activity.steps?.length || activity.references?.length) add('warning', 'structured-content', `thinking.activities.${i}`, '별도 단계·참고자료를 유실하지 않는 변환 정책이 필요합니다.');
  });
  if (draft.images?.some(image => image.prompt || image.negativePrompt)) add('warning', 'authoring-only', 'images', '이미지 프롬프트는 제작용이며 현재 출판 스키마에는 포함되지 않습니다.');
  const seen = new WeakSet<object>();
  const hasExtensions = (value: unknown): boolean => {
    if (!value || typeof value !== 'object' || seen.has(value)) return false;
    seen.add(value);
    return Object.entries(value).some(([key, item]) =>
      (key === 'extensions' && item !== undefined) || hasExtensions(item));
  };
  if (hasExtensions(draft)) add('warning', 'extensions-unmapped', 'extensions', '실험 필드의 출판 여부를 어댑터에서 명시적으로 결정해야 합니다.');
  return diagnostics;
}
