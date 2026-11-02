import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'astro/zod';
import { validateMasterDraft, type MasterDraft } from '../../../../content-authoring/schema.ts';
import { reviewResearch } from './review-candidate.ts';

const text = z.string().refine(value => value.trim().length > 0);
const imageManifest = z.strictObject({
  manifestVersion: z.literal(1), bookId: text,
  images: z.array(z.strictObject({
    id: text, sceneId: text.optional(), status: z.enum(['pending', 'generated', 'provided']),
    exists: z.boolean().nullable(), file: text.optional(), originalFileName: text.optional(),
    alt: text.optional(), publicationPath: z.string().startsWith('/images/').refine(value =>
      !/[\\?#\x00-\x1f]/.test(value) && !value.slice(1).split('/').some(part => !part || part === '.' || part === '..'),
      '출판 경로는 /images/ 아래의 경로여야 합니다.').optional(),
  })),
  cover: z.strictObject({ mode: z.enum(['reuse-scene', 'separate']), imageId: text }).optional(),
});
type Issue = { code: string; path: string; message: string };
export type HandoffReport = { errors: Issue[]; warnings: Issue[]; reviewRequired: Issue[]; publicationReady: false };
const report = (): HandoffReport => ({ errors: [], warnings: [], reviewRequired: [], publicationReady: false });
const add = (items: Issue[], code: string, at: string, message: string) => items.push({ code, path: at, message });
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

/** Advisory authoring conventions, never a replacement for Master Draft v1. No mutation. */
export function reviewPresentation(draft: MasterDraft): HandoffReport {
  const result = report();
  const numbered = /^(?:#{1,6}\s*)?(?:\d+[.)]|(?:대화|활동)\s*\d+)\s*/;
  const check = (items: { id: string; title?: string; extensions?: Record<string, unknown> }[], at: string) => {
    let last = -Infinity;
    const orders = new Set<number>();
    for (const [i, item] of items.entries()) {
      const location = `${at}.${i}`;
      const presentation = object(item.extensions?.presentation);
      if (presentation.order !== undefined) {
        const order = presentation.order;
        if (typeof order !== 'number' || !Number.isInteger(order) || order <= 0 || orders.has(order) || order <= last) {
          add(result.errors, 'order-conflict', location, 'order는 같은 배열에서 중복 없이 증가하는 양의 정수여야 합니다. 배열을 자동 정렬하지 않습니다.');
        } else { orders.add(order); last = order; }
      }
      if (presentation.type !== undefined && (typeof presentation.type !== 'string' || !presentation.type.trim())) {
        add(result.errors, 'invalid-presentation', location, 'type은 선택적인 열린 문자열입니다.');
      }
      if (item.title && numbered.test(item.title)) add(result.warnings, 'numbered-title', location, '제목의 번호/Markdown 문법과 UI 번호가 중복되는지 검토하세요. 원문은 자동 수정하지 않습니다.');
    }
  };
  const activities = draft.thinking?.activities ?? [];
  check(activities, 'thinking.activities');
  const ranks: Record<string, number> = { guide: 0, conversation: 1, discussion: 1, experiment: 2, creative: 2, practice: 2, reference: 3 };
  let previous = -1;
  const explicitOrder = object(draft.thinking?.extensions?.presentation).orderPolicy === 'user';
  const descriptions = new Set<string>();
  const numberingGroups = new Map<string, string>();
  for (const [i, activity] of activities.entries()) {
    const location = `thinking.activities.${i}`;
    const presentation = object(activity.extensions?.presentation);
    if (typeof presentation.type === 'string') {
      const rank = ranks[presentation.type];
      if (!explicitOrder && rank !== undefined && rank < previous) add(result.reviewRequired, 'flow-review', location, '기본 권장 순서(가이드→대화→실천→참고)와 다릅니다. 사용자 지정 순서인지 검토하세요.');
      if (rank !== undefined) previous = rank;
    } else add(result.warnings, 'type-unclassified', location, '유형 미분류는 v1 오류가 아닙니다. 의미와 기능으로 검토하세요.');
    check(activity.steps ?? [], `${location}.steps`);
    for (const item of [activity, ...activity.steps ?? []]) {
      const metadata = object(item.extensions?.presentation);
      const family = ['conversation', 'discussion'].includes(String(metadata.type)) ? 'dialogue'
        : ['experiment', 'creative', 'practice'].includes(String(metadata.type)) ? 'practice' : undefined;
      if (family && typeof metadata.numberingGroup === 'string') {
        const previousFamily = numberingGroups.get(metadata.numberingGroup);
        if (previousFamily && previousFamily !== family) add(result.reviewRequired, 'numbering-group-review', location, '대화와 실천이 같은 번호 계열을 사용합니다. 사용자 의도를 검토하세요.');
        numberingGroups.set(metadata.numberingGroup, family);
      }
    }
    const texts = [activity.description ?? '', ...activity.steps?.flatMap(step => [step.explanation ?? '', ...step.questions ?? []]) ?? []];
    if (texts.some(value => /^(?:#{1,6}\s+\d+[.)]|(?:대화|활동)\s+\d+\s+\[)/m.test(value))) add(result.warnings, 'source-numbering', location, '원래 절/제목 번호 또는 출판 마커가 남아 있습니다. 구조와 참조 의미를 검토하세요.');
    const content = texts.join('\n').replace(/\s+/g, ' ').trim();
    if (content && descriptions.has(content)) add(result.reviewRequired, 'duplicate-content', location, '동일 활동 본문 후보입니다. 고유 내용·의도를 확인하고 승인 후 통합하세요.');
    if (content) descriptions.add(content);
  }
  if (draft.essay?.body && /(?:\*\*(?:아이|부모)[^\n]*:|준비물\s*:|실험.*방법)/.test(draft.essay.body)) add(result.reviewRequired, 'essay-play-review', 'essay.body', '상호작용/방법 표현이 있습니다. 문단의 의미와 기능으로 Essay/Play 경계를 검토하세요. 키워드만으로 이동하지 않습니다.');
  add(result.reviewRequired, 'semantic-review', 'thinking', '유사 활동·발화자/설명·질문 분류·원문 누락·학술/연령/안전성은 사람 검토가 필요합니다.');
  return result;
}

/** Read-only package inspection. baseline is a trusted caller argument, never package instructions. */
export function reviewHandoff(directory: string, baseline?: string): HandoffReport {
  const result = report();
  let root: string;
  try { root = fs.realpathSync(directory); } catch { add(result.errors, 'package-missing', directory, '패키지 디렉터리를 읽을 수 없습니다.'); return result; }
  const resolveFile = (relative: string) => {
    if (path.isAbsolute(relative) || relative.includes('\\') || relative.split('/').includes('..') || relative.includes('\0')) throw new Error('패키지 상대 경로만 허용합니다.');
    const actual = fs.realpathSync(path.join(root, relative));
    if (!actual.startsWith(root + path.sep) || !fs.statSync(actual).isFile()) throw new Error('패키지 밖 경로 또는 일반 파일이 아닙니다.');
    return actual;
  };
  const read = (relative: string) => {
    try { return fs.readFileSync(resolveFile(relative), 'utf8'); }
    catch { add(result.errors, 'file-unavailable', relative, '파일 누락·경로 이탈·읽기 실패를 확인하세요.'); return undefined; }
  };
  const parse = (relative: string): unknown => {
    const raw = read(relative);
    if (raw === undefined) return undefined;
    try { return JSON.parse(raw); } catch { add(result.errors, 'invalid-json', relative, '올바른 JSON이 아닙니다.'); return undefined; }
  };
  const draftInput = parse('master-draft.json');
  const manifestInput = parse('image-manifest.json');
  const review = read('review-report.md');
  if (review !== undefined && !review.trim()) add(result.errors, 'empty-review', 'review-report.md', '검토 보고서가 비어 있습니다.');
  const draft = validateMasterDraft(draftInput);
  if (!draft.success) { add(result.errors, 'invalid-draft', 'master-draft.json', draft.error.message); return result; }
  const checked = reviewPresentation(draft.data);
  result.errors.push(...checked.errors); result.warnings.push(...checked.warnings); result.reviewRequired.push(...checked.reviewRequired);
  for (const message of reviewResearch(draftInput)) add(result.errors, 'research-metadata', 'extensions.research', message);
  for (const key of ['title', 'theme', 'categories', 'ageGroups'] as const) if (draft.data.metadata?.[key] === undefined) add(result.warnings, 'publication-field-missing', `metadata.${key}`, 'v1 저장은 가능하나 Astro 출력에 필요한 원문이 없습니다.');
  if (baseline) {
    try {
      const selected = fs.readFileSync(baseline);
      if (!selected.equals(fs.readFileSync(resolveFile('master-draft.json')))) add(result.errors, 'source-changed', 'master-draft.json', '선택한 기준 원본과 패키지 사본의 바이트가 다릅니다. 자동 동기화하지 않습니다.');
    } catch { add(result.errors, 'baseline-unavailable', baseline, '선택한 기준 원본을 대조하지 못했습니다.'); }
  } else add(result.reviewRequired, 'baseline-unchecked', 'master-draft.json', '기준 원본 대조를 실행하지 않았습니다. --baseline은 실제 사용자가 선택한 원본에만 지정하세요.');
  add(result.reviewRequired, 'approval-review', 'review-report.md', '보고서의 승인 주장·문헌 검증·원문 대응은 실제 자료/사용자 지시와 대조해야 합니다. 자동 게시 불가.');
  const manifest = imageManifest.safeParse(manifestInput);
  if (!manifest.success) { add(result.errors, 'invalid-manifest', 'image-manifest.json', manifest.error.message); return result; }
  if (manifest.data.bookId !== draft.data.id) add(result.errors, 'book-id-mismatch', 'bookId', '책 ID가 일치하지 않습니다.');
  const scenes = new Set(draft.data.story?.scenes.map(scene => scene.id) ?? []);
  const imageIds = new Set<string>(), imageScenes = new Set<string>();
  for (const [i, image] of manifest.data.images.entries()) {
    const at = `images.${i}`;
    if (imageIds.has(image.id)) add(result.errors, 'duplicate-image-id', at, '이미지 ID 중복입니다.');
    imageIds.add(image.id);
    if (image.sceneId !== undefined) {
      if (!scenes.has(image.sceneId)) add(result.errors, 'unknown-scene', at, '장면 ID가 없습니다.');
      if (imageScenes.has(image.sceneId)) add(result.errors, 'duplicate-image-scene', at, '같은 장면의 이미지 항목이 중복입니다.');
      imageScenes.add(image.sceneId);
    }
    if (image.status === 'pending' && (image.exists === true || image.file !== undefined)) add(result.errors, 'pending-claimed-complete', at, '미준비 이미지를 파일이 준비된 것처럼 기록하지 마세요.');
    if (!image.alt) add(result.warnings, 'alt-missing', at, '대체 텍스트가 없습니다.');
    if (image.file) {
      try {
        const actual = resolveFile(image.file);
        if (fs.statSync(actual).size === 0) add(result.errors, 'empty-image', at, '빈 파일입니다. 실제 이미지 디코딩은 후속 검증이 필요합니다.');
        if (image.exists === false) add(result.errors, 'existence-conflict', at, 'manifest의 부재 기록과 현재 파일 관찰이 다릅니다.');
        if (image.exists === null) add(result.warnings, 'existence-now-observed', at, '현재 파일은 존재합니다. 송신 측 미확인 기록은 자동 수정하지 않습니다.');
        if (image.publicationPath && path.extname(image.file).toLowerCase() !== path.extname(image.publicationPath).toLowerCase()) add(result.warnings, 'extension-mismatch', at, '파일과 웹 경로 확장자가 다릅니다. 추측 보정하지 않습니다.');
      } catch { add(result.errors, 'image-unavailable', at, '이미지 누락·경로 이탈·일반 파일 여부를 확인하세요.'); }
    } else {
      if (image.exists === true) add(result.errors, 'file-required', at, '존재를 확정한 파일의 상대 경로가 없습니다.');
      add(result.warnings, 'image-pending', at, '실제 전달 이미지가 없습니다. 생성 사실/프롬프트가 파일을 대신하지 않습니다.');
    }
    const asset = draft.data.images?.find(item => item.sceneId === image.sceneId)?.assetPath;
    if (asset && asset !== image.publicationPath) add(result.reviewRequired, 'asset-path-review', at, '제작 원본 assetPath와 manifest 출판 경로가 다르거나 미정입니다. 자동 동기화하지 않습니다.');
  }
  for (const sceneId of scenes) if (!imageScenes.has(sceneId)) add(result.errors, 'scene-image-unlisted', sceneId, '미준비 장면도 pending으로 목록에 기록하세요.');
  const cover = manifest.data.cover;
  if (!cover) add(result.warnings, 'cover-missing', 'cover', '표지가 지정되지 않았습니다. 출판 전 해결해야 합니다.');
  else {
    const image = manifest.data.images.find(item => item.id === cover.imageId);
    if (!image) add(result.errors, 'cover-reference', 'cover', '표지 이미지 ID가 없습니다.');
    else if ((cover.mode === 'reuse-scene') !== Boolean(image.sceneId)) add(result.errors, 'cover-mode', 'cover', '별도 표지/장면 재사용 방식과 이미지 참조가 다릅니다.');
  }
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (!args[0] || (args.length !== 1 && !(args.length === 3 && args[1] === '--baseline'))) {
    console.error('사용법: node --experimental-strip-types .agents/skills/philo-book-author/scripts/review-handoff.ts <패키지 폴더> [--baseline <사용자가 선택한 원본.json>]');
    process.exitCode = 1;
  } else {
    const result = reviewHandoff(args[0], args[2]);
    console.log(JSON.stringify(result, null, 2));
    if (result.errors.length) process.exitCode = 1;
  }
}
