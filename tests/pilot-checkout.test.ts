import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { restorePilotCheckout, pilotCheckoutFiles } from '../content-authoring/pilots/ep03-hope/restore-checkout.ts';

function fixture(t: import('node:test').TestContext) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pilot-checkout-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const expected = new Map<string, Buffer>();
  for (const relative of pilotCheckoutFiles) {
    const canonical = Buffer.from(`보관 원문 😀\n${relative}\n\n`, 'utf8');
    expected.set(relative, canonical);
    fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
    fs.writeFileSync(path.join(root, relative), canonical.toString().replace(/\n/g, '\r\n'));
  }
  return { root, expected, readHead: (relative: string) => expected.get(relative)! };
}
test('repairs only CRLF drift with exact Git bytes and is idempotent', t => {
  const f = fixture(t);
  assert.deepEqual(restorePilotCheckout(f.root, f.readHead).restored, [...pilotCheckoutFiles]);
  for (const file of pilotCheckoutFiles) assert.deepEqual(fs.readFileSync(path.join(f.root, file)), f.expected.get(file));
  assert.deepEqual(restorePilotCheckout(f.root, f.readHead), { restored: [], unchanged: [...pilotCheckoutFiles] });
});
test('any manuscript edit aborts before touching any of the three files', t => {
  const f = fixture(t);
  fs.appendFileSync(path.join(f.root, pilotCheckoutFiles[2]), '작성자가 추가한 문장');
  const before = pilotCheckoutFiles.map(file => fs.readFileSync(path.join(f.root, file)));
  assert.throws(() => restorePilotCheckout(f.root, f.readHead), /줄바꿈 외의 변경/);
  assert.deepEqual(pilotCheckoutFiles.map(file => fs.readFileSync(path.join(f.root, file))), before);
});
test('missing Git data or a changed file stops before repair, leaving current bytes intact', t => {
  const f = fixture(t);
  const before = fs.readFileSync(path.join(f.root, pilotCheckoutFiles[0]));
  assert.throws(() => restorePilotCheckout(f.root, () => { throw new Error('Git unavailable'); }), /Git unavailable/);
  assert.deepEqual(fs.readFileSync(path.join(f.root, pilotCheckoutFiles[0])), before);
  let last: string | undefined;
  assert.throws(() => restorePilotCheckout(f.root, relative => {
    if (last) fs.appendFileSync(path.join(f.root, last), '동시 변경');
    last = relative;
    return f.readHead(relative);
  }), /검사 도중/);
  assert.ok(fs.readFileSync(path.join(f.root, pilotCheckoutFiles[0]), 'utf8').endsWith('동시 변경'));
});
