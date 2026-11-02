import { readFile } from 'node:fs/promises';
import { validateMasterDraft } from './schema.ts';
import { inspectAstroDraft } from './adapter.ts';

const args = process.argv.slice(2);
const publication = args[0] === '--publication';
const file = args[publication ? 1 : 0];
if (!file || args.length !== (publication ? 2 : 1)) {
  console.error('사용법: npm run draft:check -- [--publication] <원본.json>');
  process.exitCode = 1;
} else {
  try {
    const input: unknown = JSON.parse(await readFile(file, 'utf8'));
    const parsed = validateMasterDraft(input);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) console.error(`${issue.path.join('.')}: ${issue.message}`);
      process.exitCode = 1;
    } else if (publication) {
      const diagnostics = inspectAstroDraft(input);
      diagnostics.forEach(item => console.log(`[${item.severity}] ${item.path}: ${item.message}`));
      if (diagnostics.some(item => item.severity === 'error')) process.exitCode = 1;
      else console.log('필수 원문 검사 통과. 변환·파일 존재 확인·빌드·출판은 실행되지 않았습니다.');
    } else console.log(`Master Draft v${parsed.data.schemaVersion}: ${parsed.data.id} (${parsed.data.status}) — 형식 검증 통과`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
