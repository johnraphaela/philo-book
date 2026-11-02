import test from 'node:test';
import fs from 'node:fs';
import { parseActivity as parse } from '../src/lib/activities.ts';
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
  const moved = previewBook.harvardPlay[0];
  assert.ok(moved);
  assert.ok(moved.title.includes('5~7세 아이와 나누는 대화법'));
  assert.equal(previewBook.harvardPlay[1].title, '일상에서 실천하는 철학 놀이');
  const html = await renderActivityMarkdown(moved.desc);
  assert.ok(html.includes('부모 (Return)'));
  assert.ok(previewBook.harvardPlay[1].desc.includes('소망의 디딤돌 그리기'));
  assert.equal(verify().sourceRoundTrip, 'passed');
});


test('rearranged ep03 preserves every unique source line and has two independent numbering sequences', () => {
  const source = fs.readFileSync('content-authoring/pilots/ep03-hope/source/ep03-hope.mdx.txt', 'utf8');
  const tail = source.slice(source.indexOf('### 3. '));
  const output = previewBook.harvardPlay.map((item: {title: string; desc: string}) => item.title + '\n' + item.desc).join('\n');
  for (const line of tail.split('\n').filter(line => line.trim() && line !== '---')) {
    const text = line.replace(/^#{3,4} (?:\d[.)] )?/, '').replace(/^\d\. /, '');
    assert.ok(output.includes(text), text);
  }
  for (const activity of book.harvardPlay) assert.ok(output.includes(activity.desc));
  const dialogue = parse(previewBook.harvardPlay[0].desc);
  const practical = parse(previewBook.harvardPlay[1].desc);
  assert.deepEqual(dialogue.steps.map(step => [step.label, step.number]), [['대화', '1'], ['대화', '2']]);
  assert.deepEqual(practical.steps.map(step => [step.label, step.number]), [['활동', '1'], ['활동', '2']]);
  assert.ok(dialogue.outro?.startsWith('희망은 미래의 기적이 아니라,'));
  assert.ok(!dialogue.steps[1].blocks.some(block => block.text.includes('희망은 미래의 기적')));
  for (const step of practical.steps) assert.deepEqual(step.blocks.map(block => block.label), ['준비물', '방법']);
  assert.ok(!output.includes('####'));
  assert.ok(!output.includes('### 4.'));
});
