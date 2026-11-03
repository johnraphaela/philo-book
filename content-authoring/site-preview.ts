import { mkdtemp, mkdir, readFile, readdir, lstat, realpath, writeFile, symlink } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { planPublication, sha256, type PlanInput } from './publication-plan.ts';
import { error } from './astro-adapter.ts';
import type { Diagnostic } from './adapter.ts';
import { inspectPublishedContent } from '../scripts/publication-integrity.ts';

const entries = ['src', 'public', 'content-authoring', 'scripts', 'astro.config.mjs', 'tsconfig.json', 'package.json', 'package-lock.json'];
type Snapshot = Map<string, Buffer>;
export interface PreviewCheck { command: 'check' | 'build'; exitCode: number; log: string }
export type PreviewRunner = (root: string, command: PreviewCheck['command'], log: string) => Promise<number>;
export interface SitePreviewResult {
  ok: boolean; isolated: true; stageRoot?: string; dist?: string; routes?: string[];
  checks: PreviewCheck[]; diagnostics: Diagnostic[];
  sourceHashes?: Record<string, string>;
  preview?: { cwd: string; executable: string; args: string[] };
}

async function snapshot(root: string): Promise<Snapshot> {
  const result: Snapshot = new Map();
  const visit = async (relative: string) => {
    const file = path.join(root, relative);
    const info = await lstat(file);
    if (info.isSymbolicLink()) throw new Error(`사이트 복사에 symlink를 허용하지 않습니다: ${relative}`);
    if (info.isDirectory()) {
      for (const name of (await readdir(file)).sort()) {
        if (name.startsWith('.env') || ['.git', 'node_modules', 'dist', '.astro'].includes(name)) continue;
        await visit(path.join(relative, name));
      }
    } else if (info.isFile()) result.set(relative, await readFile(file));
    else throw new Error(`일반 파일이 아닙니다: ${relative}`);
  };
  for (const name of entries) await visit(name);
  return result;
}
function sameSnapshot(a: Snapshot, b: Snapshot): boolean {
  return a.size === b.size && [...a].every(([name, bytes]) => b.get(name)?.equals(bytes));
}

