import { pathToFileURL } from 'node:url';
import { readPreviewInputs } from './preview.ts';
import { createSitePreview } from './site-preview.ts';
export async function sitePreviewCommand(args: string[], root = process.cwd(), output = console.log, reportError = console.error): Promise<number> {
  try {
    const result = await createSitePreview(root, await readPreviewInputs(args));
    output(JSON.stringify(result, null, 2));
    return result.ok ? 0 : 1;
  } catch (e) { reportError(String(e)); return 1; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await sitePreviewCommand(process.argv.slice(2));
}
