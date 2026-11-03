import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm, symlink } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { createSitePreview, type PreviewRunner, type SitePreviewResult } from '../content-authoring/site-preview.ts';
import { planPublication } from '../content-authoring/publication-plan.ts';

async function fixture(t: import('node:test').TestContext) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'site-preview-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of ['src/content/books', 'src/content/essays', 'public/images', 'content-authoring', 'scripts', 'node_modules/astro', 'node_modules/.astro']) await mkdir(path.join(root, dir), { recursive: true });
  for (const file of ['astro.config.mjs', 'tsconfig.json', 'package.json', 'package-lock.json']) await writeFile(path.join(root, file), '{}');
  await writeFile(path.join(root, '.env'), 'DO_NOT_COPY=secret');
  await writeFile(path.join(root, 'src/.env.local'), 'DO_NOT_COPY=secret');
  await writeFile(path.join(root, 'node_modules/.astro/cache'), 'source cache');
  await sharp({ create: { width: 2, height: 2, channels: 3, background: '#fff' } }).png().toFile(path.join(root, 'public/images/test.png'));
  const source = JSON.stringify({ schemaVersion: 1, id: 'candidate', status: 'ready', metadata: { title: '검증 후보', theme: '검증', categories: [], ageGroups: [] }, story: { scenes: [{ id: 's', text: '  원문\r\n보존  ' }] }, images: [{ sceneId: 's', assetPath: '/images/test.png' }], essay: { title: '에세이', tags: [], body: '\n**강조**\n' } });
  const clean = (result: SitePreviewResult) => { if (result.stageRoot) t.after(() => rm(result.stageRoot!, { recursive: true, force: true })); };
  return { root, source, clean };
}
const success: PreviewRunner = async (root, command, log) => {
  await writeFile(log, command+' ok');
  if (command === 'build') { await mkdir(path.join(root, 'dist/book/candidate'), { recursive: true }); await writeFile(path.join(root, 'dist/book/candidate/index.html'), '<html>검증 후보</html>'); }
  return 0;
};

test('stages exact candidate bytes, isolates caches, excludes secrets and leaves original files untouched', async t => {
  const { root, source, clean } = await fixture(t);
  const before = await readdir(root, { recursive: true });
  const result = await createSitePreview(root, [{ source }], async (stage, command, log) => {
    assert.notEqual(stage, root);
    const book = JSON.parse(await readFile(path.join(stage, 'src/content/books/candidate.json'), 'utf8'));
    assert.equal(book.pages[0].text, '  원문\r\n보존  ');
    assert.ok(!(await readdir(stage)).includes('.env'));
    assert.ok(!(await readdir(path.join(stage, 'src'))).includes('.env.local'));
    await mkdir(path.join(stage, 'node_modules/.astro'), { recursive: true });
    await writeFile(path.join(stage, 'node_modules/.astro/cache'), 'preview cache');
    return success(stage, command, log);
  });
  clean(result); assert.ok(result.ok, JSON.stringify(result.diagnostics));
  assert.deepEqual(result.checks.map(c => c.command), ['check', 'build']);
  assert.deepEqual(result.routes, ['/book/candidate/']);
  assert.ok(result.sourceHashes?.['public/images/test.png']);
  assert.equal(await readFile(path.join(root, 'node_modules/.astro/cache'), 'utf8'), 'source cache');
  assert.deepEqual(await readdir(root, { recursive: true }), before);
  assert.equal(JSON.parse(await readFile(path.join(result.stageRoot!, 'preview-report.json'), 'utf8')).ok, true);
});
test('invalid draft or existing output collision creates no stage and runs no commands', async t => {
  const { root, source } = await fixture(t);
  const runner: PreviewRunner = async () => assert.fail('must not build');
  const invalid = await createSitePreview(root, [{ source: source.replace('"ready"', '"draft"') }], runner);
  assert.equal(invalid.ok, false); assert.equal(invalid.stageRoot, undefined);
  await writeFile(path.join(root, 'src/content/books/candidate.json'), JSON.stringify({ title: '기존', pages: [{ text: '기존 원고', image: '/images/test.png' }] }));
  const collision = await createSitePreview(root, [{ source }], runner);
  assert.equal(collision.stageRoot, undefined); assert.ok(collision.diagnostics.some(d => d.code === 'existing-output'));
});
test('failed check stops build and retains logs/report while preserving source', async t => {
  const { root, source, clean } = await fixture(t);
  let calls = 0;
  const result = await createSitePreview(root, [{ source }], async (_stage, command, log) => { calls++; assert.equal(command, 'check'); await writeFile(log, 'diagnostic'); return 2; });
  clean(result); assert.equal(result.ok, false); assert.equal(calls, 1);
  assert.equal(result.dist, undefined);
  assert.equal(await readFile(result.checks[0].log, 'utf8'), 'diagnostic');
  assert.equal(JSON.parse(await readFile(path.join(result.stageRoot!, 'preview-report.json'), 'utf8')).ok, false);
  assert.deepEqual(await readdir(path.join(root, 'src/content/books')), []);
});
test('successful process without generated candidate page is rejected', async t => {
  const { root, source, clean } = await fixture(t);
  const result = await createSitePreview(root, [{ source }], async (_stage, _command, log) => { await writeFile(log, 'empty build'); return 0; });
  clean(result); assert.equal(result.ok, false); assert.ok(result.diagnostics.some(d => d.code === 'site-preview-failed'));
});
test('source changes are detected even after a failed command', async t => {
  const { root, source, clean } = await fixture(t);
  const result = await createSitePreview(root, [{ source }], async (_stage, _command, log) => {
    await writeFile(path.join(root, 'src/concurrent.txt'), 'external edit'); await writeFile(log, 'failure'); return 1;
  });
  clean(result); assert.equal(result.ok, false); assert.ok(result.diagnostics.some(d => d.code === 'source-changed'));
});
test('rejects source symlinks before any build or temporary copy', async t => {
  const { root, source } = await fixture(t);
  await symlink(path.join(root, '.env'), path.join(root, 'src/secret-link'));
  const result = await createSitePreview(root, [{ source }], async () => assert.fail('must not run'));
  assert.equal(result.ok, false); assert.equal(result.stageRoot, undefined);
  assert.ok(result.diagnostics.some(d => d.message.includes('symlink')));
});

test('byte-identical existing candidates remain no-ops in the isolated site', async t => {
  const { root, source, clean } = await fixture(t);
  const plan = await planPublication(root, [{ source }]); assert.ok(plan.ok);
  for (const file of plan.files) await writeFile(path.join(root, file.relativePath), file.content);
  const result = await createSitePreview(root, [{ source }], success);
  clean(result); assert.ok(result.ok, JSON.stringify(result.diagnostics));
  for (const file of plan.files) {
    assert.equal(await readFile(path.join(root, file.relativePath), 'utf8'), file.content);
    assert.equal(await readFile(path.join(result.stageRoot!, file.relativePath), 'utf8'), file.content);
  }
});
