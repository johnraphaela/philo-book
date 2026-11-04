export interface DialogueSource {
  coreQuestion?: string;
  dialogueQuestions?: readonly string[];
  parentReflectionQuestion?: string;
}
export function getDialogueQuestions(source: DialogueSource) {
  const seen = new Set<string>();
  const candidates = [
    { text: source.coreQuestion, label: '오늘의 철학 질문' },
    ...(source.dialogueQuestions ?? []).map(text => ({ text, label: '함께 나눌 질문' })),
    { text: source.parentReflectionQuestion, label: '어른의 성찰 질문' },
  ];
  return candidates.flatMap(({ text, label }) => {
    const question = text?.trim();
    const key = question?.replace(/\s+/g, ' ');
    if (!question || !key || seen.has(key)) return [];
    seen.add(key);
    return [{ text: question, label }];
  });
}
