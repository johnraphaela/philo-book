import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { inspectImage, inspectPublishedContent, inspectDraftPublication } from '../scripts/publication-integrity.ts';
import { validateMasterDraft } from '../content-authoring/schema.ts';

async function fixture(t: import('node:test').TestContext) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'publication-check-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of ['public/images', 'src/content/books', 'src/content/essays']) await mkdir(path.join(root, dir), { recursive: true });
  const png = await sharp({ create: { width: 3, height: 3, channels: 3, background: '#abc' } }).png().toBuffer();
  await writeFile(path.join(root, 'public/images/scene.png'), png);
  return { root, publicRoot: path.join(root, 'public'), png };
}
test('decodes images and rejects missing, corrupt, truncated and disguised files', async t => {
  const { root, publicRoot, png } = await fixture(t);
  assert.deepEqual(await inspectImage(publicRoot, '/images/scene.png'), []);
  assert.equal((await inspectImage(publicRoot, '/images/missing.png'))[0].code, 'missing-image-file');
  await writeFile(path.join(root, 'public/images/disguised.jpg'), png);
  assert.equal((await inspectImage(publicRoot, '/images/disguised.jpg'))[0].code, 'image-format-mismatch');
  await writeFile(path.join(root, 'public/images/bad.png'), 'not an image');
  assert.equal((await inspectImage(publicRoot, '/images/bad.png'))[0].code, 'invalid-image-file');
  const jpeg = await sharp(png).jpeg().toBuffer();
  await writeFile(path.join(root, 'public/images/truncated.jpg'), jpeg.subarray(0, jpeg.length - 20));
  assert.equal((await inspectImage(publicRoot, '/images/truncated.jpg'))[0].code, 'invalid-image-file');
});
test('rejects unsafe paths and symlink escapes', async t => {
  const { root, publicRoot, png } = await fixture(t);
  for (const asset of ['https://a/b.png', '/images/../a.png', '/images/%2e%2e/a.png', '/images/a.png?x', '/images/a\\b.png', '/images//a.png', '']) {
    assert.equal((await inspectImage(publicRoot, asset))[0].code, 'invalid-image-path', asset);
  }
  await writeFile(path.join(root, 'outside.png'), png);
  await symlink(path.join(root, 'outside.png'), path.join(publicRoot, 'images/escape.png'));
  assert.equal((await inspectImage(publicRoot, '/images/escape.png'))[0].code, 'invalid-image-path');
});
test('ready requires actual images while ordinary unfinished drafts remain valid', async t => {
  const { publicRoot } = await fixture(t);
  const draft = { schemaVersion: 1, id: 'book', status: 'ready', metadata: { title: 'Title', theme: 'Theme', categories: [], ageGroups: [] }, story: { scenes: [{ id: 's', text: '  Original\ntext  ' }] }, images: [{ sceneId: 's', assetPath: '/images/missing.png' }] };
  const before = structuredClone(draft);
  assert.equal(validateMasterDraft(draft).success, true);
  assert.ok((await inspectDraftPublication(draft, publicRoot)).some(d => d.code === 'missing-image-file'));
  draft.images[0].assetPath = '/images/scene.png';
  assert.deepEqual(await inspectDraftPublication(draft, publicRoot), []);
  assert.equal(draft.story.scenes[0].text, before.story.scenes[0].text);
  assert.equal(validateMasterDraft({ schemaVersion: 1, id: 'unfinished', status: 'draft' }).success, true);
  assert.ok((await inspectDraftPublication({ schemaVersion: 1, id: 'unfinished', status: 'draft' }, publicRoot)).some(d => d.code === 'not-ready'));
});
test('production check covers explicit covers, pages, real YAML links and empty essays', async t => {
  const { root } = await fixture(t);
  const book = { pages: [{ image: '/images/scene.png', text: 'Body' }] };
  const saveBook = (value: unknown) => writeFile(path.join(root, 'src/content/books/book.json'), JSON.stringify(value));
  const saveEssay = (name: string, value: string) => writeFile(path.join(root, 'src/content/essays', name+'.mdx'), value);
  await saveBook(book);
  // Different filename and YAML single quotes are intentional.
  await saveEssay('guide', "---\ntitle: Guide\nbookId: 'book'\ntags: []\n---\nBody\n");
  assert.deepEqual(await inspectPublishedContent(root), []);
  await saveBook({ ...book, cover: '/images/missing.png', pages: [{ image: '/images/missing.png', text: ' \n ' }] });
  let issues = await inspectPublishedContent(root);
  assert.equal(issues.filter(d => d.code === 'missing-image-file').length, 2);
  assert.ok(issues.some(d => d.code === 'empty-page'));
  await saveEssay('duplicate', '---\nbookId: book\n---\nBody');
  await saveEssay('orphan', '---\nbookId: missing\n---\n');
  await saveEssay('invalid', '---\nbookId: book\nbookId: other\n---\nBody');
  issues = await inspectPublishedContent(root);
  for (const code of ['duplicate-essay', 'unknown-book', 'empty-essay', 'invalid-essay']) assert.ok(issues.some(d => d.code === code), code);
  await saveBook({ pages: [] });
  assert.ok((await inspectPublishedContent(root)).some(d => d.code === 'empty-book'));
});
