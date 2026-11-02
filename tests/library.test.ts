import test from 'node:test';
import assert from 'node:assert/strict';
import { ageBandIds, matchesBook, sortBooks } from '../src/lib/library.ts';
const book = { id: 'mong', data: { title: '로봇 몽', theme: '정체성', summary: '함께 변화를 생각해요', categories: ['테세우스의 배'], topics: ['identity'], recommendedAge: { min: 5, max: 9 }, order: 2 } };
test('age ranges overlap bands inclusively', () => {
  assert.deepEqual(ageBandIds({ min: 7, max: 10 }), ['early', 'lower', 'upper']);
  assert.deepEqual(ageBandIds({ min: 8, max: 9 }), ['lower']);
  assert.deepEqual(ageBandIds(), []);
});
test('search covers summary, tags, topic labels and multiple words', () => {
  for (const q of ['몽', '변화를', '테세우스', '자아', ' 로봇   정체성 ']) assert.equal(matchesBook(book, q, '', ''), true);
  assert.equal(matchesBook(book, '없는책', '', ''), false);
});
test('search and filters combine with AND and clear independently', () => {
  assert.equal(matchesBook(book, '몽', 'lower', 'identity'), true);
  assert.equal(matchesBook(book, '몽', 'upper', 'identity'), false);
  assert.equal(matchesBook(book, '', '', 'self-esteem'), false);
  assert.equal(matchesBook(book, '', '', ''), true);
});
test('sort is deterministic and does not mutate original array', () => {
  const input = [book, { ...book, id: 'first', data: { ...book.data, order: 1 } }];
  assert.deepEqual(sortBooks(input).map(b => b.id), ['first', 'mong']);
  assert.equal(input[0], book);
});
