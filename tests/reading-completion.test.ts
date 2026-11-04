import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Compile this isolated TSX view with the repository's existing TypeScript;
// exercise its rendered HTML without adding a test renderer or DOM framework.
const source = fs.readFileSync(new URL('../src/components/book/ReadingCompletion.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: {
  jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022,
} }).outputText.replace('"react/jsx-runtime"', JSON.stringify(import.meta.resolve('react/jsx-runtime')));
const { default: Completion } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const render = (props: Record<string, unknown>) => renderToStaticMarkup(createElement(Completion, {
  title: '시험 책', headingId: 'completion-title', hasEssay: false, hasActivities: false, dialogue: false,
  onDialogue() {}, onComplete() {}, onReadAgain() {}, onLastPage() {}, onTab() {}, ...props,
}));

test('completion renders the original core question and only available follow-up content', () => {
  for (const hasEssay of [false, true]) for (const hasActivities of [false, true]) {
    const html = render({ coreQuestion: '나의 가치는 그대로일까?', hasEssay, hasActivities });
    assert.match(html, /나의 가치는 그대로일까\?/);
    assert.equal(html.includes('어른의 시선'), hasEssay);
    assert.equal(html.includes('생각 펼치기'), hasActivities);
    assert.match(html, /생각 나누기/);
    assert.match(html, /처음부터 다시 읽기/);
    assert.match(html, /마지막 장면 다시 보기/);
    assert.match(html, /PHILO-PAIRING/);
    assert.match(html, /option-dialogue/);
    assert.match(html, /아이와 서로의 생각을 듣고 질문해요/);
    assert.match(html, /aria-describedby="completion-title-dialogue-description"/);
    assert.equal((html.match(/<svg/g) ?? []).length, 1 + Number(hasEssay) + Number(hasActivities));
    assert.equal((html.match(/aria-hidden="true" focusable="false"/g) ?? []).length, 1 + Number(hasEssay) + Number(hasActivities));
    assert.match(html, /aria-labelledby="completion-title-question"/);
  }
});
test('missing questions stay absent; dialogue uses one question and an optional common guide', () => {
  const absent = render({});
  assert(!absent.includes('오늘의 철학 질문'));
  assert(!absent.includes('completion-question'));
  const html = render({ dialogue: true, coreQuestion: '다르게 생각해도 될까?' });
  assert.equal((html.match(/다르게 생각해도 될까\?/g) ?? []).length, 1);
  assert.match(html, /왜 그렇게 생각했는지 물어보세요/);
  assert.match(html, /← 이야기 너머로/);
  assert.equal((html.match(/← 이야기 너머로/g) ?? []).length, 1);
  assert(!html.includes('<input'));
  assert(!html.includes('<form'));
});
