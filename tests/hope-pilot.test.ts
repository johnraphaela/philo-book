import test from 'node:test';
import assert from 'node:assert/strict';
import { imported, previewBook, publishedMdx, verify, book } from '../content-authoring/pilots/ep03-hope/pilot.ts';
import { validateMasterDraft } from '../content-authoring/schema.ts';
import { parseActivity } from '../src/lib/activities.ts';
import { renderActivityMarkdown } from '../src/lib/activity-markdown.ts';

test('Gemini pilot preserves all original values, whitespace, source link and stable unique IDs', () => {
  assert.equal(verify().sourceRoundTrip, 'passed');
  const duplicate = structuredClone(imported);
  duplicate.story.scenes[1].id = duplicate.story.scenes[0].id;
  assert.equal(validateMasterDraft(duplicate).success, false);
  const dangling = structuredClone(imported);
  dangling.images[0].sceneId = 'missing-scene';
  assert.equal(validateMasterDraft(dangling).success, false);
});
test('both original unstructured activities render without invented steps or lost descriptions', async () => {
  for (const item of book.harvardPlay) {
    const parsed = parseActivity(item.desc);
    assert.equal(parsed.intro, item.desc);
    assert.equal(parsed.steps.length, 0);
    const html = await renderActivityMarkdown(parsed.intro);
    assert.ok(html.includes('<p>'));
    assert.ok(html.includes(item.desc.includes('스펙트럼') ? '스펙트럼' : '내일 먼저 인사하기'));
  }
});

test('uploaded jpg assets are mapped explicitly while original jpeg paths survive', () => {
  assert.deepEqual(verify().missingImages, []);
  for (let i = 0; i < 12; i++) {
    assert.equal(imported.images[i].extensions.sourceAssetPath, book.pages[i].image);
    assert.equal(previewBook.pages[i].image, `/images/ep03/page${i + 1}.jpg`);
  }
});

test('ep03 uses its uploaded first image as cover and moves essay sections 3 onwards into activities', async () => {
  assert.equal(previewBook.cover, '/images/ep03/page1.jpg');
  assert.ok(!publishedMdx.includes('### 3.'));
  assert.ok(!publishedMdx.includes('### 4.'));
  const moved = previewBook.harvardPlay[2];
  assert.ok(moved);
  assert.ok(moved.title.includes('5~7세 아이와 나누는 대화법'));
  assert.ok(moved.desc.includes('일상에서 실천하는 철학 놀이'));
  const html = await renderActivityMarkdown(moved.desc);
  assert.ok(html.includes('부모 (Return)'));
  assert.ok(html.includes('소망의 디딤돌 그리기'));
  assert.equal(verify().sourceRoundTrip, 'passed');
});
