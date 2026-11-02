import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { validateMasterDraft } from '../content-authoring/schema.ts';
import { reviewCandidate, reviewResearch } from '../.agents/skills/philo-book-author/scripts/review-candidate.ts';

const root = '.agents/skills/philo-book-author';
const load = (path: string) => JSON.parse(fs.readFileSync(`${root}/${path}`, 'utf8'));
const original = load('examples/sample-draft.json');
const candidate = load('examples/sample-revise.json');
test('template and examples remain Master Draft v1 without schema changes', () => {
  for (const file of ['assets/authoring-template.json', 'examples/sample-draft.json', 'examples/sample-revise.json']) {
    assert.equal(validateMasterDraft(load(file)).success, true, file);
    assert.deepEqual(reviewResearch(load(file)), [], file);
  }
});
test('selected essay revision leaves story, activities, images and research untouched', () => {
  const result = reviewCandidate(original, candidate, ['/essay/body']);
  assert.deepEqual(result, { changedPaths: ['/essay/body'], errors: [] });
  for (const key of ['story', 'thinking', 'images', 'extensions']) assert.deepEqual(candidate[key], original[key]);
});
test('rejects scope escape, identity changes, and malformed allowed pointers', () => {
  const bad = structuredClone(candidate);
  bad.story.scenes[0].text = '범위 밖 원고 변경';
  assert.ok(reviewCandidate(original, bad, ['/essay/body']).errors.some(error => error.includes('범위 밖')));
  bad.id = 'another-book';
  assert.ok(reviewCandidate(original, bad, ['/story', '/essay']).errors.some(error => error.includes('id')));
  assert.ok(reviewCandidate(original, candidate, ['/']).errors.length);
  assert.ok(reviewCandidate(original, candidate, ['/essay/~broken']).errors.length);
});
test('rejects scene ID replacement and broken scene references', () => {
  const bad = structuredClone(original);
  bad.story.scenes[1].id = 'replaced-scene';
  assert.ok(reviewCandidate(original, bad, ['/story']).errors.some(error => error.includes('ID')));
  bad.images[0].sceneId = 'missing-scene';
  assert.equal(validateMasterDraft(bad).success, false);
});
test('research statuses are exact and verified sources require evidence records', () => {
  for (const verification of ['partially_verified', 'unverified', 'suggested']) {
    const draft = structuredClone(original);
    draft.extensions.research.sources = [{ id: 'fixture', label: '테스트 자료', verification }];
    draft.extensions.research.claims = [];
    assert.deepEqual(reviewResearch(draft), []);
  }
  const bad = structuredClone(original);
  bad.extensions.research.sources[0].verification = 'partially-verified';
  assert.ok(reviewResearch(bad).length);
  bad.extensions.research.sources[0].verification = 'verified';
  delete bad.extensions.research.sources[0].evidenceNote;
  assert.ok(reviewResearch(bad).length);
});
test('research rejects missing source links and unverified empirical assertions', () => {
  const bad = structuredClone(original);
  bad.extensions.research.claims = [{ kind: 'empirical', text: '테스트용 효과 주장', sourceIds: ['missing'], verification: 'verified' }];
  assert.ok(reviewResearch(bad).length);
  bad.extensions.research.claims[0].sourceIds = ['perspective-study-search'];
  assert.ok(reviewResearch(bad).length);
});
test('scope guard does not mutate either input', () => {
  const a = structuredClone(original), b = structuredClone(candidate);
  reviewCandidate(a, b, ['/essay/body']);
  assert.deepEqual(a, original); assert.deepEqual(b, candidate);
});
test('first research addition permits the selected subtree, not sibling extensions', () => {
  const before = { schemaVersion: 1, id: 'new-book', status: 'draft' };
  const after = { ...before, extensions: { research: { sources: [] } } };
  assert.deepEqual(reviewCandidate(before, after, ['/extensions/research']).errors, []);
  assert.ok(reviewCandidate(before, { ...after, extensions: { ...after.extensions, unrelated: '변경' } }, ['/extensions/research']).errors.length);
});
test('example essay renders paragraphs without duplicate H1 or code-wrapped prose', async () => {
  const markdown = await createMarkdownProcessor({ syntaxHighlight: false });
  for (const draft of [original, candidate]) {
    const html = (await markdown.render(draft.essay.body)).code;
    assert.match(html, /<p>/);
    assert.ok(!html.includes('<h1'));
    assert.ok(!html.includes('<pre>'));
    assert.ok(!html.includes('**'));
  }
});
