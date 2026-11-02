export interface ActivityStep {
  number: string;
  title: string;
  goal: string;
  blocks: { kind: 'question' | 'explanation'; text: string }[];
}
/** Parse only explicit legacy markers. Never invent steps or rewrite their text. */
export function parseActivity(desc: string): { intro: string; steps: ActivityStep[] } {
  const lines = desc.replace(/\r\n/g, '\n').split('\n');
  const intro: string[] = [];
  const steps: ActivityStep[] = [];
  let current: ActivityStep | undefined;
  for (const line of lines) {
    const match = line.match(/^(\d+)단계\s*\[([^\]]+)\]\s*:\s*(.*)$/);
    if (match) {
      current = { number: match[1], title: match[2], goal: match[3], blocks: [] };
      steps.push(current);
    } else if (current) {
      if (!line.trim()) continue;
      current.blocks.push({ kind: /[?？]/.test(line) ? 'question' : 'explanation', text: line });
    } else intro.push(line);
  }
  return { intro: intro.join('\n').trim(), steps };
}
export function isReferenceActivity(title: string): boolean {
  return /참고|참고문헌|references/i.test(title);
}
