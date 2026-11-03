import fs from 'node:fs';
import path from 'node:path';

/** Windows directory junctions do not require file-symlink creation privileges. */
export function directoryLink(target: string, link: string): void {
  try { fs.symlinkSync(path.resolve(target), link, process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (error) {
    throw new Error('경로 보안 검사를 실행하려면 디렉터리 링크가 필요합니다. Windows는 junction을 지원하는 로컬 파일시스템을 사용하세요. 테스트는 건너뛰지 않습니다.', { cause: error });
  }
}
/** Keep the security assertion running via a real junction if Windows denies a file symlink. */
export function fileLinkWithFallback(target: string, link: string, junctionFallback: () => string,
  platform: NodeJS.Platform = process.platform, createFileLink = fs.symlinkSync): string {
  try { createFileLink(target, link, 'file'); return link; }
  catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (platform === 'win32' && (code === 'EPERM' || code === 'EACCES')) return junctionFallback();
    throw error;
  }
}

/** Test-only privilege denial used to exercise the real junction fallback on every OS. */
export function deniedFileLink(): never { throw Object.assign(new Error('Simulated Windows file-link privilege denial'), { code: 'EPERM' }); }
