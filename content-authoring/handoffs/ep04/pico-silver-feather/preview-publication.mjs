/** Preview the specifically approved EP04 candidate; publication remains a separate decision. */
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { previewEP04 } from './preview-local.mjs';

async function main() {
  if (process.argv.length !== 2) throw new Error('Usage: node --experimental-strip-types preview-publication.mjs');
  const approval = JSON.parse(await fs.readFile(new URL('./publication-approval.json', import.meta.url), 'utf8'));
  const baseline = await fs.readFile(new URL('./master-draft.json', import.meta.url));
  assert.equal(createHash('sha256').update(baseline).digest('hex'), approval.baselineSHA256);
  assert.equal(approval.bookId, 'pico-silver-feather');
  await previewEP04({ sourceFile: 'publication-candidate.json',
    expectedSourceHash: approval.candidateSHA256, publicationOptions: approval.publicationOptions });
}
main().catch(error => { console.error(error); process.exitCode = 1; });
