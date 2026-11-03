import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir, cp, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { importBook, parseManuscript } from '../scripts/book-import.ts';
import { inspectPublishedContent } from '../scripts/publication-integrity.ts';

// Synthetic parser fixture only; never published as a book.
const source = `# Metadata
Book ID: test-book
Title: Test title
Theme: Theme
Age Groups: 5-7세
Categories: 철학, 정서
Summary: Summary
# Story
## Scene 01
**Text:** 첫 **문장** {그대로}.

둘째 문단.
Parent Teaching Point:
가르침.
Parent Interaction: 질문?
- 목록 하나
- 목록 둘
English: Original English.
# Parent Essay
Title: Essay
Tags: one, two
Body:
## 본문 소제목
원문 **강조** {literal}.

> 인용
# Harvard Play
Parent Guide: Guide
Conversation:
- 질문 하나?
- 질문 둘?
Activities: Activity
# Illustration Guide
Character Bible: Character
Common Art Style: Style
Image Prompts:
Scene 01: prompt, **exact**.
# References
- Reference entry.
`;
async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'book-import-test-'));
  for (const dir of ['src/content/books', 'src/content/essays', 'public/images', 'node_modules', 'input']) await mkdir(path.join(root, dir), { recursive: true });
  await writeFile(path.join(root, 'input/manuscript.md'), source);
  await sharp({ create: { width: 16, height: 9, channels: 3, background: '#fff' } }).png().toFile(path.join(root, 'input/page1.png'));
  return root;
}
const verify = async (stage: string) => {
  const diagnostics = await inspectPublishedContent(stage);
  assert.deepEqual(diagnostics, []);
};
test('preserves paragraphs, emphasis, questions, English, prompts and reference text', () => {
  const parsed = parseManuscript(source.replaceAll('\n', '\r\n'));
  assert.equal(parsed.scenes[0].fields.Text, '첫 **문장** {그대로}.\n\n둘째 문단.');
  assert.equal(parsed.scenes[0].fields['Parent Interaction'], '질문?\n- 목록 하나\n- 목록 둘');
  assert.equal(parsed.scenes[0].fields.English.trim(), 'Original English.');
  assert.equal(parsed.sections['Illustration Guide']['Image Prompts'], 'Scene 01: prompt, **exact**.');
  assert.equal(parsed.sections.References.Body, '- Reference entry.');
  assert.throws(() => parseManuscript(source.replace('Parent Interaction: 질문?', '')), /Parent Interaction/);
  assert.throws(() => parseManuscript(source.replace('## Scene 01', '## Scene 02')), /Scene 1 누락/);
  assert.throws(() => parseManuscript(source.replace('Title: Test title', 'Title: Test title\nTitle: Duplicate')), /중복/);
});
test('imports bytes unchanged, preserves all fields, reruns without writes, explicit update required', async () => {
  const root = await fixture();
  try {
    const first = await importBook({ root, input: 'input', verify });
    assert.equal(first.scenes, 1);
    const book = JSON.parse(await readFile(path.join(root, 'src/content/books/test-book.json'), 'utf8'));
    assert.equal(book.pages[0].teachingPoint, '가르침.');
    assert.equal(book.pages[0].interaction, '질문?\n- 목록 하나\n- 목록 둘');
    assert.equal(await readFile(path.join(root, 'content-authoring/imports/test-book/manuscript.md'), 'utf8'), source);
    assert.deepEqual(await readFile(path.join(root, 'public/images/test-book/page1.png')), await readFile(path.join(root, 'input/page1.png')));
    const second = await importBook({ root, input: 'input', verify });
    assert.deepEqual(second.changed, []);
    await writeFile(path.join(root, 'input/manuscript.md'), source.replace('Test title', 'Updated title'));
    await assert.rejects(importBook({ root, input: 'input', verify }), /--update test-book/);
    await importBook({ root, input: 'input', update: 'test-book', verify });
  } finally { await rm(root, { recursive: true, force: true }); }
});
test('missing, duplicate, unsupported and mismatched image formats stop without publication', async () => {
  for (const kind of ['missing', 'duplicate', 'unsupported', 'mismatch', 'corrupt']) {
    const root = await fixture();
    try {
      const image = await readFile(path.join(root, 'input/page1.png'));
      if (kind === 'missing') await rm(path.join(root, 'input/page1.png'));
      if (kind === 'duplicate') await writeFile(path.join(root, 'input/page01.png'), image);
      if (kind === 'unsupported') await writeFile(path.join(root, 'input/page2.gif'), image);
      if (kind === 'mismatch') { await rm(path.join(root, 'input/page1.png')); await writeFile(path.join(root, 'input/page1.jpg'), image); }
      if (kind === 'corrupt') await writeFile(path.join(root, 'input/page1.png'), Buffer.from('broken'));
      await assert.rejects(importBook({ root, input: 'input', verify }));
      assert.deepEqual(await readdir(path.join(root, 'src/content/books')), []);
      assert.deepEqual(await readdir(path.join(root, 'public/images')), []);
    } finally { await rm(root, { recursive: true, force: true }); }
  }
});
test('build failure leaves an existing imported book and images byte-identical', async () => {
  const root = await fixture();
  try {
    await importBook({ root, input: 'input', verify });
    const before = await readFile(path.join(root, 'src/content/books/test-book.json'));
    const image = await readFile(path.join(root, 'public/images/test-book/page1.png'));
    await writeFile(path.join(root, 'input/manuscript.md'), source.replace('Test title', 'Changed'));
    await assert.rejects(importBook({ root, input: 'input', update: 'test-book', verify: async () => { throw new Error('build failed'); } }), /build failed/);
    assert.deepEqual(await readFile(path.join(root, 'src/content/books/test-book.json')), before);
    assert.deepEqual(await readFile(path.join(root, 'public/images/test-book/page1.png')), image);
  } finally { await rm(root, { recursive: true, force: true }); }
});
test('existing paths, Book IDs, and invalid slug cannot silently replace a book', async () => {
  const root = await fixture();
  try {
    await writeFile(path.join(root, 'src/content/books/test-book.json'), '{}');
    await assert.rejects(importBook({ root, input: 'input', verify }), /충돌/);
    await rm(path.join(root, 'src/content/books/test-book.json'));
    await writeFile(path.join(root, 'input/manuscript.md'), source.replace('Book ID: test-book', 'Book ID: EP 06'));
    await assert.rejects(importBook({ root, input: 'input', verify }), /--slug/);
    await importBook({ root, input: 'input', slug: 'ep06', verify });
    const book = JSON.parse(await readFile(path.join(root, 'src/content/books/ep06.json'), 'utf8'));
    assert.equal(book.sourceBookId, 'EP 06');
    await assert.rejects(importBook({ root, input: 'input', slug: 'other', verify }), /Book ID 충돌/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('numeric image mapping uses scene numbers rather than filename order and UTF-8 txt is accepted', async () => {
  const root = await fixture();
  try {
    const scenes = Array.from({ length: 12 }, (_, i) => `Scene ${i + 1}\nText: 장면 ${i + 1}\nParent Teaching Point: 가르침 ${i + 1}\nParent Interaction: 질문 ${i + 1}?`).join('\n');
    const manuscript = source.replace(/## Scene 01[\s\S]*?(?=# Parent Essay)/, scenes + '\n');
    await rm(path.join(root, 'input/manuscript.md'));
    await writeFile(path.join(root, 'input/manuscript.txt'), manuscript);
    const bytes = await readFile(path.join(root, 'input/page1.png'));
    for (let i = 2; i <= 12; i++) await writeFile(path.join(root, `input/page${i}.png`), bytes);
    await importBook({ root, input: 'input', verify });
    const book = JSON.parse(await readFile(path.join(root, 'src/content/books/test-book.json'), 'utf8'));
    assert.equal(book.pages[1].image, '/images/test-book/page2.png');
    assert.equal(book.pages[9].image, '/images/test-book/page10.png');
    assert.equal(book.pages[11].text, '장면 12');
  } finally { await rm(root, { recursive: true, force: true }); }
});
test('end-to-end temporary project runs real content check, Astro check and build', { skip: !process.env.BOOK_IMPORT_INTEGRATION }, async () => {
  const root = await fixture();
  try {
    for (const entry of ['src', 'public', 'scripts', 'content-authoring', '.agents', 'tests', 'astro.config.mjs', 'tsconfig.json', 'package.json', 'package-lock.json'])
      await cp(path.join(process.cwd(), entry), path.join(root, entry), { recursive: true });
    await rm(path.join(root, 'node_modules'), { recursive: true });
    await symlink(path.join(process.cwd(), 'node_modules'), path.join(root, 'node_modules'), 'dir');
    const result = await importBook({ root, input: 'input' });
    assert.equal(result.slug, 'test-book');
    const essay = await readFile(path.join(root, 'src/content/essays/test-book.md'), 'utf8');
    assert.ok(essay.includes(parseManuscript(source).sections['Parent Essay'].Body));
    assert.deepEqual(await readdir(path.join(root, 'public/images/test-book')), ['page1.png']);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('card-copy warnings do not block registration, rewrite metadata or change no-op imports', async () => {
  const root = await fixture();
  const theme = '가'.repeat(21);
  const summary = '나'.repeat(105) + '요. 다요.';
  const manuscript = source.replace('Theme: Theme', `Theme: ${theme}`).replace('Summary: Summary', `Summary: ${summary}`);
  try {
    await writeFile(path.join(root, 'input/manuscript.md'), manuscript);
    const result = await importBook({ root, input: 'input', verify });
    assert.deepEqual(result.warnings, ['Theme 21자: 20자 이내 확인', 'Summary 111자: 70~110자 확인']);
    const bookPath = path.join(root, 'src/content/books/test-book.json');
    const before = await readFile(bookPath);
    const book = JSON.parse(before.toString());
    assert.equal(book.theme, theme);
    assert.equal(book.summary, summary);
    assert.equal(await readFile(path.join(root, 'input/manuscript.md'), 'utf8'), manuscript);
    assert.equal(await readFile(path.join(root, 'content-authoring/imports/test-book/manuscript.md'), 'utf8'), manuscript);
    const again = await importBook({ root, input: 'input', verify });
    assert.deepEqual(again.changed, []);
    assert.deepEqual(again.warnings, result.warnings);
    assert.deepEqual(await readFile(bookPath), before);
  } finally { await rm(root, { recursive: true, force: true }); }
});
