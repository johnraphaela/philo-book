/** Deliberately limited to the two supplied ep03 files. No publication writer. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validateMasterDraft } from '../../schema.ts';
import { inspectAstroDraft } from '../../adapter.ts';

export const directory = path.dirname(fileURLToPath(import.meta.url));
const read = (name: string) => fs.readFileSync(path.join(directory, 'source', name), 'utf8');
const bookRaw = read('ep03-hope.json');
export const book = JSON.parse(bookRaw);
export const mdx = read('ep03-hope.mdx.txt');
const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(mdx);
assert.ok(match, 'Expected frontmatter');
// This fixture uses JSON-compatible scalar/array values, not arbitrary YAML.
const frontmatter = Object.fromEntries(match[1].split(/\r?\n/).map(line => {
  const split = line.indexOf(':');
  assert.ok(split > 0, 'Unsupported fixture frontmatter');
  return [line.slice(0, split), JSON.parse(line.slice(split + 1).trim())];
}));
assert.deepEqual(Object.keys(frontmatter).sort(), ['bookId', 'tags', 'title']);
assert.equal(frontmatter.bookId, 'ep03-hope');
const body = mdx.slice(match[0].length);
const sceneIds = ['empty-jar', 'golden-cloud', 'busy-friends', 'rainy-expectation',
  'grey-sky', 'disappointment', 'falling-drop', 'color-discovery', 'gathering-drops',
  'finding-angle', 'rainbow-result', 'active-hope'].map(id => `ep03-${id}`);
const activityIds = ['ep03-rainbow-experiment', 'ep03-wish-action'];
assert.equal(book.pages.length, sceneIds.length);
assert.equal(book.harvardPlay.length, activityIds.length);
const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
export const imported = {
  schemaVersion: 1, id: 'ep03-hope', status: 'draft',
  metadata: { title: book.title, theme: book.theme, categories: book.categories, ageGroups: book.ageGroups },
  story: { scenes: book.pages.map((page: any, i: number) => ({ id: sceneIds[i], text: page.text, parentHint: page.hint })) },
  essay: { title: frontmatter.title, tags: frontmatter.tags, body,
    extensions: { sourceFrontmatter: frontmatter } },
  thinking: { activities: book.harvardPlay.map((item: any, i: number) => ({ id: activityIds[i], title: item.title, description: item.desc })) },
  images: book.pages.map((page: any, i: number) => ({ sceneId: sceneIds[i], assetPath: page.image.replace(/\.jpeg$/, '.jpg'),
    extensions: { sourceAssetPath: page.image } })),
  extensions: { geminiImport: {
    sourceFiles: [ { path: 'source/ep03-hope.json', sha256: hash(bookRaw) },
      { path: 'source/ep03-hope.mdx.txt', sha256: hash(mdx) } ],
    imageStatus: 'mapped-to-uploaded-jpg-assets',
    missing: ['summary', 'cover', 'recommendedAge', 'topics', 'order', 'essay.subtitle',
      'imageAlt', 'imagePrompts', 'activity.steps', 'activity.references', 'verifiedBibliography'],
  } },
};

const playHeading = '### 3. 5~7세 아이와 나누는 대화법 (하버드 Serve & Return 적용)\n\n';
const playStart = body.indexOf(playHeading);
assert.ok(playStart > 0, 'Expected explicit section 3 boundary');
const essayPrefix = match[0] + body.slice(0, playStart);
export const publishedMdx = essayPrefix.replace(/\n\n$/, '\n');
const boundaryWhitespace = essayPrefix.slice(publishedMdx.length);
const movedPlay = body.slice(playStart + playHeading.length);
assert.equal(publishedMdx + boundaryWhitespace + playHeading + movedPlay, mdx, 'Publication split must preserve every original character');
export const previewBook = { ...book, cover: imported.images[0].assetPath,
  harvardPlay: [...book.harvardPlay, {
    title: '5~7세 아이와 나누는 대화법 (하버드 Serve & Return 적용)', desc: movedPlay,
  }], pages: book.pages.map((page: any, i: number) => ({
  ...page, image: imported.images[i].assetPath,
})) };

export function verify() {
  const draft = JSON.parse(fs.readFileSync(path.join(directory, 'master-draft.v1.json'), 'utf8'));
  assert.deepEqual(draft, imported, 'Saved draft differs from lossless source mapping');
  assert.equal(validateMasterDraft(draft).success, true);
  const allIds = [...draft.story.scenes, ...draft.thinking.activities].map(item => item.id);
  assert.equal(new Set(allIds).size, 14);
  const restoredBook = {
    ...draft.metadata,
    pages: draft.story.scenes.map((scene: any) => ({
      image: draft.images.find((image: any) => image.sceneId === scene.id).extensions.sourceAssetPath,
      text: scene.text, hint: scene.parentHint,
    })),
    harvardPlay: draft.thinking.activities.map((item: any) => ({ title: item.title, desc: item.description })),
  };
  assert.deepEqual(restoredBook, book, 'Book JSON value round trip');
  assert.equal(draft.essay.body, body, 'Essay body including whitespace');
  assert.equal(draft.essay.extensions.sourceFrontmatter.bookId, draft.id);
  const root = path.resolve(directory, '../../..');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'src/content/books/ep03-hope.json'), 'utf8')), previewBook, 'Published book must preserve source values and mapped image paths');
  assert.equal(fs.readFileSync(path.join(root, 'src/content/essays/ep03-hope.mdx'), 'utf8'), publishedMdx, 'Published essay must preserve original sections 1 and 2');
  const missingImages = draft.images.filter((image: any) => !fs.existsSync(path.join(root, 'public', image.assetPath.slice(1)))).map((image: any) => image.assetPath);
  return { mappedImagePaths: draft.images.map((image: any) => image.assetPath), schema: 'passed', uniqueIds: allIds.length, scenes: 12, activities: 2,
    sourceRoundTrip: 'passed', bookEssayLink: 'passed', missingImages,
    publicationDiagnostics: inspectAstroDraft(draft) };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--import') {
    fs.writeFileSync(path.join(directory, 'master-draft.v1.json'), JSON.stringify(imported, null, 2) + '\n', { flag: 'wx' });
  }
  console.log(JSON.stringify(verify(), null, 2));
}
