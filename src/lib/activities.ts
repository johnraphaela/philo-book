export interface ActivityStep {
  label?: string;
  number: string;
  title: string;
  goal: string;
  blocks: { kind: 'question' | 'explanation'; text: string; label?: string }[];
}
/** Parse only explicit legacy markers. Never invent steps or rewrite their text. */
export function parseActivity(desc: string): { intro: string; steps: ActivityStep[]; outro?: string } {
  // Opt-in section markers keep legacy parsing and reference entries unchanged.
  const structuredLines = desc.replace(/\r\n/g, '\n').split('\n');
  if (structuredLines.some(line => /^(대화|활동) \d+ \[[^\]]+\]$/.test(line))) {
    const intro: string[] = [];
    const outro: string[] = [];
    const steps: ActivityStep[] = [];
    let current: ActivityStep | undefined;
    let block: ActivityStep['blocks'][number] | undefined;
    let closing = false;
    for (const line of structuredLines) {
      const marker = /^(대화|활동) (\d+) \[([^\]]+)\]$/.exec(line);
      if (marker) {
        current = { label: marker[1], number: marker[2], title: marker[3], goal: '', blocks: [] };
        steps.push(current); block = undefined; closing = false;
      } else if (line === '마무리:') {
        closing = true; current = undefined; block = undefined;
      } else if (closing) outro.push(line);
      else if (!current) intro.push(line);
      else {
        const label = /^(준비물|방법|질문과 대화|질문):$/.exec(line);
        if (label) {
          block = { kind: label[1].startsWith('질문') ? 'question' : 'explanation', label: label[1], text: '' };
          current.blocks.push(block);
        } else {
          if (!block && !line.trim()) continue;
          if (!block) {
            block = { kind: current.label === '대화' ? 'question' : 'explanation', text: '' };
            current.blocks.push(block);
          }
          block.text += (block.text ? '\n' : '') + line;
        }
      }
    }
    for (const step of steps) for (const item of step.blocks) item.text = item.text.trim();
    return { intro: intro.join('\n').trim(), steps, outro: outro.join('\n').trim() };
  }
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
