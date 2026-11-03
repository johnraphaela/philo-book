import fs from 'node:fs';
import path from 'node:path';
import type { TestContext } from 'node:test';

/** Windows directory junctions do not require file-symlink creation privileges. */
export function directoryLink(target: string, link: string): void {
  fs.symlinkSync(path.resolve(target), link, process.platform === 'win32' ? 'junction' : 'dir');
}
/** Only this extra file-link case may skip; directory escape checks always run. */
export function fileLink(t: TestContext, target: string, link: string): boolean {
  try { fs.symlinkSync(target, link, 'file'); return true; }
  catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (process.platform === 'win32' && (code === 'EPERM' || code === 'EACCES')) {
      t.skip('Windows 파일 symlink 생성 권한 없음. 별도 junction 경로 이탈 검사는 계속 실행합니다.');
      return false;
    }
    throw error;
  }
}
