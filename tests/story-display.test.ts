import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { formatStoryDialogue as format } from '../src/lib/story-display.ts';

test('separates spoken dialogue and thoughts with each supported quote pair', () => {
  for (const [left, right] of [['“', '”'], ['"', '"'], ['‘', '’'], ["'", "'"]]) {
    assert.equal(format(`앞 문장. ${left}난 좋아!${right} 두두가 외쳤어요. ${left}재밌거든!${right}`),
      `앞 문장. \n${left}난 좋아!${right}\n 두두가 외쳤어요. \n${left}재밌거든!${right}`);
  }
});
test('leaves terms, emphasis, ambiguous phrases, apostrophes and nested quotes alone', () => {
  for (const text of ["'토토'는 친구예요.", '“코나투스”를 배워요.', '“정말?”이라는 질문.', '‘좋아’ 하고 웃었어요.',
    '“난 ‘토토!’라고 말했어.” 다음 문장.', '“닫히지 않은 대사!', "It's a fox's tail."]) {
    assert.equal(format(text), text);
  }
});
test('preserves existing LF/CRLF paragraphs and avoids duplicate breaks', () => {
  for (const eol of ['\n', '\r\n']) {
    const text = `“난 땅굴 미로가 좋아!”${eol}두두가 외쳤어요.${eol}“어둡고 좁을수록 재밌거든!”${eol}${eol}토토는 달리기 트랙을 가리켰어요.`;
    assert.equal(format(text), text);
  }
  const text = '“안녕!” “반가워!”';
  assert.equal(format(text), '“안녕!”\n “반가워!”');
  assert.equal(format(format(text)), format(text));
});
test('all registered story text keeps every original character in order', () => {
  for (const name of fs.readdirSync('src/content/books')) {
    const book = JSON.parse(fs.readFileSync(`src/content/books/${name}`, 'utf8'));
    for (const page of book.pages) {
      const displayed = format(page.text);
      // Only newline insertion is permitted; existing spaces and punctuation remain.
      assert.equal(displayed.replaceAll('\n', ''), page.text.replaceAll('\n', ''));
      assert.equal(format(displayed), displayed);
    }
  }
});

test('Korean named quotes close before particles, allowing later dialogue to break', () => {
  for (const name of ["'피코'가", "'기리'는", "'두두'도", "'토토'를"]) {
    const text = `${name} 말했어요. "난 하늘을 나는 게 좋아!" 친구가 웃었어요.`;
    const result = format(text);
    assert.equal(result, `${name} 말했어요. \n"난 하늘을 나는 게 좋아!"\n 친구가 웃었어요.`);
    assert.equal(format(result), result);
  }
  const pico = JSON.parse(fs.readFileSync('src/content/books/pico-silver-feather.json', 'utf8'));
  assert.match(format(pico.pages[0].text), /했어요\. \n"내가 제일 높이 날 거야!"\n/);
  const ep05 = JSON.parse(fs.readFileSync('src/content/books/ep05.json', 'utf8'));
  assert.match(format(ep05.pages[1].text), /말했어요\. \n"난 땅굴 미로가 좋아/);
});
test('short ambiguous sound-effect fragments and real terms stay inline', () => {
  for (const fragment of ["'뚝!'", '‘쿵!’', "'이겨야만 해'라는", "'비밀의 망토'란다"]) {
    const text = `앞 문장 ${fragment} 다음 문장.`;
    assert.equal(format(text), text);
  }
  assert.equal(format("It's fine. '난 할 수 있어!' 친구가 웃었어요."), "It's fine. \n'난 할 수 있어!'\n 친구가 웃었어요.");
});
