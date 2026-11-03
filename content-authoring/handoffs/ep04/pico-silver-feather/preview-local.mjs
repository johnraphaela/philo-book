/** EP04 technical preview only. Never promotes or writes the supplied manuscript. */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const expectedDraft = 'b666aeccc59efb74459018e73246015e633dc68d021df7948e737a70f30ae55c';
const entries = ['src', 'public', 'content-authoring', 'scripts', 'astro.config.mjs', 'tsconfig.json', 'package.json', 'package-lock.json'];

async function snapshot(base) {
  const result = new Map();
  async function visit(relative) {
    const file = path.join(base, relative); const info = await fs.lstat(file);
    if (info.isSymbolicLink()) throw new Error(`Source symlink refused: ${relative}`);
    if (info.isDirectory()) {
      for (const name of (await fs.readdir(file)).sort()) {
        if (name.startsWith('.env') || ['.git', 'node_modules', 'dist', '.astro'].includes(name)) continue;
        await visit(path.join(relative, name));
      }
    } else if (info.isFile()) result.set(relative, await fs.readFile(file));
    else throw new Error(`Non-file refused: ${relative}`);
  }
  for (const entry of entries) await visit(entry);
  return result;
}

export async function previewEP04({
  sourceFile = 'master-draft.json',
  expectedSourceHash = expectedDraft,
  publicationOptions = { cover: { mode: 'scene', sceneId: 'scene-01' }, order: 4 },
} = {}) {
  assert.ok(['master-draft.json', 'publication-candidate.json'].includes(sourceFile));
  const original = await snapshot(root);
  let workspace;
  try {
    const raw = await fs.readFile(path.join(here, sourceFile));
    assert.equal(hash(raw), expectedSourceHash, 'Manuscript changed: review the new revision before previewing.');
    const source = JSON.parse(raw.toString('utf8'));
    const manifest = JSON.parse(await fs.readFile(path.join(here, 'image-manifest.json'), 'utf8'));
    const observed = JSON.parse(await fs.readFile(path.join(here, 'validation/images.json'), 'utf8'));
    const { validateMasterDraft } = await import(pathToFileURL(path.join(root, 'content-authoring/schema.ts')).href);
    assert.ok(validateMasterDraft(source).success);
    assert.equal(source.id, 'pico-silver-feather'); assert.equal(source.status, 'draft');
    assert.equal(manifest.bookId, source.id);
    assert.deepEqual(manifest.cover, { mode: 'reuse-scene', imageId: 'img-scene-01' });
    assert.equal(source.story.scenes.length, 12); assert.equal(source.images.length, 12);
    assert.equal(source.thinking.activities.length, 3); assert.equal(manifest.images.length, 12);
    const candidate = structuredClone(source);
    // This flag is ONLY on the temporary adapter input; no approval or original status is written.
    candidate.status = 'ready';
    candidate.extensions = { ...candidate.extensions, ep04TechnicalPreview: {
      approvedForPublication: false, sourceStatus: source.status, sourceHash: hash(raw),
      note: 'Temporary test input; original draft and review issues remain unchanged.'
    } };
    const imageBytes = [];
    for (let i = 0; i < 12; i++) {
      const sceneId = `scene-${String(i + 1).padStart(2, '0')}`;
      const imageId = `img-${sceneId}`; const file = `images/page${i + 1}.png`;
      assert.equal(source.story.scenes[i].id, sceneId); assert.ok(source.story.scenes[i].parentHint);
      const item = manifest.images.find(image => image.sceneId === sceneId);
      assert.equal(item?.id, imageId); assert.equal(item.file, file);
      assert.equal(item.status, 'provided'); assert.equal(item.exists, true);
      const image = source.images.find(image => image.sceneId === sceneId); assert.ok(image);
      assert.equal(image.alt, item.alt, 'Resolve alt differences before preview.');
      const bytes = await fs.readFile(path.join(here, file));
      assert.equal(hash(bytes), observed.find(record => record.sceneId === sceneId)?.sha256);
      imageBytes.push({ name: `page${i + 1}.png`, bytes });
      candidate.images.find(image => image.sceneId === sceneId).assetPath = `/images/pico-silver-feather/page${i + 1}.png`;
    }
    const ids = candidate.thinking.activities.map(activity => activity.id);
    assert.deepEqual(ids, ['parent-guide', 'book-conversation', 'make-feather']);
    const mappings = [];
    for (const [i, activity] of candidate.thinking.activities.entries()) {
      if (!activity.steps) continue;
      assert.deepEqual(activity.steps.map(step => step.id), i === 1 ? ['ask-feeling', 'ask-conatus'] : ['draw-feather', 'play-fly']);
      assert.ok(!activity.references?.length);
      const label = i === 1 ? '대화' : '활동';
      const intro = activity.extensions?.materials ? `준비물: ${activity.extensions.materials.join(', ')}` : '';
      const blocks = activity.steps.map((step, n) => {
        assert.ok(!step.title.includes(']') && !step.title.includes('\n'));
        const content = [
          `${label} ${n + 1} [${step.title}]`,
          ...(step.goal ? [`목표: ${step.goal}`] : []),
          ...(step.explanation ? ['방법:', step.explanation] : []),
          ...(step.questions?.length ? ['질문:', ...step.questions] : []),
        ].join('\n');
        mappings.push({ source: `thinking.activities.${i}.steps.${n}`, stepId: step.id, label, number: n + 1, output: content });
        return content;
      });
      const preserved = structuredClone(activity);
      activity.description = [activity.description, intro, ...blocks].filter(Boolean).join('\n\n');
      activity.extensions = { ...activity.extensions, ep04TechnicalPreview: { originalStructuredActivity: preserved } };
      delete activity.steps;
      // No references exist in this exact EP04 revision; adding any requires a new reviewed mapping.
    }
    assert.ok(validateMasterDraft(candidate).success);
    workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'philo-ep04-input-'));
    for (const [relative, bytes] of original) {
      const dest = path.join(workspace, relative); await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.writeFile(dest, bytes, { flag: 'wx' });
    }
    const assets = path.join(workspace, 'public/images/pico-silver-feather');
    await fs.mkdir(assets); // Collision is an error: never overwrite an existing publication asset.
    for (const item of imageBytes) await fs.writeFile(path.join(assets, item.name), item.bytes, { flag: 'wx' });
    const deps = await fs.realpath(path.join(root, 'node_modules'));
    await fs.symlink(deps, path.join(workspace, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
    const input = JSON.stringify(candidate, null, 2) + '\n';
    const options = publicationOptions;
    await fs.writeFile(path.join(workspace, 'test-candidate.json'), input, { flag: 'wx' });
    await fs.writeFile(path.join(workspace, 'test-options.json'), JSON.stringify(options, null, 2) + '\n', { flag: 'wx' });
    await fs.writeFile(path.join(workspace, 'activity-mapping.json'), JSON.stringify(mappings, null, 2) + '\n', { flag: 'wx' });
    const { planPublication } = await import(pathToFileURL(path.join(root, 'content-authoring/publication-plan.ts')).href);
    const plan = await planPublication(workspace, [{ source: input, options }]);
    await fs.writeFile(path.join(workspace, 'publication-plan.json'), JSON.stringify(plan, null, 2) + '\n', { flag: 'wx' });
    if (!plan.ok) throw new Error(`Preview plan failed: ${JSON.stringify(plan.diagnostics)}`);
    const { parseActivity } = await import(pathToFileURL(path.join(root, 'src/lib/activities.ts')).href);
    const book = JSON.parse(plan.files.find(file => file.relativePath.endsWith(`/books/${source.id}.json`)).content);
    for (let i = 0; i < 12; i++) {
      assert.equal(book.pages[i].text, source.story.scenes[i].text);
      assert.equal(book.pages[i].hint, source.story.scenes[i].parentHint);
      assert.equal(book.pages[i].imageAlt, source.images[i].alt);
    }
    for (const i of [1, 2]) {
      const parsed = parseActivity(book.harvardPlay[i].desc);
      assert.equal(parsed.steps.length, source.thinking.activities[i].steps.length);
      for (const [j, step] of source.thinking.activities[i].steps.entries()) {
        assert.equal(parsed.steps[j].title, step.title);
        const texts = parsed.steps[j].blocks.map(block => block.text);
        if (step.explanation) assert.ok(texts.includes(step.explanation));
        for (const question of step.questions ?? []) assert.ok(texts.includes(question));
      }
    }
    const { createSitePreview } = await import(pathToFileURL(path.join(root, 'content-authoring/site-preview.ts')).href);
    const site = await createSitePreview(workspace, [{ source: input, options }]);
    const result = { technicalPreviewOnly: true, approvedForPublication: false, sourceStatus: source.status, sourceFile,
      workspace, input: path.join(workspace, 'test-candidate.json'), plan: path.join(workspace, 'publication-plan.json'), site };
    await fs.writeFile(path.join(workspace, 'ep04-local-preview.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
    console.log(JSON.stringify(result, null, 2));
    if (!site.ok) process.exitCode = 1;
  } finally {
    const after = await snapshot(root);
    assert.equal(after.size, original.size, 'Source file inventory changed during preview.');
    for (const [relative, bytes] of original) assert.ok(after.get(relative)?.equals(bytes), `Source changed: ${relative}`);
    console.error('EP04 preview: original manuscript, source site and image bytes unchanged.');
    if (workspace) console.error(`Technical test workspace: ${workspace}`);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 2) {
    console.error('Usage: node --experimental-strip-types preview-local.mjs'); process.exitCode = 1;
  } else previewEP04().catch(error => { console.error(error); process.exitCode = 1; });
}
