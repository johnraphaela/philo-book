import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CONTENT_CATEGORIES, CONTENT_SUBTOPICS } from '../src/lib/taxonomy.ts';

const expected: Record<string, { category: string; subtopics: string[]; question: string }> = {
  'ep01-robot-mong': {
    category: 'identity',
    subtopics: ['personal-change', 'self-continuity'],
    question: '몸의 모든 부품이 바뀌어도 몽은 여전히 몽일까?',
  },
  'ep02-self-esteem': {
    category: 'identity',
    subtopics: ['self-worth', 'recognition'],
    question: '아무도 나를 알아주지 않아도 나의 가치는 그대로일까?',
  },
  'ep03-hope': {
    category: 'growth',
    subtopics: ['hope', 'agency'],
    question: '희망은 기다리는 마음일까, 직접 움직이는 행동일까?',
  },
  'pico-silver-feather': {
    category: 'identity',
    subtopics: ['comparison', 'individuality'],
    question: '남보다 잘해야만 내 날개가 멋진 걸까?',
  },
  'ep05': {
    category: 'ethics',
    subtopics: ['fairness', 'rules'],
    question: '모두에게 공정한 놀이터는 어떻게 만들 수 있을까?',
  },
};

test('the eight editorial categories have stable, unique IDs and meaningful labels', () => {
  assert.deepEqual(CONTENT_CATEGORIES.map(c => c.id), [
    'emotions', 'identity', 'relationships', 'ethics',
    'thinking', 'growth', 'world', 'meaning',
  ]);
  assert.equal(new Set(CONTENT_CATEGORIES.map(c => c.id)).size, 8);
  for (const c of CONTENT_CATEGORIES) {
    assert(c.label.trim().length > 0);
    assert(c.description.trim().length > 0);
  }
});

test('all subtopics have unique IDs and reference defined groups', () => {
  const categories = new Set<string>(CONTENT_CATEGORIES.map(c => c.id));
  assert.equal(new Set(CONTENT_SUBTOPICS.map(t => t.id)).size, CONTENT_SUBTOPICS.length);
  for (const t of CONTENT_SUBTOPICS) {
    assert(categories.has(t.group));
    assert(t.label.trim().length > 0);
  }
});

test('the original five books have validated editorial metadata', () => {
  const categories = new Set<string>(CONTENT_CATEGORIES.map(c => c.id));
  const subtopics = new Set<string>(CONTENT_SUBTOPICS.map(t => t.id));
  for (const [id, value] of Object.entries(expected)) {
    const book = JSON.parse(fs.readFileSync(`src/content/books/${id}.json`, 'utf8'));
    assert.equal(book.primaryCategory, value.category, id);
    assert.deepEqual(book.subtopics, value.subtopics, id);
    assert.equal(book.coreQuestion, value.question, id);
    assert(categories.has(book.primaryCategory));
    assert(book.subtopics.length > 0);
    assert.equal(new Set(book.subtopics).size, book.subtopics.length);
    for (const topic of book.subtopics) assert(subtopics.has(topic), `${id}: ${topic}`);
    assert(book.coreQuestion.trim().endsWith('?'), id);
    assert(book.pages.length > 0, id);
    assert(Array.isArray(book.categories), id);
  }
});
