import { directoryLink, fileLinkWithFallback, deniedFileLink } from './helpers/links.ts';
import test from 'node:test';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { parse } from 'yaml';
import { convertAstroDraft, inspectEssayBody } from '../content-authoring/astro-adapter.ts';
import { planPublication, sha256 } from '../content-authoring/publication-plan.ts';
import { bookSchema, essaySchema } from '../src/lib/content-schema.ts';
import { previewCommand } from '../content-authoring/preview.ts';

function draft() {
  return { schemaVersion: 1, id: 'new-book', status: 'ready', metadata: { title: '제목: "원문"', theme: '철학', categories: [], ageGroups: ['5-7세'] },
    story: { scenes: [{ id: 'second', text: '  한글 😀\r\n두 번째  ', parentHint: ' 힌트 ' }, { id: 'first', text: '첫 번째\n문장' }] },
    images: [{ sceneId: 'first', assetPath: '/images/scene.png', alt: '그림' }, { sceneId: 'second', assetPath: '/images/scene.png' }],
    essay: { title: '제목: "인용"', subtitle: '첫 줄\n둘째 줄', tags: ['a:b', '한글'], body: '\r\n# 원문\r\n\r\n**강조**와 `코드`\r\n\r\n> 인용\r\n\r\n- 하나\r\n- 둘\r\n' },
    thinking: { activities: [{ id: 'a', title: '놀이', description: '  질문?\n같은 문장\n같은 문장  ' }] },
    extensions: { editorial: { note: '보존' } },
  };
}
async function repo(t: import('node:test').TestContext) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'adapter-preview-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of ['public/images', 'src/content/books', 'src/content/essays']) await mkdir(path.join(root, dir), { recursive: true });
  await sharp({ create: { width: 3, height: 3, channels: 3, background: '#fff' } }).png().toFile(path.join(root, 'public/images/scene.png'));
  return root;
}

