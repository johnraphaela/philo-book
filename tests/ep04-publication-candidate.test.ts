import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { validateMasterDraft } from '../content-authoring/schema.ts';

const base = new URL('../content-authoring/handoffs/ep04/pico-silver-feather/', import.meta.url);
const bytes = (file: string) => fs.readFileSync(new URL(file, base));
const json = (file: string) => JSON.parse(bytes(file).toString('utf8'));
const sha = (value: Buffer) => createHash('sha256').update(value).digest('hex');

test('EP04 publication candidate contains exactly the approved editorial replacements', () => {
  const proposal = json('publication-review/proposed-edits.json');
  const approval = json('publication-approval.json');
  const expected = json('master-draft.json');
  assert.equal(sha(bytes('master-draft.json')), proposal.baseline.sha256);
  assert.deepEqual(approval.approvedChangeIds, proposal.changes.map((change: { id: string }) => change.id));
  for (const edit of proposal.changes) {
    const parts = edit.pointer.slice(1).split('/');
    const key = parts.pop();
    let owner = expected;
    for (const part of parts) owner = owner[part];
    assert.equal(owner[key].split(edit.before).length - 1, 1, `Original text must be unique: ${edit.id}`);
    owner[key] = owner[key].replace(edit.before, edit.after);
  }
  const candidate = json('publication-candidate.json');
  assert.deepEqual(candidate, expected, 'Unapproved manuscript fields must not change.');
  assert.ok(validateMasterDraft(candidate).success);
  assert.equal(sha(bytes('publication-candidate.json')), approval.candidateSHA256);
});

test('EP04 candidate preserves the supplied draft and keeps publication approval separate', () => {
  const original = bytes('master-draft.json');
  assert.ok(original.equals(bytes('source/Master Draft.md')));
  const approval = json('publication-approval.json');
  assert.equal(sha(original), approval.baselineSHA256);
  assert.equal(json('publication-candidate.json').status, 'draft');
  assert.equal(approval.approvedForPublication, false);
  assert.equal(approval.readyStatusChangeApproved, false);
});
