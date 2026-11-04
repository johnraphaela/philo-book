import { bookSchema } from '../src/lib/content-schema.ts';
import { CONTENT_SUBTOPICS } from '../src/lib/taxonomy.ts';

export const metadataFields = {
  'Recommended Age': 'recommendedAge', 'Primary Category': 'primaryCategory', Subtopics: 'subtopics', 'Core Question': 'coreQuestion',
  'Dialogue Questions': 'dialogueQuestions', 'Parent Reflection Question': 'parentReflectionQuestion',
} as const;
export const metadataSchema = bookSchema.pick({ primaryCategory: true, subtopics: true, coreQuestion: true,
  dialogueQuestions: true, parentReflectionQuestion: true, recommendedAge: true });

/** Check only supplied fields; never invent values or rewrite question wording. */
export function validateImportMetadata(input: unknown) {
  const parsed = metadataSchema.safeParse(input);
  if (!parsed.success) throw new Error('Metadata: ' + parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; '));
  const data = parsed.data;
  if (data.subtopics && new Set(data.subtopics).size !== data.subtopics.length) throw new Error('Metadata / Subtopics: 중복 ID');
  for (const id of data.subtopics ?? []) {
    const topic = CONTENT_SUBTOPICS.find(topic => topic.id === id)!;
    if (data.primaryCategory && topic.group !== data.primaryCategory) throw new Error(`Metadata / Subtopics: ${id}의 그룹 ${topic.group}이 Primary Category ${data.primaryCategory}와 다릅니다.`);
  }
  const seen = new Set<string>();
  for (const [field, values] of [['Core Question', data.coreQuestion === undefined ? [] : [data.coreQuestion]],
    ['Dialogue Questions', data.dialogueQuestions ?? []],
    ['Parent Reflection Question', data.parentReflectionQuestion === undefined ? [] : [data.parentReflectionQuestion]]] as const) {
    for (const text of values) {
      if (!text.trim()) throw new Error(`Metadata / ${field}: 빈 질문`);
      const key = text.trim().replace(/\s+/g, ' ');
      if (seen.has(key)) throw new Error(`Metadata / ${field}: 중복 질문 (${text})`);
      seen.add(key);
    }
  }
  if (data.dialogueQuestions) data.dialogueQuestions = data.dialogueQuestions.map(text => text.trim());
  if (data.parentReflectionQuestion !== undefined) data.parentReflectionQuestion = data.parentReflectionQuestion.trim();
  return data;
}

export function parseImportMetadata(meta: Record<string, string>, lines: Record<string, number>) {
  const candidate: Record<string, unknown> = {};
  for (const [label, field] of Object.entries(metadataFields)) {
    if (!Object.hasOwn(meta, label)) continue;
    const value = meta[label].trim();
    const fail = (message: string): never => { throw new Error(`원고 ${lines[label]}행 / Metadata / ${label}: ${message}`); };
    if (!value) fail('빈 값');
    if (field === 'dialogueQuestions' && /^(?:[-*]|\d+[.)])$/.test(value)) fail('빈 질문 항목');
    if (field === 'recommendedAge') {
      const range = /^(\d{1,2})\s*-\s*(\d{1,2})$/.exec(value);
      if (!range) fail('최소-최대 형식(예: 5-10)이 필요합니다.');
      candidate[field] = { min: Number(range![1]), max: Number(range![2]) };
    } else if (field === 'subtopics' || field === 'dialogueQuestions') {
      let items: unknown;
      if (value.startsWith('[')) {
        try { items = JSON.parse(value); } catch { fail('올바른 JSON 문자열 배열이 필요합니다.'); }
      } else if (field === 'dialogueQuestions' && !value.includes('\n') && !/^\s*(?:[-*]|\d+[.)])\s/.test(value)) {
        items = value.split('|').map(question => question.trim());
      } else if (field === 'subtopics') {
        items = value.split('\n').filter(line => line.trim()).flatMap(line => line.split(',')).map(line => line.replace(/^\s*[-*]\s+/, '').trim());
      } else {
        items = value.split('\n').filter(line => line.trim()).map(line => {
          const match = /^\s*(?:[-*]|\d+[.)])\s+(.+)$/.exec(line);
          if (!match) fail('질문은 한 줄 파이프 구분, Markdown 목록(- 질문 또는 1. 질문), JSON 문자열 배열로 작성하세요.');
          return match![1].trim();
        });
      }
      if (!Array.isArray(items) || items.some(item => typeof item !== 'string' || !item.trim())) fail('빈 항목 없는 문자열 배열이 필요합니다.');
      candidate[field] = items;
    } else candidate[field] = value;
  }
  try { return validateImportMetadata(candidate); }
  catch (error) { throw new Error(`원고 Metadata (필드 행: ${Object.entries(lines).map(([key, line]) => `${key}=${line}`).join(', ')}): ${error instanceof Error ? error.message : String(error)}`); }
}
