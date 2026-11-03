/** Match BookCard's plain-text paragraphs and normal HTML whitespace handling.
 * Do not parse Markdown/HTML: the card displays those characters literally.
 * This normalized value is used for review only, never saved over the source.
 */
function displayedText(value: string): string {
  return value.replace(/[\t\n\f\r ]+/g, ' ').replace(/^ | $/g, '');
}
const characters = new Intl.Segmenter('ko', { granularity: 'grapheme' });
const sentences = new Intl.Segmenter('ko', { granularity: 'sentence' });

function sentenceCount(text: string): number | undefined {
  // Quotes, ellipses, decimals and abbreviations can hide sentence boundaries.
  if (/["“”‘’'()[\]{}…]|\.{2,}|[A-Za-z\d]\./u.test(text)) return undefined;
  const parts = [...sentences.segment(text)].map(part => part.segment.trim());
  // Missing final punctuation or punctuation without a separating space is ambiguous.
  if (!parts.length || parts.some(part => !/[.!?。！？]$/u.test(part)) ||
      /[.!?。！？][^\s.!?。！？]/u.test(text)) return undefined;
  return parts.length;
}

/** Advisory only: report counts and review items, without editing or rejecting copy. */
export function reviewCardMetadata(copy: { theme: string; summary?: string }): string[] {
  const warnings: string[] = [];
  const theme = displayedText(copy.theme);
  const themeLength = [...characters.segment(theme)].length;
  if (themeLength > 20) warnings.push(`Theme ${themeLength}자: 20자 이내 확인`);

  const summary = displayedText(copy.summary ?? '');
  const summaryLength = [...characters.segment(summary)].length;
  const review: string[] = [];
  if (summaryLength < 70 || summaryLength > 110) review.push('70~110자 확인');
  const count = sentenceCount(summary);
  if (count === undefined) review.push('두 문장 여부 검토(자동 판별 불확실)');
  else if (count !== 2) review.push(`정확히 두 문장 확인(현재 ${count}문장)`);
  if (review.length) warnings.push(`Summary ${summaryLength}자: ${review.join(', ')}`);
  return warnings;
}
