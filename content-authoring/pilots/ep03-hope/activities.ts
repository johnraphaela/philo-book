import assert from 'node:assert/strict';

/** ep03-only editorial arrangement; source files and Master Draft stay immutable. */
export function arrangeHopeActivities(original: { title: string; desc: string }[], moved: string) {
  const first = moved.indexOf('#### 1) ');
  const second = moved.indexOf('#### 2) ');
  const conclusion = moved.indexOf('희망은 미래의 기적이 아니라,');
  const section4 = moved.indexOf('### 4. 일상에서 실천하는 철학 놀이');
  assert.ok(first > 0 && second > first && conclusion > second && section4 > conclusion);
  const intro = moved.slice(0, first).trim();
  const dialogue = (section: string, number: number) => {
    const [heading, ...lines] = section.trim().split('\n');
    return `대화 ${number} [${heading.replace(/^#### \d\) /, '')}]\n질문과 대화:\n${lines.join('\n').trim()}`;
  };
  const closing = moved.slice(conclusion, section4).replace(/\n\n---\s*$/, '').trim();
  const play = moved.slice(section4).split('\n').filter(line => /^\d\. \*\*/.test(line));
  assert.equal(play.length, 2);
  const variants = play.map(line => line.replace(/^\d\. /, ''));
  return [{
    title: '5~7세 아이와 나누는 대화법 (하버드 Serve & Return 적용)',
    desc: [intro, dialogue(moved.slice(first, second), 1), dialogue(moved.slice(second, conclusion), 2), `마무리:\n${closing}`].join('\n\n'),
  }, {
    title: '일상에서 실천하는 철학 놀이',
    desc: [
      '활동 1 [물과 햇빛으로 만드는 무지개]',
      '준비물:\n투명한 컵, 물, 햇빛 또는 손전등, 흰 도화지. 확장 탐험: 유리잔, 분무기, 거울.',
      `방법:\n${original[0].desc}\n\n${variants[0]}`,
      '활동 2 [바람을 행동으로 바꾸기]',
      '준비물:\n종이 (소망의 디딤돌 그리기).',
      `방법:\n${original[1].desc}\n\n${variants[1]}`,
    ].join('\n\n'),
  }];
}
