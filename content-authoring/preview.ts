import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { planPublication } from './publication-plan.ts';

/** CLI entry also exposed for environments that prohibit subprocess-based tests. */
export async function previewCommand(argv: string[], root = process.cwd(), output = console.log, reportError = console.error): Promise<number> {
  const args = [...argv];
  try {
    const index = args.indexOf('--options');
    let options: unknown;
    if (index !== -1) {
      if (index !== 1 || args.length !== 3) throw new Error('--options는 단일 원본에만 사용할 수 있습니다.');
      options = JSON.parse(await readFile(args[2], 'utf8'));
      args.splice(1);
    }
    if (!args.length || args.some(a => a.startsWith('-'))) throw new Error('사용법: npm run draft:preview -- <원본.json> [추가 원본.json ...] 또는 <원본.json> --options <설정.json>');
    const inputs = await Promise.all(args.map(async file => ({ source: await readFile(file, 'utf8'), options })));
    const plan = await planPublication(root, inputs);
    output(JSON.stringify(plan, null, 2));
    return plan.ok ? 0 : 1;
  } catch (e) { reportError(String(e)); return 1; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await previewCommand(process.argv.slice(2));
}
