import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseManuscript } from '../scripts/book-import.ts';
import { metadataFields } from '../scripts/import-metadata.ts';
import { CONTENT_CATEGORIES, CONTENT_SUBTOPICS } from '../src/lib/taxonomy.ts';
import { getDialogueQuestions } from '../src/lib/dialogue-questions.ts';

const skill = fs.readFileSync('docs/gemini-skill/SKILL.md', 'utf8');
const example = fs.readFileSync('docs/gemini-skill/references/ep04-example.md', 'utf8');
test('GitHub Gemini Skill has a visible version and taxonomy IDs matching the importer', () => {
  const version = /^Version: (\d+\.\d+\.\d+)$/m.exec(skill)?.[1];
  const date = /^Updated: (\d{4}-\d{2}-\d{2})$/m.exec(skill)?.[1];
  assert(version); assert(date);
  const changelog = fs.readFileSync('docs/gemini-skill/CHANGELOG.md', 'utf8');
  assert(changelog.includes(`${version} — ${date}`));
  for (const label of Object.keys(metadataFields)) assert(skill.includes(label), label);
  const taxonomy = skill.split('<!-- taxonomy:start -->')[1].split('<!-- taxonomy:end -->')[0];
  const rows = taxonomy.split('\n').filter(line => line.startsWith('| `'));
  assert.deepEqual(rows.map(row => row.split('|')[1].trim().replaceAll('`', '')), CONTENT_CATEGORIES.map(c => c.id));
  for (const row of rows) {
    const group = row.split('|')[1].trim().replaceAll('`', '');
    const ids = [...row.split('|')[2].matchAll(/`([^`]+)`/g)].map(match => match[1]);
    assert.deepEqual(ids, CONTENT_SUBTOPICS.filter(t => t.group === group).map(t => t.id));
  }
});
test('standard EP04 reference parses all six metadata fields and has one prompt per scene', () => {
  assert(example.startsWith('Metadata\n'));
  const parsed = parseManuscript(example);
  assert.equal(parsed.scenes.length, 12);
  assert.deepEqual(parsed.publicationMetadata, {
    primaryCategory: 'identity', subtopics: ['comparison', 'individuality'], recommendedAge: { min: 5, max: 10 },
    coreQuestion: '남보다 잘해야만 내 날개가 멋진 걸까?',
    dialogueQuestions: ['피코는 왜 친구들과 자신을 비교했을까?', '내가 좋아하는 일과 잘하는 일은 꼭 같아야 할까?'],
    parentReflectionQuestion: '나는 아이가 무언가를 잘할 때만 칭찬하고 있지는 않을까?',
  });
  assert.equal(getDialogueQuestions(parsed.publicationMetadata!).length, 4);
  const prompts = parsed.sections['Illustration Guide']['Image Prompts'];
  assert.deepEqual([...prompts.matchAll(/^Page (\d+)\s*$/gm)].map(match => Number(match[1])), Array.from({ length: 12 }, (_, i) => i + 1));
  assert.match(example, /표준 형식 예시\(미승인\)/);
});
