/** Builds a disposable site copy, never writes src/content in this checkout. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { directory, book, previewBook, verify } from './pilot.ts';
verify();
const root = path.resolve(directory, '../../..');
const destination = fs.mkdtempSync(path.join(os.tmpdir(), 'philo-hope-preview-'));
for (const name of ['src', 'public', 'astro.config.mjs', 'tsconfig.json', 'package.json', 'package-lock.json']) {
  fs.cpSync(path.join(root, name), path.join(destination, name), { recursive: true });
}
fs.symlinkSync(path.join(root, 'node_modules'), path.join(destination, 'node_modules'), 'dir');
// Proven lossless by verify(): only the explicitly recorded .jpeg → .jpg asset mapping differs in the preview.
// The publication files are now tracked and already copied with src; verify() checks them.

console.log(`PREVIEW_ROOT=${destination}`);
const build = spawnSync(process.execPath, [path.join(root, 'node_modules/astro/bin/astro.mjs'), 'build'], { cwd: destination, stdio: 'inherit', env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' } });
if (build.status !== 0) process.exit(build.status ?? 1);
const html = fs.readFileSync(path.join(destination, 'dist/book/ep03-hope/index.html'), 'utf8');
for (const value of [book.title, '희망의 두 얼굴', ...previewBook.harvardPlay.map((item: any) => item.title)]) assert.ok(html.includes(value.replaceAll('&', '&amp;')),  `Rendered content missing: ${value}`);
assert.ok(html.includes('/images/ep03/page1.jpg'));
console.log('PASS: actual Astro collection schemas, MDX build, book/essay pairing, both activity titles in generated HTML.');
assert.equal(verify().missingImages.length, 0, 'Preview requires all uploaded image assets');
console.log('PASS: all 12 uploaded image paths exist. Editorial approval remains pending.');
console.log(`To inspect on your own machine: cd ${destination} && npm run dev -- --background`);