test('pure conversion preserves sentences, order, scene references and absent defaults without mutation', () => {
  const d = draft(); const before = structuredClone(d);
  const result = convertAstroDraft(d, { cover: { mode: 'scene', sceneId: 'first' }, order: 4, topics: ['identity'], recommendedAge: { min: 5, max: 7 } });
  assert.ok(result.ok);
  assert.deepEqual(d, before);
  assert.deepEqual(result.artifacts.book.pages.map(p => p.text), d.story.scenes.map(s => s.text));
  assert.equal(result.artifacts.book.pages[0].hint, d.story.scenes[0].parentHint);
  assert.equal(result.artifacts.book.pages[1].imageAlt, '그림');
  assert.equal(result.artifacts.book.cover, '/images/scene.png');
  assert.equal(result.artifacts.essay!.body, d.essay.body);
  assert.equal(result.artifacts.book.harvardPlay![0].desc, d.thinking.activities[0].description);
  assert.ok(bookSchema.safeParse(result.artifacts.book).success);
  assert.ok(essaySchema.safeParse(result.artifacts.essay!.frontmatter).success);
  result.artifacts.book.categories.push('changed');
  assert.deepEqual(d, before);
  const plain = convertAstroDraft(d); assert.ok(plain.ok);
  for (const field of ['cover', 'order', 'topics', 'recommendedAge', 'summary']) assert.ok(!(field in plain.artifacts.book));
});
test('blocks non-ready, invalid options, missing values, unmapped steps and references', () => {
  const d = draft();
  for (const bad of [{ ...d, status: 'draft' }, { ...d, schemaVersion: 2 }, { ...d, images: [] }, { ...d, metadata: {} },
    { ...d, thinking: { activities: [{ ...d.thinking.activities[0], steps: [{ id: 'step', title: '제목' }] }] } },
    { ...d, thinking: { activities: [{ ...d.thinking.activities[0], references: ['원문 참고'] }] } }]) {
    const result = convertAstroDraft(bad); assert.equal(result.ok, false); assert.ok(!('artifacts' in result));
  }
  for (const options of [{ essayId: '../escape' }, { cover: { mode: 'scene', sceneId: 'unknown' } }, { topics: ['unknown'] }, { order: -1 }, { recommendedAge: { min: 9, max: 5 } }, { invented: true }]) assert.equal(convertAstroDraft(d, options).ok, false);
});
test('Markdown-only policy rejects executable MDX but preserves fenced and escaped examples', () => {
  for (const body of ['import x from "x"\n\nText', 'export const x = 1', '<Component />', '{globalThis.process}', '<script>alert(1)</script>', '<!-- comment -->']) assert.ok(inspectEssayBody(body).length, body);
  for (const body of ['```js\nimport x from "x"\n```', '\\{literal\\}', '# 제목\n\n**강조**\n\n- 목록']) assert.deepEqual(inspectEssayBody(body), []);
});
test('read-only plan serializes YAML and body losslessly with source hashes, maps and deterministic bytes', async t => {
  const root = await repo(t); const d = draft(); const source = JSON.stringify(d, null, 2);
  const options = { essayId: 'parent-guide', cover: { mode: 'scene', sceneId: 'second' } };
  const before = await readdir(root, { recursive: true });
  const result = await planPublication(root, [{ source, options }]); assert.ok(result.ok);
  assert.deepEqual(result, await planPublication(root, [{ source, options }]));
  assert.deepEqual(await readdir(root, { recursive: true }), before);
  assert.equal(result.files.length, 2);
  for (const file of result.files) { assert.equal(file.action, 'add'); assert.equal(file.sourceHash, sha256(source)); assert.equal(file.sha256, sha256(file.content)); }
  const mdx = result.files[1].content;
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(mdx)!;
  assert.deepEqual(parse(match[1]), { title: d.essay.title, bookId: d.id, tags: d.essay.tags, subtitle: d.essay.subtitle });
  assert.equal(match[2], d.essay.body);
  assert.deepEqual(result.sources[0].scenes, [{ sceneId: 'second', pageIndex: 0 }, { sceneId: 'first', pageIndex: 1 }]);
  assert.ok(result.sources[0].excluded.includes('extensions'));
  // Applying test outputs is fixture setup; production planner has no write function.
  for (const file of result.files) await writeFile(path.join(root, file.relativePath), file.content);
  const noop = await planPublication(root, [{ source, options }]); assert.ok(noop.ok);
  assert.ok(noop.files.every(f => f.action === 'noop'));
  d.story.scenes[0].text = '수정 후보';
  const conflict = await planPublication(root, [{ source: JSON.stringify(d), options }]);
  assert.equal(conflict.ok, false); assert.ok(!('files' in conflict));
  assert.ok(conflict.diagnostics.some(d => d.code === 'existing-output'));
  assert.equal(await readFile(path.join(root, result.files[0].relativePath), 'utf8'), result.files[0].content);
});
test('blocks missing/disguised assets, batch IDs and paths, renamed essay owners and case collisions', async t => {
  const root = await repo(t); const d = draft();
  const plan = () => planPublication(root, [{ source: JSON.stringify(d) }]);
  d.images[0].assetPath = '/images/missing.png';
  assert.ok((await plan()).diagnostics.some(d => d.code === 'missing-image-file'));
  d.images[0].assetPath = '/images/scene.jpg';
  await writeFile(path.join(root, 'public/images/scene.jpg'), await readFile(path.join(root, 'public/images/scene.png')));
  assert.ok((await plan()).diagnostics.some(d => d.code === 'image-format-mismatch'));
  d.images[0].assetPath = '/images/scene.png';
  const source = JSON.stringify(d);
  assert.ok((await planPublication(root, [{ source }, { source }])).diagnostics.some(d => d.code === 'duplicate-id'));
  const other = { ...d, id: 'other-book' };
  assert.ok((await planPublication(root, [{ source, options: { essayId: 'shared' } }, { source: JSON.stringify(other), options: { essayId: 'shared' } }])).diagnostics.some(d => d.code === 'output-collision'));
  const initial = await plan(); assert.ok(initial.ok);
  await writeFile(path.join(root, initial.files[0].relativePath), initial.files[0].content);
  await writeFile(path.join(root, 'src/content/essays/other-name.mdx'), initial.files[1].content);
  assert.ok((await plan()).diagnostics.some(d => d.code === 'duplicate-essay'));
  await rm(path.join(root, 'src/content/essays/other-name.mdx'));
  await rm(path.join(root, initial.files[0].relativePath));
  await writeFile(path.join(root, 'src/content/books/New-Book.json'), initial.files[0].content);
  assert.ok((await plan()).diagnostics.some(d => d.code === 'existing-output'));
});
test('blocks output symlinks, invalid source and empty batches, and CLI stays read-only', async t => {
  const root = await repo(t);
  const source = JSON.stringify(draft());
  assert.equal((await planPublication(root, [])).ok, false);
  assert.ok((await planPublication(root, [{ source: '{' }])).diagnostics.some(d => d.code === 'invalid-json'));
  const file = path.join(root, 'draft.json'); await writeFile(file, source);
  const before = await readdir(root, { recursive: true });
  let output = '';
  const status = await previewCommand([file], root, text => { output = text; }, text => assert.fail(text));
  assert.equal(status, 0); assert.equal(JSON.parse(output).dryRun, true);
  assert.equal(await previewCommand([], root, () => {}, () => {}), 1);
  assert.deepEqual(await readdir(root, { recursive: true }), before);
  for (const forced of [false, true]) await t.test(`output link rejection (forced fallback: ${forced})`, async () => {
    const books = path.join(root, 'src/content/books');
    let junction = false;
    const linked = fileLinkWithFallback(file, path.join(books, `new-book-${forced}.json`), () => {
      const alternate = path.join(root, `file-link-fallback-books-${forced}`);
      fs.mkdirSync(alternate);
      fs.rmdirSync(books);
      directoryLink(alternate, books);
      junction = true;
      return books;
    }, forced ? 'win32' : process.platform, forced ? deniedFileLink : undefined);
    assert.ok((await planPublication(root, [{ source }])).diagnostics.some(d => d.code === 'repository-unavailable'));
    if (junction) { fs.unlinkSync(linked); await mkdir(books); }
    else await rm(linked);
  });
  const otherBooks = path.join(root, 'other-books');
  await mkdir(otherBooks);
  await rm(path.join(root, 'src/content/books'), { recursive: true });
  directoryLink(otherBooks, path.join(root, 'src/content/books'));
  assert.ok((await planPublication(root, [{ source }])).diagnostics.some(d => d.code === 'repository-unavailable'));
});
test('existing EP03 is protected even if a caller relabels its original draft ready', async () => {
  const original = JSON.parse(await readFile('content-authoring/pilots/ep03-hope/master-draft.v1.json', 'utf8'));
  assert.equal(original.status, 'draft');
  const result = await planPublication(process.cwd(), [{ source: JSON.stringify({ ...original, status: 'ready' }) }]);
  assert.equal(result.ok, false);
  assert.ok(result.diagnostics.some(d => d.code === 'existing-output'));
});
