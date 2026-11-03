/** Repair only Git checkout EOL drift, never manuscript edits or archived hashes. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const pilotCheckoutFiles = [
  'content-authoring/pilots/ep03-hope/source/ep03-hope.json',
  'content-authoring/pilots/ep03-hope/source/ep03-hope.mdx.txt',
  'src/content/essays/ep03-hope.mdx',
] as const;
export type ReadGitFile = (relative: string) => Buffer;

export function restorePilotCheckout(rootPath: string, readGitFile?: ReadGitFile): { restored: string[]; unchanged: string[] } {
  const root = fs.realpathSync(rootPath);
  const readHead = readGitFile ?? ((relative: string) => execFileSync('git', ['-C', root, 'show', `HEAD:${relative}`], { encoding: 'buffer', maxBuffer: 2_000_000 }));
  // Validate every file before writing any of them. Read raw Git bytes, bypassing checkout filters.
  const files = pilotCheckoutFiles.map(relative => {
    const file = path.join(root, relative);
    if (!fs.lstatSync(file).isFile() || fs.realpathSync(file) !== file) throw new Error(`일반 파일 경로가 아닙니다: ${relative}`);
    const expected = readHead(relative);
    const current = fs.readFileSync(file);
    const same = current.equals(expected);
    if (!same) {
      const decoded = current.toString('utf8');
      const normalized = Buffer.from(decoded.replace(/\r\n/g, '\n'), 'utf8');
      if (!Buffer.from(decoded, 'utf8').equals(current) || !normalized.equals(expected)) throw new Error(`줄바꿈 외의 변경이 있어 복원하지 않습니다: ${relative}. 원고 변경을 먼저 별도로 검토하세요.`);
    }
    return { relative, file, expected, current, same };
  });
  const result = { restored: [] as string[], unchanged: [] as string[] };
  const temporary: string[] = [];
  try {
    // Prepare full files beside their targets; failed writes leave original files intact.
    const pending = files.filter(f => !f.same).map(file => {
      const temporaryFile = `${file.file}.${randomUUID()}.checkout-repair.tmp`;
      fs.writeFileSync(temporaryFile, file.expected, { flag: 'wx' });
      temporary.push(temporaryFile);
      return { ...file, temporaryFile };
    });
    for (const file of files) if (!fs.readFileSync(file.file).equals(file.current)) throw new Error(`검사 도중 파일이 변경돼 중단합니다: ${file.relative}`);
    for (const file of pending) {
      fs.renameSync(file.temporaryFile, file.file);
      if (!fs.readFileSync(file.file).equals(file.expected)) throw new Error(`복원 바이트 대조 실패: ${file.relative}`);
      result.restored.push(file.relative);
    }
    result.unchanged = files.filter(f => f.same).map(f => f.relative);
    return result;
  } finally {
    for (const file of temporary) fs.rmSync(file, { force: true });
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 2) throw new Error('사용법: npm run pilot:restore-checkout (저장소 루트에서 실행)');
    console.log(JSON.stringify(restorePilotCheckout(process.cwd()), null, 2));
  } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
}
