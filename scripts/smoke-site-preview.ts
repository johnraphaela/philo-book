/** Full-process integration check, separate from unit tests that may run without subprocess privileges. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { createSitePreview } from '../content-authoring/site-preview.ts';

const id = `ci-isolated-preview-${randomUUID()}`;
const source = JSON.stringify({
  schemaVersion: 1, id, status: 'ready',
  metadata: { title: 'CI preview smoke', theme: 'Synthetic test only', categories: [], ageGroups: [] },
  story: { scenes: [{ id: 'opening', text: 'Synthetic story fixture.' }] },
  images: [{ sceneId: 'opening', assetPath: '/images/ep01/page1.jpg' }],
  essay: { title: 'CI essay', tags: [], body: '\n## CI heading\n\n**Fixture emphasis**\n\n- One\n- Two\n' },
});
const result = await createSitePreview(process.cwd(), [{ source }]);
try {
  if (!result.ok) {
    console.error(JSON.stringify(result, null, 2));
    for (const check of result.checks) console.error(await readFile(check.log, 'utf8'));
  }
  assert.ok(result.ok, 'Isolated Astro check/build must pass');
  const html = await readFile(path.join(result.dist!, 'book', id, 'index.html'), 'utf8');
  assert.ok(html.includes('CI preview smoke'));
  assert.ok(html.includes('Synthetic story fixture.'));
  assert.ok(html.includes('<strong>Fixture emphasis</strong>'));
  assert.ok(html.includes('<li>One</li>'));
  console.log('PASS: isolated Astro check/build, candidate story/essay rendering, and original-byte verification.');
} finally {
  if (result.stageRoot) await rm(result.stageRoot, { recursive: true, force: true });
}
