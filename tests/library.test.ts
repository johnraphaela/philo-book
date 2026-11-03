import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { AGE_BANDS, ageBandIds, bookAgeRanges, bookAgeBandIds, categoryOptions, normalizeCategory, matchesBook, sortBooks, type LibraryItem } from '../src/lib/library.ts';
const book: LibraryItem = { id: 'mong', data: { title: '로봇 몽', theme: '정체성', summary: '함께 변화를 생각해요', categories: ['자아', '테세우스의 배'], topics: ['identity'], recommendedAge: { min: 5, max: 9 }, order: 2 } };
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
test('category options come from real tags, merge only known aliases and keep distinct concepts', () => {
  assert.equal(normalizeCategory(' 자아 존중감 '), '자존감');
  assert.equal(normalizeCategory('사회 철학'), '사회철학');
  assert.equal(normalizeCategory('정서발달'), '정서 발달');
  const options = categoryOptions(books).map(option => option.id);
  assert.equal(options.length, 13);
  assert(options.includes('사회철학')); assert(options.includes('윤리')); assert(options.includes('자기효능감'));
  const allOptions = categoryOptions(registeredBooks).map(option => option.id);
  for (const b of registeredBooks) for (const category of b.data.categories) {
    const canonical = normalizeCategory(category);
    if (!canonical) continue;
    assert(allOptions.includes(canonical));
    assert(matchesBook(b, '', '', canonical));
  }
  assert.deepEqual(categoryOptions([{ ...book, data: { ...book.data, categories: ['새로운 분류'] } }]), [{ id: '새로운 분류', label: '새로운 분류' }]);
  assert(!matchesBook({ ...book, data: { ...book.data, categories: ['사회 철학'] } }, '', '', '철학'));
});
test('search covers displayed metadata and category aliases, but filtering ignores theme and legacy topics', () => {
  for (const q of ['몽', '변화를', '테세우스', '자아', ' 로봇   정체성 ']) assert(matchesBook(book, q, '', ''));
  assert(!matchesBook(book, '없는책', '', ''));
  const sample = { ...book, data: { ...book.data, theme: '공정함과 윤리', topics: ['self-esteem'], categories: ['자아존중감'] } };
  assert(matchesBook(sample, '윤리', '', '자존감'));
  assert(matchesBook(sample, '자존감', '', ''));
  assert(matchesBook(sample, '자아존중감', '', ''));
  assert(!matchesBook(sample, '', '', '윤리'));
  assert(!matchesBook(sample, '', '', 'self-esteem'));
});
test('search and age/category filters combine with AND, tags use OR and clear independently', () => {
  assert(matchesBook(book, '몽', '9-10', '자아'));
  assert(matchesBook(book, '몽', '7-8', '테세우스의 배'));
  assert(!matchesBook(book, '몽', '11-12', '자아'));
  assert(!matchesBook(book, '', '', '자존감'));
  assert(matchesBook(book, '', '', ''));
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
  '자아': ['ep01-robot-mong'], '변화': ['ep01-robot-mong'], '테세우스의 배': ['ep01-robot-mong'],
  '철학': ['ep02-self-esteem', 'ep03-hope', 'pico-silver-feather'],
  '자존감': ['ep02-self-esteem', 'pico-silver-feather'], '자기만족': ['ep02-self-esteem'], '코나투스': ['ep02-self-esteem'],
  '정서 발달': ['ep03-hope'], '자기효능감': ['ep03-hope'], '문학': ['pico-silver-feather'],
  '사회철학': ['ep05'], '윤리': ['ep05'], '사회성 발달': ['ep05'],
};
test('current library: every category and all 52 age/category combinations match explicit expected sets', () => {
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
