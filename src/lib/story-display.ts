/** Conservative display-only breaks. Ambiguous labels, nested/unclosed quotes stay intact. */
export function formatStoryDialogue(text: string): string {
  const pairs: Record<string, string> = { '“': '”', '‘': '’', '"': '"', "'": "'" };
  const ranges: { start: number; end: number }[] = [];
  let start = -1;
  const stack: string[] = [];
  let nested = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    // Apostrophes inside Latin words are not delimiters. Korean quote + particle
    // (e.g. '피코'가) must still close the quotation.
    if (char === "'" && /[\p{Script=Latin}\p{N}]/u.test(text[i - 1] ?? '') && /[\p{Script=Latin}\p{N}]/u.test(text[i + 1] ?? '')) continue;
    if (stack.length && char === stack.at(-1)) {
      stack.pop();
      if (!stack.length) {
        const inner = text.slice(start + 1, i);
        const suffix = text.slice(i + 1);
        // A short single-quoted exclamation may be a sound effect ('뚝!').
        // Preserve ambiguous fragments inline instead of inventing speech.
        const shortFragment = (text[start] === "'" || text[start] === '‘') && /^[가-힣]{1,3}[!！]$/u.test(inner);
        if (!nested && !shortFragment && /[.!?…。！？][\s]*$/u.test(inner) &&
            !/^(?:라는|이라는|란|이란|라고|이라고|[의을를은는이가에로와과]|처럼|보다)/u.test(suffix)) {
          ranges.push({ start, end: i + 1 });
        }
      }
    } else if (pairs[char]) {
      if (!stack.length) { start = i; nested = false; }
      else nested = true;
      stack.push(pairs[char]);
    }
  }
  const breaks = new Set<number>();
  for (const range of ranges) {
    if (text.slice(0, range.start).trim() && !/(?:\r?\n)[ \t]*$/.test(text.slice(0, range.start))) breaks.add(range.start);
    if (text.slice(range.end).trim() && !/^[ \t]*(?:\r?\n)/.test(text.slice(range.end))) breaks.add(range.end);
  }
  let lastBreak = -1;
  for (const index of [...breaks].sort((a, b) => a - b)) {
    if (lastBreak >= 0 && !text.slice(lastBreak, index).trim()) breaks.delete(index);
    else lastBreak = index;
  }
  return Array.from({ length: text.length + 1 }, (_, i) => (breaks.has(i) ? '\n' : '') + (text[i] ?? '')).join('');
}
