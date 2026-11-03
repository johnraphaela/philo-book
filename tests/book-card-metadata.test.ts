import test from 'node:test';
import assert from 'node:assert/strict';
import { getLibraryCopy } from '../src/lib/library-copy.ts';
import { reviewCardMetadata as review } from '../scripts/book-card-metadata.ts';

// Two clearly separated Korean sentences with an exact displayed length.
const summaryAt = (length: number) => '가'.repeat(length - 6) + '요. 나요.';

test('inclusive length boundaries with two Korean sentences do not warn', () => {
  for (const length of [70, 110]) {
    assert.equal([...summaryAt(length)].length, length);
    assert.deepEqual(review({ theme: '가'.repeat(20), summary: summaryAt(length) }), []);
  }
});
test('out-of-range metadata gives only actual counts and review items', () => {
  assert.deepEqual(review({ theme: '가'.repeat(21), summary: summaryAt(69) }), [
    'Theme 21자: 20자 이내 확인', 'Summary 69자: 70~110자 확인',
  ]);
  assert.deepEqual(review({ theme: '주제', summary: summaryAt(111) }), ['Summary 111자: 70~110자 확인']);
});
test('one and three clear sentences are advisory mismatches', () => {
  assert.deepEqual(review({ theme: '주제', summary: '가'.repeat(78) + '요.' }), [
    'Summary 80자: 정확히 두 문장 확인(현재 1문장)',
  ]);
  const summary = '가'.repeat(70) + '요. 나요! 다요?';
  assert.match(review({ theme: '주제', summary })[0], /정확히 두 문장 확인\(현재 3문장\)/);
});
test('uncertain Korean boundaries request review without claiming a count', () => {
  for (const ending of ['끝이에요', '끝이에요…', '“정말?” 하고 물어요.', '3.5만큼 모아요.', 'Mr. 몽을 만나요.',
    '한 문장이에요.다음이에요.', '(질문이에요.) 함께해요.', '첫째예요\n둘째예요']) {
    const warning = review({ theme: '주제', summary: '가'.repeat(70) + ending })[0];
    assert.match(warning, /두 문장 여부 검토\(자동 판별 불확실\)/);
    assert.ok(!warning.includes('현재'));
  }
});
test('counts card-visible whitespace and graphemes without stripping literal markup', () => {
  assert.deepEqual(review({ theme: '\t' + '가'.repeat(9) + '\r\n  ' + '나'.repeat(10) + ' ', summary: summaryAt(70) }), []);
  assert.deepEqual(review({ theme: '👨‍👩‍👧‍👦'.repeat(20), summary: summaryAt(70) }), []);
  assert.deepEqual(review({ theme: '가'.repeat(20), summary: summaryAt(70) }), []);
  assert.match(review({ theme: '**' + '가'.repeat(17) + '**', summary: summaryAt(70) })[0], /^Theme 21자:/);
  assert.deepEqual(review({ theme: '주제', summary: summaryAt(70).replace(' 나요.', '\r\n\t 나요.\n') }), []);
});
test('question and exclamation endings can form two clear sentences', () => {
  assert.deepEqual(review({ theme: '주제', summary: '가'.repeat(75) + '까요? 나요!' }), []);
});

test('reviews the same effective copy as the card, including unknown book IDs', () => {
  const original = { theme: '가'.repeat(21), summary: summaryAt(111) };
  for (const id of ['new-book', 'constructor', 'toString']) {
    assert.deepEqual(getLibraryCopy(id, original), original);
    assert.equal(review(getLibraryCopy(id, original)).length, 2);
  }
  const existing = getLibraryCopy('ep05', original);
  assert.notEqual(existing.theme, original.theme);
  assert.deepEqual(review(existing), [`Summary ${[...existing.summary!].length}자: 70~110자 확인`]);
});
