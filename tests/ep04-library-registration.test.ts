import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { planPublication } from '../content-authoring/publication-plan.ts';
import { validateMasterDraft } from '../content-authoring/schema.ts';
import { parseActivity } from '../src/lib/activities.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const pkg = 'content-authoring/handoffs/ep04/pico-silver-feather';
const read = (name: string) => fs.readFileSync(path.join(root, name));
const json = (name: string) => JSON.parse(read(name).toString('utf8'));
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

test('registered EP04 is the exact approved conversion and can be replayed without writes', async () => {
  const registration = json(`${pkg}/library-registration.json`);
  const candidate = json(`${pkg}/publication-candidate.json`);
  const source = read(`${pkg}/publication-source.json`);
  assert.equal(registration.approvedForLibraryRegistration, true);
  assert.equal(registration.externalDeploymentApproved, false);
  assert.equal(hash(read(`${pkg}/publication-candidate.json`)), registration.candidateSHA256);
  assert.equal(hash(source), registration.publicationSourceSHA256);
  assert.deepEqual(json(`${pkg}/publication-options.json`), registration.options);
  assert.ok(validateMasterDraft(JSON.parse(source.toString('utf8'))).success);
  const plan = await planPublication(root, [{ source: source.toString('utf8'), options: registration.options }]);
  assert.ok(plan.ok);
  assert.equal(plan.files.length, 2);
  assert.ok(plan.files.every(file => file.action === 'noop'));
  for (const file of registration.files) assert.equal(hash(read(file.relativePath)), file.sha256);
  const book = json('src/content/books/pico-silver-feather.json');
  assert.deepEqual(book.pages, candidate.story.scenes.map((scene: { text: string; parentHint: string }, i: number) => ({
    image: `/images/pico-silver-feather/page${i + 1}.png`, text: scene.text,
    hint: scene.parentHint, imageAlt: candidate.images[i].alt,
  })));
  assert.equal(book.cover, book.pages[0].image);
  assert.equal(book.order, registration.options.order);
  // Existing books use orders 1, 2 and the schema default 100; EP04 must be appended.
  assert.ok(book.order > 100);
  assert.deepEqual(book.recommendedAge, { min: 5, max: 10 });
  assert.ok(read('src/content/essays/pico-silver-feather.mdx').toString('utf8').endsWith(candidate.essay.body));
  assert.equal(book.harvardPlay[0].desc, candidate.thinking.activities[0].description);
  const projected = JSON.parse(source.toString('utf8'));
  for (const i of [1, 2]) {
    const activity = candidate.thinking.activities[i];
    assert.deepEqual(projected.thinking.activities[i].extensions.publicationMapping.originalStructuredActivity, activity);
    const parsed = parseActivity(book.harvardPlay[i].desc);
    assert.equal(parsed.steps.length, activity.steps.length);
    for (let j = 0; j < activity.steps.length; j++) {
      const step = activity.steps[j];
      assert.equal(parsed.steps[j].title, step.title);
      const text = parsed.steps[j].blocks.map(block => block.text);
      if (step.explanation) assert.ok(text.includes(step.explanation));
      for (const question of step.questions ?? []) assert.ok(text.includes(question));
    }
  }
  for (const material of candidate.thinking.activities[2].extensions.materials)
    assert.ok(book.harvardPlay[2].desc.includes(material));
});

test('all twelve registered EP04 PNGs are unchanged copies of the supplied illustrations', () => {
  const registration = json(`${pkg}/library-registration.json`);
  assert.equal(registration.images.length, 12);
  const actual = fs.readdirSync(path.join(root, 'public/images/pico-silver-feather')).sort();
  assert.deepEqual(actual, Array.from({ length: 12 }, (_, i) => `page${i + 1}.png`).sort());
  for (const image of registration.images) {
    const published = read(image.publicationPath);
    assert.ok(published.equals(read(image.source)));
    assert.equal(hash(published), image.sha256);
  }
});
