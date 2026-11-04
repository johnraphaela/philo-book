import test from 'node:test';
import assert from 'node:assert/strict';
import { getDialogueQuestions } from '../src/lib/dialogue-questions.ts';
test('counts only nonempty distinct questions across all sources', () => {
  assert.deepEqual(getDialogueQuestions({ dialogueQuestions: ['', ' \n '], parentReflectionQuestion: ' ' }), []);
  assert.deepEqual(getDialogueQuestions({ coreQuestion: '왜 그럴까?', dialogueQuestions: [' 왜 그럴까? ', ''], parentReflectionQuestion: '왜 그럴까?' }), [{ text: '왜 그럴까?', label: '오늘의 철학 질문' }]);
  assert.deepEqual(getDialogueQuestions({ coreQuestion: '핵심?', dialogueQuestions: ['다른 질문?', '다른  질문?', ''], parentReflectionQuestion: '나의 생각?' }).map(q => q.text), ['핵심?', '다른 질문?', '나의 생각?']);
  assert.equal(getDialogueQuestions({ parentReflectionQuestion: '내 생각?' })[0].label, '어른의 성찰 질문');
});
