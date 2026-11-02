import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateMasterDraft } from '../content-authoring/schema.ts';
import { inspectAstroDraft } from '../content-authoring/adapter.ts';

const minimal = { schemaVersion: 1, id: 'new-book', status: 'draft' };
const complete = {
  ...minimal, status: 'ready',
  metadata: { title: '제목', theme: '변화', categories: [], ageGroups: ['5-7세'] },
  story: { scenes: [{ id: 'scene-one', text: '  원문 그대로  ' }] },
  images: [{ sceneId: 'scene-one', assetPath: '/images/example.jpg' }],
};
test('minimal draft and experimental fields round-trip without defaults or mutation', () => {
  const input = { ...minimal, extensions: { 'experiment:v1': { custom: ['자료'] } } };
  const before = structuredClone(input);
  const result = validateMasterDraft(input);
  assert.equal(result.success, true);
  if (result.success) assert.deepEqual(result.data, before);
  assert.deepEqual(input, before);
});
test('rejects unknown versions, states, misspelled fields and unsafe identifiers', () => {
  for (const input of [{ ...minimal, schemaVersion: 2 }, { ...minimal, status: 'published' },
    { ...minimal, stroy: {} }, { ...minimal, id: '../escape' }]) {
    assert.equal(validateMasterDraft(input).success, false);
  }
});
test('scene IDs survive ordering changes; duplicates and dangling image references fail', () => {
  const scenes = [{ id: 'first' }, { id: 'second' }];
  assert.equal(validateMasterDraft({ ...minimal, story: { scenes: [...scenes].reverse() }, images: [{ sceneId: 'first' }] }).success, true);
  for (const input of [
    { ...minimal, story: { scenes: [scenes[0], scenes[0]] } },
    { ...minimal, images: [{ sceneId: 'missing' }] },
    { ...complete, images: [{ sceneId: 'scene-one' }, { sceneId: 'scene-one' }] },
  ]) assert.equal(validateMasterDraft(input).success, false);
});
test('activity and step IDs must be unique within their respective scopes', () => {
  const activity = { id: 'play', steps: [{ id: 'ask' }, { id: 'ask' }] };
  assert.equal(validateMasterDraft({ ...minimal, thinking: { activities: [activity] } }).success, false);
  assert.equal(validateMasterDraft({ ...minimal, thinking: { activities: [{ id: 'play' }, { id: 'play' }] } }).success, false);
});
test('authoring-valid drafts report missing publication data instead of synthesizing it', () => {
  const input = JSON.parse(fs.readFileSync('content-authoring/examples/seed-and-wind.json', 'utf8'));
  const before = structuredClone(input);
  assert.equal(validateMasterDraft(input).success, true);
  const issues = inspectAstroDraft(input);
  for (const path of ['status', 'metadata.categories', 'metadata.ageGroups', 'story.scenes.1.text', 'essay.tags', 'thinking.activities.0']) {
    assert.ok(issues.some(issue => issue.path === path && issue.severity === 'error'), path);
  }
  assert.ok(issues.some(issue => issue.code === 'missing-image'));
  assert.ok(issues.some(issue => issue.code === 'authoring-only'));
  assert.deepEqual(input, before);
});
test('explicit publication data passes required-source checks while assets remain unverified', () => {
  const issues = inspectAstroDraft(complete);
  assert.equal(issues.filter(issue => issue.severity === 'error').length, 0);
  assert.ok(issues.some(issue => issue.code === 'asset-unverified'));
  const whitespace = validateMasterDraft(complete);
  if (whitespace.success) assert.equal(whitespace.data.story?.scenes[0].text, '  원문 그대로  ');
});
test('present but incomplete essays cannot silently disappear', () => {
  const issues = inspectAstroDraft({ ...complete, essay: {} });
  for (const field of ['title', 'body', 'tags']) assert.ok(issues.some(issue => issue.path === `essay.${field}`));
});
