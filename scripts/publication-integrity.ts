import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { parseDocument } from 'yaml';
import { inspectAstroDraft, type Diagnostic } from '../content-authoring/adapter.ts';
import { validateMasterDraft } from '../content-authoring/schema.ts';

const issue = (code: string, at: string, message: string): Diagnostic => ({ severity: 'error', code, path: at, message });
/** Read-only, local public assets. Decode pixels rather than accepting a plausible header. */
export async function inspectImage(publicRoot: string, asset: string, at = asset): Promise<Diagnostic[]> {
  if (!/^\/images\//.test(asset) || /[\\%?#\x00-\x20]/.test(asset) || asset.slice(1).split('/').some(p => !p || p === '.' || p === '..'))
    return [issue('invalid-image-path', at, '정규 /images/ 상대 경로만 허용합니다.')];
  try {
    const root = await realpath(publicRoot);
    const file = await realpath(path.join(root, asset.slice(1)));
    if (!file.startsWith(root + path.sep) || !(await stat(file)).isFile())
      return [issue('invalid-image-path', at, 'public 밖 경로 또는 일반 파일이 아닙니다.')];
    const bytes = await readFile(file);
    const image = sharp(bytes, { failOn: 'warning', animated: true });
    const metadata = await image.metadata();
    await image.raw().toBuffer();
    const formats: Record<string, string> = { '.jpg': 'jpeg', '.jpeg': 'jpeg', '.png': 'png', '.webp': 'webp', '.gif': 'gif', '.avif': 'heif' };
    const expected = formats[path.extname(asset).toLowerCase()];
    if (!expected) return [issue('unsupported-image-extension', at, '지원 확장자: jpg/jpeg/png/webp/gif/avif')];
    if (metadata.format !== expected) return [issue('image-format-mismatch', at, `${asset}: 확장자는 ${expected}, 실제 내용은 ${metadata.format}`)];
    return [];
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return [issue(code === 'ENOENT' ? 'missing-image-file' : 'invalid-image-file', at, `${asset}: ${error instanceof Error ? error.message : String(error)}`)];
  }
}

/** Explicit publication check only: ordinary draft/schema validation stays permissive. */
export async function inspectDraftPublication(input: unknown, publicRoot: string): Promise<Diagnostic[]> {
  const diagnostics = inspectAstroDraft(input).filter(d => d.code !== 'asset-unverified');
  const result = validateMasterDraft(input);
  if (result.success) for (const [i, image] of (result.data.images ?? []).entries()) {
    if (image.assetPath) diagnostics.push(...await inspectImage(publicRoot, image.assetPath, `images.${i}.assetPath`));
  }
  return diagnostics;
}

/** Only production collection files, never authoring examples or fixtures. */
export async function inspectPublishedContent(root: string): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];
  const books = new Set<string>();
  const essays = new Set<string>();
  const checkedImages = new Map<string, Diagnostic[]>();
  const checkImage = async (asset: string, at: string) => {
    if (!checkedImages.has(asset)) checkedImages.set(asset, await inspectImage(path.join(root, 'public'), asset));
    return checkedImages.get(asset)!.map(d => ({ ...d, path: at }));
  };
  for (const name of (await readdir(path.join(root, 'src/content/books'))).filter(n => n.endsWith('.json')).sort()) {
    const at = `src/content/books/${name}`;
    const id = name.slice(0, -5);
    books.add(id);
    try {
      const book = JSON.parse(await readFile(path.join(root, at), 'utf8'));
      if (!Array.isArray(book.pages) || !book.pages.length) diagnostics.push(issue('empty-book', at, '장면이 없습니다.'));
      for (const [i, page] of (Array.isArray(book.pages) ? book.pages : []).entries()) {
        if (typeof page?.text !== 'string' || !page.text.trim()) diagnostics.push(issue('empty-page', `${at}.pages.${i}.text`, '장면 본문이 비어 있습니다.'));
        diagnostics.push(...await checkImage(typeof page?.image === 'string' ? page.image : '', `${at}.pages.${i}.image`));
      }
      // A missing optional cover retains today's icon fallback. Explicit covers must work.
      if (book.cover !== undefined) diagnostics.push(...await checkImage(typeof book.cover === 'string' ? book.cover : '', `${at}.cover`));
    } catch (error) { diagnostics.push(issue('invalid-book', at, String(error))); }
  }
  for (const name of (await readdir(path.join(root, 'src/content/essays'))).filter(n => /\.mdx?$/.test(n)).sort()) {
    const at = `src/content/essays/${name}`;
    try {
      const source = await readFile(path.join(root, at), 'utf8');
      const match = /^(?:\uFEFF)?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(source);
      if (!match) throw new Error('YAML frontmatter가 없습니다.');
      const doc = parseDocument(match[1]);
      if (doc.errors.length) throw new Error(doc.errors.map(e => e.message).join('; '));
      const data = doc.toJS();
      if (typeof data?.bookId !== 'string' || !books.has(data.bookId)) diagnostics.push(issue('unknown-book', at, 'bookId가 출판 책을 참조하지 않습니다.'));
      else if (essays.has(data.bookId)) diagnostics.push(issue('duplicate-essay', at, `책 ${data.bookId}에 에세이가 중복됩니다.`));
      else essays.add(data.bookId);
      if (!match[2].trim()) diagnostics.push(issue('empty-essay', at, '에세이 본문이 비어 있습니다.'));
    } catch (error) { diagnostics.push(issue('invalid-essay', at, String(error))); }
  }
  return diagnostics;
}
