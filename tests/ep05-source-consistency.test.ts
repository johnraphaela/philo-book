import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parse } from 'yaml';
import { parseManuscript } from '../scripts/book-import.ts';

// EP05's approved source correction must stay synchronized with its import record.
const imports = ['ep05'];
for (const slug of imports) {
  const directory = `content-authoring/imports/${slug}`;
  test(`registered ${slug}: source, parsed data, published text and ownership hashes agree`, () => {
    const manifest: Record<string, string> = JSON.parse(fs.readFileSync(`${directory}/files.json`, 'utf8'));
    for (const [file, hash] of Object.entries(manifest)) {
      assert(!path.isAbsolute(file) && !file.split('/').includes('..'));
      assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'), hash, file);
    }
    const manuscript = Object.keys(manifest).find(file => file.startsWith(directory + '/') && /\/manuscript\.(md|txt)$/.test(file));
    assert(manuscript);
    const raw = fs.readFileSync(manuscript, 'utf8');
    assert.equal(fs.readFileSync('book-imports/ep05/ep05.md', 'utf8'), raw);
    const parsed = parseManuscript(raw);
    assert.deepEqual(JSON.parse(fs.readFileSync(`${directory}/parsed.json`, 'utf8')), parsed);
    const book = JSON.parse(fs.readFileSync(`src/content/books/${slug}.json`, 'utf8'));
    assert.equal(book.pages.length, parsed.scenes.length);
    for (const [i, scene] of parsed.scenes.entries()) {
      assert.equal(book.pages[i].text, scene.fields.Text);
      assert.equal(book.pages[i].teachingPoint, scene.fields['Parent Teaching Point']);
      assert.equal(book.pages[i].interaction, scene.fields['Parent Interaction']);
    }
    const essay = fs.readFileSync(`src/content/essays/${slug}.md`, 'utf8');
    const match = /^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/.exec(essay);
    assert(match);
    assert.equal(parse(match[1]).title, parsed.sections['Parent Essay'].Title);
    assert.equal(match[2], parsed.sections['Parent Essay'].Body + '\n');
  });
}
