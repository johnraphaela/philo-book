import { inspectPublishedContent } from './publication-integrity.ts';
try {
  const diagnostics = await inspectPublishedContent(process.cwd());
  for (const d of diagnostics) console.log(`[${d.severity}] ${d.code} ${d.path}: ${d.message}`);
  if (diagnostics.some(d => d.severity === 'error')) process.exitCode = 1;
  else console.log('출판 파일·이미지·책/에세이 연결 검사 통과. 원고 사실 검증과 출판 승인은 별도입니다.');
} catch (error) { console.error(String(error)); process.exitCode = 1; }
