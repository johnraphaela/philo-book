import test from 'node:test';
import assert from 'node:assert/strict';
import { indexEssays } from '../src/lib/relationships.ts';

test('connects essays by bookId even when the filename differs', () => {
  const essay = { id: 'a-parent-guide', data: { bookId: 'book-two' } };
  const result = indexEssays(['book-one', 'book-two'], [essay]);
  assert.equal(result.get('book-two'), essay);
  assert.equal(result.has('book-one'), false);
});

test('rejects an essay pointing at a nonexistent book', () => {
  assert.throws(() => indexEssays(['book-one'], [
    { id: 'guide', data: { bookId: 'missing' } },
  ]), /unknown book/);
});

test('rejects ambiguous duplicate essays instead of silently dropping content', () => {
  assert.throws(() => indexEssays(['book-one'], [
    { id: 'first', data: { bookId: 'book-one' } },
    { id: 'second', data: { bookId: 'book-one' } },
  ]), /More than one essay/);
});
