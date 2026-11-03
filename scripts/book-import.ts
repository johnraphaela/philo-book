import { readFile, readdir, lstat, realpath, mkdir, mkdtemp, cp, symlink, writeFile, rm, rename } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { getLibraryCopy } from '../src/lib/library-copy.ts';
import { reviewCardMetadata } from './book-card-metadata.ts';

const sections = ['Metadata', 'Story', 'Parent Essay', 'Harvard Play', 'Illustration Guide', 'References'];
const fields: Record<string, string[]> = {
  Metadata: ['Book ID', 'Title', 'Theme', 'Age Groups', 'Categories', 'Summary'],
  'Parent Essay': ['Title', 'Tags', 'Body'],
  'Harvard Play': ['Parent Guide', 'Conversation', 'Activities'],
  'Illustration Guide': ['Character Bible', 'Common Art Style', 'Image Prompts'],
};
const sceneFields = ['Text', 'Parent Teaching Point', 'Parent Interaction', 'English'];
function label(line: string) {
  return line.trim().replace(/^#{1,6}\s+/, '').replace(/^\d+[.)]\s+/, '').replace(/\*\*/g, '').trim();
}
function matchLabel(line: string, names: string[]) {
  const clean = line.trimStart().replace(/^#{1,6}\s+/, '').replace(/^\d+[.)]\s+/, '');
  for (const name of names) {
    const pattern = new RegExp('^(?:\\*\\*)?' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+') + '(?:\\*\\*)?\\s*(?:[:：](?:\\*\\*)?\\s*(.*)|$)', 'i');
    const match = pattern.exec(clean);
    if (match) return { name, value: match[1] ?? '' };
  }
}
export function parseManuscript(source: string) {
  const result: Record<string, Record<string, string>> = {};
  const scenes: { number: number; fields: Record<string, string> }[] = [];
  let section = '', target: Record<string, string> | undefined, key = '';
  const lines = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n');
  const fail = (i: number, message: string): never => { throw new Error(`원고 ${i + 1}행: ${message}`); };
  for (const [i, line] of lines.entries()) {
    const heading = matchLabel(line, sections);
    if (heading) {
      if (result[heading.name]) fail(i, `${heading.name} 중복`);
      section = heading.name; result[section] = {}; target = result[section]; key = '';
      if (section === 'References') { key = 'Body'; target[key] = heading.value; }
      else if (heading.value) fail(i, '섹션 제목 뒤 내용의 필드가 불명확합니다.');
      continue;
    }
    const scene = /^Scene\s+(\d+)\s*[:：]?\s*$/i.exec(label(line));
    if (scene && section === 'Story') {
      const number = Number(scene[1]);
      if (scenes.some(s => s.number === number)) fail(i, `Scene ${number} 중복`);
      target = {}; scenes.push({ number, fields: target }); key = ''; continue;
    }
    const field = matchLabel(line, section === 'Story' ? sceneFields : (fields[section] ?? []));
    if (field && target) {
      if (section === 'Story' && !scenes.length) fail(i, 'Scene 번호가 먼저 필요합니다.');
      if (Object.hasOwn(target, field.name)) fail(i, `${field.name} 중복`);
      key = field.name; target[key] = field.value; continue;
    }
    if (target && key) target[key] += '\n' + line;
    else if (line.trim()) fail(i, '섹션 또는 필드 라벨 없이 내용이 있습니다.');
  }
  for (const name of sections) if (!result[name]) throw new Error(`원고: ${name} 누락`);
  const required = (obj: Record<string, string>, names: string[], at: string) => {
    for (const name of names) if (!obj[name]?.trim()) throw new Error(`원고 ${at} / ${name}: 필수 내용 누락`);
    for (const name of Object.keys(obj)) obj[name] = obj[name].replace(/^(?:[ \t]*\n)+|(?:\n[ \t]*)+$/g, '');
  };
  for (const [sectionName, names] of Object.entries(fields)) required(result[sectionName], names, sectionName);
  required(result.References, ['Body'], 'References');
  if (!scenes.length) throw new Error('원고 Story: Scene 누락');
  scenes.sort((a, b) => a.number - b.number);
  scenes.forEach((s, i) => {
    if (s.number !== i + 1) throw new Error(`원고 Story: Scene ${i + 1} 누락`);
    required(s.fields, sceneFields.slice(0, 3), `Scene ${s.number}`);
    if (s.fields.English !== undefined && !s.fields.English.trim()) throw new Error(`Scene ${s.number}: English 비어 있음`);
  });
  return { sections: result, scenes };
}
function list(value: string, at: string): string[] {
  const values = value.startsWith('[') ? JSON.parse(value) : value.split(/\n|,/).map(s => s.replace(/^\s*[-*]\s+/, '').trim()).filter(Boolean);
  if (!Array.isArray(values) || !values.length || values.some(v => typeof v !== 'string' || !v.trim())) throw new Error(`${at}: 목록 형식 오류`);
  return values;
}
const digest = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest('hex');
async function exists(file: string) { try { await lstat(file); return true; } catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return false; throw e; } }
export async function importBook(options: { root: string; input: string; slug?: string; update?: string; verify?: (stage: string) => Promise<void> }) {
  const root = await realpath(options.root), input = await realpath(path.resolve(root, options.input));
  if (input === path.join(root, 'public') || input.startsWith(path.join(root, 'public') + path.sep)) throw new Error('입력은 public 밖에 두세요.');
  const names = await readdir(input);
  const manuscripts = names.filter(n => /\.(md|txt)$/i.test(n));
  if (manuscripts.length !== 1) throw new Error(`원고 .md/.txt가 정확히 1개 필요합니다 (현재 ${manuscripts.length}개).`);
  for (const name of names) if (!(await lstat(path.join(input, name))).isFile()) throw new Error(`${name}: 일반 파일만 허용합니다 (심볼릭 링크/하위 폴더 불가).`);
  const raw = await readFile(path.join(input, manuscripts[0]));
  const source = new TextDecoder('utf-8', { fatal: true }).decode(raw);
  const parsed = parseManuscript(source), meta = parsed.sections.Metadata;
  const slug = options.slug ?? meta['Book ID'];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Book ID ${meta['Book ID']}: --slug 소문자-숫자-하이픈 옵션이 필요합니다. 원본 ID는 보존됩니다.`);
  if (options.update && options.update !== slug) throw new Error(`--update는 대상 책 ${slug}를 정확히 지정해야 합니다.`);
  const images = new Map<number, string>();
  const warnings = reviewCardMetadata(getLibraryCopy(slug, { theme: meta.Theme, summary: meta.Summary }));
  const dimensions: string[] = [];
  for (const name of names.filter(n => n !== manuscripts[0])) {
    const match = /^page(\d+)\.(png|jpe?g|webp)$/i.exec(name);
    if (!match) throw new Error(`${name}: page번호.png/jpg/jpeg/webp 형식만 허용합니다.`);
    const number = Number(match[1]);
    if (images.has(number)) throw new Error(`이미지 번호 ${number} 중복`);
    if (!parsed.scenes.some(s => s.number === number)) throw new Error(`${name}: 대응 Scene이 없습니다.`);
    const metadata = await sharp(await readFile(path.join(input, name)), { failOn: 'warning' }).metadata();
    const expected = /jpe?g/i.test(match[2]) ? 'jpeg' : match[2].toLowerCase();
    if (metadata.format !== expected) throw new Error(`${name}: 실제 형식 ${metadata.format}, 확장자 ${expected} 불일치`);
    dimensions.push(`${name}: ${metadata.width}×${metadata.height}, 비율 ${((metadata.width ?? 0) / (metadata.height ?? 1)).toFixed(4)}`);
    images.set(number, name);
  }
  for (const scene of parsed.scenes) if (!images.has(scene.number)) throw new Error(`Scene ${scene.number}: page${scene.number} 이미지 누락`);
  if (new Set(dimensions.map(d => d.split(': ')[1])).size > 1) warnings.push('이미지 해상도/비율 차이: ' + dimensions.join('; '));
  const asset = (n: number) => `/images/${slug}/${images.get(n)}`;
  const book = { sourceBookId: meta['Book ID'], title: meta.Title, theme: meta.Theme, summary: meta.Summary,
    categories: list(meta.Categories, 'Categories'), ageGroups: list(meta['Age Groups'], 'Age Groups'), cover: asset(1),
    pages: parsed.scenes.map(s => ({ image: asset(s.number), text: s.fields.Text, teachingPoint: s.fields['Parent Teaching Point'], interaction: s.fields['Parent Interaction'], ...(s.fields.English ? { english: s.fields.English } : {}) })),
    harvardPlay: fields['Harvard Play'].map(title => ({ title, desc: parsed.sections['Harvard Play'][title] })) };
  const essay = parsed.sections['Parent Essay'];
  const frontmatter = { title: essay.Title, bookId: slug, tags: list(essay.Tags, 'Tags') };
  const files = new Map<string, Buffer>();
  files.set(`src/content/books/${slug}.json`, Buffer.from(JSON.stringify(book, null, 2) + '\n'));
  // Plain Markdown avoids interpreting manuscript braces and HTML as MDX expressions.
  files.set(`src/content/essays/${slug}.md`, Buffer.from(`---\n${Object.entries(frontmatter).map(([k,v]) => `${k}: ${JSON.stringify(v)}`).join('\n')}\n---\n\n${essay.Body}\n`));
  files.set(`content-authoring/imports/${slug}/manuscript${path.extname(manuscripts[0]).toLowerCase()}`, raw);
  files.set(`content-authoring/imports/${slug}/parsed.json`, Buffer.from(JSON.stringify(parsed, null, 2) + '\n'));
  for (const name of images.values()) files.set(`public/images/${slug}/${name}`, await readFile(path.join(input, name)));
  const ownership = `content-authoring/imports/${slug}/files.json`;
  const prior: Record<string, string> = await exists(path.join(root, ownership)) ? JSON.parse(await readFile(path.join(root, ownership), 'utf8')) : {};
  const owned = Object.keys(prior);
  const allowedPrefix = [`public/images/${slug}/`, `content-authoring/imports/${slug}/`];
  if (owned.some(f => f.includes('..') || !(allowedPrefix.some(p => f.startsWith(p)) || f === `src/content/books/${slug}.json` || f === `src/content/essays/${slug}.md`))) throw new Error('등록 기록의 경로가 올바르지 않습니다.');
  for (const name of await readdir(path.join(root, 'src/content/books'))) {
    if (!name.endsWith('.json')) continue;
    const existing = JSON.parse(await readFile(path.join(root, 'src/content/books', name), 'utf8'));
    if (existing.sourceBookId === meta['Book ID'] && name !== `${slug}.json`) throw new Error(`Book ID 충돌: ${name}`);
  }
  if (!owned.length) {
    for (const candidate of [`src/content/books/${slug}.json`, `src/content/essays/${slug}.md`, `src/content/essays/${slug}.mdx`, `public/images/${slug}`, `content-authoring/imports/${slug}`])
      if (await exists(path.join(root, candidate))) throw new Error(`기존 경로 충돌: ${candidate}. 다른 --slug를 지정하세요.`);
  }
  for (const f of files.keys()) if (!owned.includes(f) && await exists(path.join(root, f))) throw new Error(`소유하지 않은 파일 충돌: ${f}`);
  const changed: string[] = [];
  for (const [f, bytes] of files) if (!await exists(path.join(root, f)) || !bytes.equals(await readFile(path.join(root, f)))) changed.push(f);
  const removed = owned.filter(f => !files.has(f));
  for (const f of removed) if (await exists(path.join(root, f)) && digest(await readFile(path.join(root, f))) !== prior[f]) throw new Error(`제거할 기존 파일이 외부에서 변경되었습니다: ${f}`);
  if (owned.length && (changed.length || removed.length) && options.update !== slug) throw new Error(`기존 책 변경: --update ${slug} 필요`);
  files.set(ownership, Buffer.from(JSON.stringify(Object.fromEntries([...files].map(([f,b]) => [f,digest(b)])), null, 2) + '\n'));
  if (!await exists(path.join(root, ownership)) || !files.get(ownership)!.equals(await readFile(path.join(root, ownership)))) changed.push(ownership);
  const baseline = new Map<string, Buffer | undefined>();
  for (const f of new Set([...files.keys(), ...removed])) baseline.set(f, await exists(path.join(root, f)) ? await readFile(path.join(root, f)) : undefined);
  const temp = await mkdtemp(path.join(os.tmpdir(), 'philo-import-'));
  const stage = path.join(temp, 'project');
  try {
    await mkdir(stage);
    for (const entry of ['src', 'public', 'scripts', 'content-authoring', '.agents', 'tests', 'astro.config.mjs', 'tsconfig.json', 'package.json', 'package-lock.json']) {
      if (!await exists(path.join(root, entry))) continue;
      await cp(path.join(root, entry), path.join(stage, entry), { recursive: true, filter: async src => {
        if ((await lstat(src)).isSymbolicLink()) throw new Error(`복제할 경로에 심볼릭 링크가 있습니다: ${src}`);
        return !path.basename(src).startsWith('.env');
      } });
    }
    await mkdir(path.join(stage, 'node_modules'));
    for (const name of (await readdir(path.join(root, 'node_modules'))).filter(n => !n.startsWith('.'))) {
      await symlink(path.join(root, 'node_modules', name), path.join(stage, 'node_modules', name), process.platform === 'win32' ? 'junction' : 'dir');
    }
    for (const f of removed) await rm(path.join(stage, f), { force: true });
    for (const [f, bytes] of files) { await mkdir(path.dirname(path.join(stage, f)), { recursive: true }); await writeFile(path.join(stage, f), bytes); }
    if (options.verify) await options.verify(stage);
    else for (const command of ['content:check', 'check', 'build']) {
      const args = command === 'content:check'
        ? ['--experimental-strip-types', path.join(stage, 'scripts/check-publication.ts')]
        : [path.join(stage, 'node_modules/astro/bin/astro.mjs'), command, '--root', stage];
      await new Promise<void>((resolve, reject) => {
        const child = spawn(process.execPath, args, { cwd: stage, env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
        let output = '';
        const append = (chunk: Buffer) => { if (output.length < 4_000_000) output += chunk.toString(); };
        child.stdout.on('data', append); child.stderr.on('data', append);
        const timer = setTimeout(() => { child.kill('SIGKILL'); }, 120_000);
        child.on('error', error => { clearTimeout(timer); reject(new Error(`${command} 실행 실패: ${error.message}`)); });
        child.on('close', (code, signal) => { clearTimeout(timer); if (code === 0) resolve(); else reject(new Error(`${command} 실패 (exit=${code}, signal=${signal})\n${output}`)); });
      });
    }
    if (!options.verify && !(await readFile(path.join(stage, 'dist/book', slug, 'index.html'), 'utf8')).trim()) throw new Error(`빌드된 도서 경로가 비어 있습니다: ${slug}`);
    // Keep a rollback copy for every target; never touch existing files before all checks pass.
    const targets = [...new Set([...files.keys(), ...removed])];
    const backups = baseline;
    for (const f of targets) {
      const current = await exists(path.join(root, f)) ? await readFile(path.join(root, f)) : undefined;
      const initial = baseline.get(f);
      if (current ? !initial?.equals(current) : initial !== undefined) throw new Error(`검사 중 대상 파일이 변경되었습니다: ${f}`);
    }
    try {
      for (const f of targets) {
        const dest = path.join(root, f), bytes = files.get(f);
        if (bytes && backups.get(f)?.equals(bytes)) continue;
        if (!bytes) { await rm(dest, { force: true }); continue; }
        await mkdir(path.dirname(dest), { recursive: true });
        await writeFile(dest + '.import-tmp', bytes); await rename(dest + '.import-tmp', dest);
      }
    } catch (error) {
      for (const [f, bytes] of backups) { if (bytes) await writeFile(path.join(root, f), bytes); else await rm(path.join(root, f), { force: true }); await rm(path.join(root, f) + '.import-tmp', { force: true }); }
      throw error;
    }
    return { title: meta.Title, id: meta['Book ID'], slug, scenes: parsed.scenes.length, changed, removed, warnings };
  } finally { await rm(temp, { recursive: true, force: true }); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args: Record<string, string> = {};
    for (let i = 2; i < process.argv.length; i += 2) {
      const flag = process.argv[i], value = process.argv[i + 1];
      if (!['--input', '--slug', '--update'].includes(flag) || !value || value.startsWith('--') || args[flag]) throw new Error('사용법: npm run book:import -- --input 폴더 [--slug 경로] [--update 대상slug]');
      args[flag] = value;
    }
    if (!args['--input']) throw new Error('--input 폴더가 필요합니다.');
    const r = await importBook({ root: process.cwd(), input: args['--input'], slug: args['--slug'], update: args['--update'] });
    console.log(`${r.title} / ${r.id}${r.slug !== r.id ? ` (URL: ${r.slug})` : ''}\n장면·Teaching Point·Interaction·이미지: 각 ${r.scenes}개\n콘텐츠 검사·프로젝트 검사·빌드: 성공\n${r.changed.length || r.removed.length ? `생성/변경 ${r.changed.length}개, 제거 ${r.removed.length}개\n${[...r.changed,...r.removed].join('\n')}` : '변경 없음'}`);
    for (const warning of r.warnings) console.warn(`경고: ${warning}`);
  } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
}
