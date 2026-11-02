import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import remarkCjkFriendly from 'remark-cjk-friendly/parseOnly';
import rehypeEssayLayout from '../src/plugins/rehype-essay-layout.mjs';
import { parseActivity, isReferenceActivity } from '../src/lib/activities.ts';
import { renderActivityMarkdown } from '../src/lib/activity-markdown.ts';

const markdown = await createMarkdownProcessor({
  remarkPlugins: [remarkCjkFriendly], rehypePlugins: [rehypeEssayLayout], smartypants: false, syntaxHighlight: false,
});
test('Korean emphasis next to punctuation renders as strong, including in lists and quotes', async () => {
  const html = (await markdown.render('**‘테세우스의 배(Ship of Theseus)’**를 생각해요.\n\n- **‘코나투스(Conatus)’**입니다.\n\n> **"나는 나인가?"**라는 질문')).code;
  assert.equal((html.match(/<strong>/g) ?? []).length, 3);
  assert.ok(!html.includes('**'));
  assert.match(html, /<ul>/); assert.match(html, /<blockquote>/);
});
test('removes only a matching opening title and preserves other headings and sections', async () => {
  const html = (await markdown.render('# 같은 제목\n\n본문\n\n### 소제목\n\n내용\n\n## 함께 생각할 질문\n\n질문 원문\n\n## 참고문헌\n\n- 자료 원문', { frontmatter: { title: '같은 제목', bookId: 'book' } })).code;
  assert.ok(!html.includes('같은 제목'));
  assert.match(html, /reading-questions/); assert.match(html, /reading-references/);
  assert.match(html, /질문 원문/); assert.match(html, /자료 원문/);
  assert.match(html, /<h[23][^>]*>소제목/);
  const distinct = (await markdown.render('# 다른 제목', { frontmatter: { title: '대표 제목', bookId: 'book' } })).code;
  assert.match(distinct, /다른 제목/);
});
test('literal code and escaped emphasis are preserved', async () => {
  const html = (await markdown.render('`**그대로**`\n\n\\*\\*리터럴\\*\\*')).code;
  assert.match(html, /<code>\*\*그대로\*\*<\/code>/);
  assert.ok(!html.includes('<strong>'));
});
test('existing ep2 legacy JSON produces three steps with every body line retained', () => {
  const book = JSON.parse(fs.readFileSync('src/content/books/ep02-self-esteem.json', 'utf8'));
  const source = book.harvardPlay[0].desc;
  const parsed = parseActivity(source);
  assert.equal(parsed.steps.length, 3);
  assert.equal(parsed.steps[0].number, '1');
  assert.ok(parsed.steps.some(step => step.blocks.some(block => block.kind === 'question')));
  const rebuilt = [parsed.intro, ...parsed.steps.flatMap(step => [
    `${step.number}단계 [${step.title}]: ${step.goal}`, ...step.blocks.map(block => block.text),
  ])].join('\n').replace(/\s+/g, '');
  assert.equal(rebuilt, source.replace(/\s+/g, ''));
});
test('simple legacy activity stays intact without fabricated steps; references are separate', async () => {
  const desc = '설명 원문\n\n- **강조** 목록';
  assert.deepEqual(parseActivity(desc), { intro: desc, steps: [] });
  assert.equal(isReferenceActivity('더 깊이 읽고 싶다면 (Recommended References)'), true);
  assert.equal(isReferenceActivity('놀이 1'), false);
  assert.match(await renderActivityMarkdown(desc), /<strong>강조<\/strong>/);
});

test('opt-in dialogue/activity markers preserve paragraphs and leave legacy Markdown headings alone', () => {
  const parsed = parseActivity('도입\n\n대화 1 [이야기 나누기]\n질문과 대화:\n- **아이:** 첫 말\n- **부모:** 답\n\n두 번째 문단\n\n마무리:\n끝 문장');
  assert.equal(parsed.steps[0].title, '이야기 나누기');
  assert.ok(parsed.steps[0].blocks[0].text.includes('\n\n두 번째 문단'));
  assert.equal(parsed.outro, '끝 문장');
  assert.deepEqual(parseActivity('#### 1) 일반 Markdown 제목\n본문'), {intro:'#### 1) 일반 Markdown 제목\n본문',steps:[]});
});

test('all ep01 and ep02 activities preserve legacy text and step headings', () => {
  for (const id of ['ep01-robot-mong', 'ep02-self-esteem']) {
    const book = JSON.parse(fs.readFileSync(`src/content/books/${id}.json`, 'utf8'));
    for (const activity of book.harvardPlay ?? []) {
      const parsed = parseActivity(activity.desc);
      const rebuilt = [parsed.intro, ...parsed.steps.flatMap(step => [
        `${step.number}단계 [${step.title}]: ${step.goal}`, ...step.blocks.map(block => block.text),
      ])].join('\n').replace(/\s+/g, '');
      assert.equal(rebuilt, activity.desc.replace(/\s+/g, ''), `${id}: ${activity.title}`);
      assert.ok(parsed.steps.every(step => step.label === undefined));
    }
  }
});
