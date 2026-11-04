import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { AGE_BANDS, ageBandIds, bookAgeRanges, bookAgeBandIds, categoryOptions, normalizeCategory, matchesBook, sortBooks, type LibraryItem } from '../src/lib/library.ts';
const book: LibraryItem = { id: 'mong', data: { title: '로봇 몽', theme: '정체성', summary: '함께 변화를 생각해요', categories: ['자아', '테세우스의 배'], topics: ['identity'], primaryCategory: 'identity', subtopics: ['personal-change'], coreQuestion: '나는 어떻게 달라질까?', recommendedAge: { min: 5, max: 9 }, order: 2 } };
const registeredBooks: LibraryItem[] = fs.readdirSync('src/content/books').filter(name => name.endsWith('.json')).map(name => ({ id: name.replace(/\.json$/, ''), data: JSON.parse(fs.readFileSync(`src/content/books/${name}`, 'utf8')) }));
// Keep this audit snapshot stable when new books are registered.
const auditIds = new Set(['ep01-robot-mong', 'ep02-self-esteem', 'ep03-hope', 'ep05', 'pico-silver-feather']);
const books = registeredBooks.filter(book => auditIds.has(book.id));
const ids = (age = '', topic = '') => books.filter(book => matchesBook(book, '', age, topic)).map(book => book.id).sort();

test('age ranges overlap bands inclusively, including the requested 5~8 example', () => {
  assert.deepEqual(ageBandIds({ min: 5, max: 8 }), ['5-6', '7-8']);
  assert.deepEqual(ageBandIds({ min: 6, max: 11 }), ['5-6', '7-8', '9-10', '11-12']);
  assert.deepEqual(ageBandIds({ min: 8, max: 9 }), ['7-8', '9-10']);
  assert.deepEqual(ageBandIds(), []);
});
test('fallback parses age spellings, single ages and disjoint ranges without filling gaps', () => {
  for (const label of ['5~8세', '5\\~8세', '5-8세', '5–8세', '5 — 8세', '5세~8세', '５～８세']) {
    assert.deepEqual(bookAgeBandIds({ id: 'sample', data: { ...book.data, recommendedAge: undefined, ageGroups: [label] } }), ['5-6', '7-8']);
  }
  const sample = (ageGroups: string[]) => ({ id: 'sample', data: { ...book.data, recommendedAge: undefined, ageGroups } });
  assert.deepEqual(bookAgeRanges(sample(['6세', '9~10세'])), [{ min: 6, max: 6 }, { min: 9, max: 10 }]);
  assert.deepEqual(bookAgeBandIds(sample(['5~6세', '9~10세'])), ['5-6', '9-10']);
  assert.deepEqual(bookAgeBandIds(sample(['초등 저학년', '잘못된 연령', '9~5세', '19~20세'])), []);
  assert.deepEqual(bookAgeRanges({ ...book, data: { ...book.data, ageGroups: ['10~12세'] } }), [{ min: 5, max: 9 }]);
});
test('only populated taxonomy categories appear and new books reveal categories automatically', () => {
  assert.deepEqual(categoryOptions(books).map(o => o.id), ['identity', 'ethics', 'growth']);
  const added: LibraryItem = { id: 'new', data: { ...book.data, primaryCategory: 'world' } };
  assert.deepEqual(categoryOptions([...books, added]).map(o => o.id), ['identity', 'ethics', 'growth', 'world']);
  assert.deepEqual(categoryOptions([{ ...book, data: { ...book.data, primaryCategory: undefined } }]), []);
});
test('search covers legacy tags, taxonomy labels, subtopic labels and core questions', () => {
  for (const q of ['몽', '변화를', '테세우스', '자아', ' 로봇   정체성 ', '나와 정체성', '나의 변화', '어떻게 달라질까']) assert(matchesBook(book, q, '', ''));
  const sample = { ...book, data: { ...book.data, categories: ['자아존중감'] } };
  assert(matchesBook(sample, '자존감', '', ''));
  assert(matchesBook(sample, '자아존중감', '', ''));
  assert(!matchesBook(book, '없는책', '', ''));
  assert.equal(normalizeCategory('사회 철학'), '사회철학');
});
test('search, age and primary category combine with AND and clear independently', () => {
  assert(matchesBook(book, '몽', '9-10', 'identity'));
  assert(!matchesBook(book, '몽', '11-12', 'identity'));
  assert(!matchesBook(book, '몽', '7-8', 'growth'));
  assert(!matchesBook(book, '없는책', '7-8', 'identity'));
  assert(matchesBook(book, '', '', ''));
  const legacy = { ...book, data: { ...book.data, primaryCategory: undefined, subtopics: undefined, coreQuestion: undefined } };
  assert(matchesBook(legacy, '몽', '7-8', ''));
  assert(!matchesBook(legacy, '', '', 'identity'));
});

test('current library: every age band has the expected full set', () => {
  const all = ['ep01-robot-mong', 'ep02-self-esteem', 'ep03-hope', 'ep05', 'pico-silver-feather'];
  assert.deepEqual(ids(), all);
  assert.deepEqual(ids('5-6'), all);
  assert.deepEqual(ids('7-8'), all);
  assert.deepEqual(ids('9-10'), ['ep01-robot-mong', 'ep02-self-esteem', 'pico-silver-feather']);
  assert.deepEqual(ids('11-12'), ['ep02-self-esteem']);
});
const expectedCategories: Record<string, string[]> = {
  identity: ['ep01-robot-mong', 'ep02-self-esteem', 'pico-silver-feather'],
  ethics: ['ep05'], growth: ['ep03-hope'],
};
test('current library: every category and all age/category combinations match explicit expected sets', () => {
  assert.deepEqual(categoryOptions(books).map(o => o.id).sort(), Object.keys(expectedCategories).sort());
  for (const [topic, expected] of Object.entries(expectedCategories)) {
    assert.deepEqual(ids('', topic), expected, topic);
    for (const age of AGE_BANDS) {
      const expectedAges: Record<string, string[]> = {
        '5-6': books.map(b => b.id), '7-8': books.map(b => b.id),
        '9-10': ['ep01-robot-mong', 'ep02-self-esteem', 'pico-silver-feather'], '11-12': ['ep02-self-esteem'],
      };
      assert.deepEqual(ids(age.id, topic), expected.filter(id => expectedAges[age.id].includes(id)), `${age.id}/${topic}`);
    }
  }
});
test('sort is deterministic and does not mutate original array', () => {
  const input = [book, { ...book, id: 'first', data: { ...book.data, order: 1 } }];
  assert.deepEqual(sortBooks(input).map(b => b.id), ['first', 'mong']);
  assert.equal(input[0], book);
});

test('requested searches and seven-year-old identity browsing find the expected books', () => {
  const find = (query: string) => books.filter(b => matchesBook(b, query, '', '')).map(b => b.id).sort();
  assert.deepEqual(find('피코'), ['pico-silver-feather']);
  assert.deepEqual(find('자존감'), ['ep02-self-esteem', 'pico-silver-feather']);
  assert.deepEqual(ids('7-8', 'identity'), expectedCategories.identity);
});
