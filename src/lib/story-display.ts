/** Conservative display-only breaks. Ambiguous labels, nested/unclosed quotes stay intact. */
export function formatStoryDialogue(text: string): string {
  const pairs: Record<string, string> = { '“': '”', '‘': '’', '"': '"', "'": "'" };
  const ranges: { start: number; end: number }[] = [];
  let start = -1;
  const stack: string[] = [];
  let nested = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    // An apostrophe within a word is not a quotation delimiter.
    if (char === "'" && /[\p{L}\p{N}]/u.test(text[i - 1] ?? '') && /[\p{L}\p{N}]/u.test(text[i + 1] ?? '')) continue;
    if (stack.length && char === stack.at(-1)) {
      stack.pop();
      if (!stack.length) {
        const inner = text.slice(start + 1, i);
        const suffix = text.slice(i + 1);
        if (!nested && /[.!?…。！？][\s]*$/u.test(inner) &&
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