/** Runs the installed Astro CLI, without npm lifecycle/install/deployment commands. Trusted site code executes. */
export const runAstro: PreviewRunner = async (root, command, log) => {
  const child = spawn(process.execPath, [path.join(root, 'node_modules/astro/bin/astro.mjs'), command, '--config', 'preview.astro.config.mjs'], {
    cwd: root, env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  let timedOut = false;
  const append = (chunk: Buffer) => { if (output.length < 2_000_000) output += chunk.toString(); };
  child.stdout.on('data', append); child.stderr.on('data', append);
  const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, 120_000);
  let launchError: string | undefined;
  child.on('error', e => { launchError = String(e); });
  const code = await new Promise<number>(resolve => child.on('close', status => resolve(status ?? 1)));
  clearTimeout(timer);
  await writeFile(log, output + (launchError ? `\n${launchError}` : '') + (timedOut ? '\nPreview command timed out.' : ''));
  return launchError || timedOut ? 1 : code;
};

/** Creates and builds only a fresh OS temporary directory. Never accepts an output destination or saved plan. */
export async function createSitePreview(rootPath: string, input: PlanInput[], runner: PreviewRunner = runAstro): Promise<SitePreviewResult> {
  const result: SitePreviewResult = { ok: false, isolated: true, checks: [], diagnostics: [] };
  // Detach caller-owned inputs before the first await, including explicit options.
  let originalRoot: string | undefined;
  let initial: Snapshot | undefined;
  try {
    const inputs = structuredClone(input);
    const root = await realpath(rootPath);
    originalRoot = root;
    initial = await snapshot(root);
    const planned = await planPublication(root, inputs);
    result.diagnostics.push(...planned.diagnostics);
    if (!planned.ok) return result;
    const stage = await mkdtemp(path.join(os.tmpdir(), 'philo-site-preview-'));
    result.stageRoot = stage;
    for (const dir of ['src/content/books', 'src/content/essays', 'public', 'content-authoring', 'scripts']) await mkdir(path.join(stage, dir), { recursive: true });
    for (const [name, bytes] of initial) {
      const dest = path.join(stage, name);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, bytes, { flag: 'wx' });
    }
    // Check the immutable copy too; this catches assets/content changed during initial planning.
    const copied = await planPublication(stage, inputs);
    if (!copied.ok || JSON.stringify(copied.files) !== JSON.stringify(planned.files)) {
      result.diagnostics.push(error('snapshot-conflict', stage, '복사한 사이트와 최초 출판 계획이 다릅니다.'), ...copied.diagnostics);
      return result;
    }
    const dependencies = await realpath(path.join(root, 'node_modules'));
    await mkdir(path.join(stage, 'node_modules'));
    // Separate directory, package-level links: .astro/.vite caches remain inside the temporary site.
    for (const name of (await readdir(dependencies)).filter(n => !n.startsWith('.'))) {
      await symlink(path.join(dependencies, name), path.join(stage, 'node_modules', name));
    }
    for (const file of copied.files) {
      const dest = path.join(stage, file.relativePath);
      if (file.action === 'add') await writeFile(dest, file.content, { flag: 'wx' });
      else if (sha256(await readFile(dest)) !== file.sha256) throw new Error(`noop 해시 불일치: ${file.relativePath}`);
    }
    result.diagnostics.push(...await inspectPublishedContent(stage));
    if (result.diagnostics.some(d => d.severity === 'error')) return result;
    // Keep standard Astro source/output/cache paths inside the copy even if the base config sets them.
    await writeFile(path.join(stage, 'preview.astro.config.mjs'), `import base from './astro.config.mjs';
if (!base || typeof base !== 'object') throw new Error('Preview requires an object Astro config.');
export default { ...base, root: '.', srcDir: './src/',
  publicDir: './public/', outDir: './dist/',
  cacheDir: './.preview-cache/' };
`, { flag: 'wx' });
    await mkdir(path.join(stage, 'preview-logs'));
    for (const command of ['check', 'build'] as const) {
      const log = path.join(stage, 'preview-logs', `${command}.log`);
      const exitCode = await runner(stage, command, log);
      result.checks.push({ command, exitCode, log });
      if (exitCode !== 0) {
        result.diagnostics.push(error('preview-command-failed', command, `임시 사이트 ${command} 실패. 로그: ${log}`));
        return result;
      }
    }
    for (const source of copied.sources) {
      const file = path.join(stage, 'dist/book', source.id, 'index.html');
      if (!(await readFile(file, 'utf8')).trim()) throw new Error(`후보 페이지가 비어 있습니다: ${source.id}`);
    }
    result.sourceHashes = Object.fromEntries([...initial].map(([name, bytes]) => [name, sha256(bytes)]));
    result.dist = path.join(stage, 'dist');
    result.routes = copied.sources.map(source => `/book/${source.id}/`);
    result.preview = { cwd: stage, executable: process.execPath,
      args: [path.join(stage, 'node_modules/astro/bin/astro.mjs'), 'preview', '--config', 'preview.astro.config.mjs', '--host', '127.0.0.1'] };
    result.ok = true;
  } catch (e) { result.diagnostics.push(error('site-preview-failed', rootPath, String(e))); result.ok = false; }
  finally {
    try {
      if (originalRoot && initial && !sameSnapshot(initial, await snapshot(originalRoot))) {
        result.ok = false;
        result.diagnostics.push(error('source-changed', originalRoot, '검사 도중 원본 사이트 파일이 변경됐습니다. 새 미리보기를 생성하세요.'));
      }
      if (result.stageRoot) await writeFile(path.join(result.stageRoot, 'preview-report.json'), JSON.stringify(result, null, 2) + '\n');
    } catch (e) { result.ok = false; result.diagnostics.push(error('preview-report-failed', rootPath, String(e))); }
  }
  return result;
}
