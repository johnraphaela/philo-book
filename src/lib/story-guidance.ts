/** Display existing parent content once; never generate or rewrite manuscript text. */
export function getParentGuidance(page: { hint?: string; teachingPoint?: string; interaction?: string }) {
  const seen = new Set<string>();
  return [
    { label: '부모를 위한 안내', text: page.teachingPoint },
    { label: '아이와 나눌 질문', text: page.interaction },
    { label: '부모 힌트', text: page.hint },
  ].flatMap(({ label, text }) => {
    if (!text?.trim() || seen.has(text.trim())) return [];
    seen.add(text.trim());
    return [{ label, text }];
  });
}
