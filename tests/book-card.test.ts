import test from 'node:test';
import assert from 'node:assert/strict';
import { getCardMetadata } from '../src/lib/book-card.ts';

test('card uses taxonomy labels, ordered distinct tags and structured ages', () => {
  assert.deepEqual(getCardMetadata({
    primaryCategory: 'identity', theme: '전문 용어',
    subtopics: ['comparison', 'comparison', 'individuality', 'self-worth'],
    categories: ['숨겨진 검색 태그'], recommendedAge: { min: 5, max: 10 }, ageGroups: ['초등 저학년'],
  }), { category: '나와 정체성', tags: ['비교', '개성'], age: '5~10세' });
});
test('legacy cards use original labels without guessing ages or exposing unknown taxonomy IDs', () => {
  assert.deepEqual(getCardMetadata({ theme: '옛 주제', categories: ['옛 주제', '태그1', '태그2', '태그3'],
    ageGroups: ['5\\~8세', '초등 저학년'], subtopics: ['unknown-id'] }),
  { category: '옛 주제', tags: ['태그1', '태그2'], age: '5~8세 · 초등 저학년' });
  assert.deepEqual(getCardMetadata({ primaryCategory: 'unknown-id' }), { category: '', tags: [], age: '' });
  assert.deepEqual(getCardMetadata({}), { category: '', tags: [], age: '' });
});
