import test from 'node:test';
import assert from 'node:assert/strict';
import { getParentGuidance } from '../src/lib/story-guidance.ts';

test('parent guidance labels existing fields in Korean and preserves their exact text', () => {
  assert.deepEqual(getParentGuidance({ hint: ' 힌트\n원문 ', teachingPoint: '안내', interaction: '질문?' }), [
    { label: '부모를 위한 안내', text: '안내' },
    { label: '아이와 나눌 질문', text: '질문?' },
    { label: '부모 힌트', text: ' 힌트\n원문 ' },
  ]);
});
test('absent guidance stays absent and repeated content is displayed only once', () => {
  assert.deepEqual(getParentGuidance({}), []);
  assert.deepEqual(getParentGuidance({ hint: '  ' }), []);
  assert.deepEqual(getParentGuidance({ teachingPoint: '같은 안내', hint: ' 같은 안내 ' }), [
    { label: '부모를 위한 안내', text: '같은 안내' },
  ]);
});
