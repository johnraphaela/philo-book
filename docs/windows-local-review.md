# Windows 로컬 검토

프로젝트 루트(package.json이 있는 폴더)의 PowerShell에서 실행한다. Node.js는 package.json의 engines 조건을 만족해야 한다.

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run content:check
npm.cmd run check
npm.cmd run build
```

`npm.ps1`이 PowerShell 실행 정책으로 차단되면 `npm.cmd`를 사용한다. 실행 정책을 변경할 필요가 없다. Astro 네이티브 바인딩의 unlink EPERM은 개발 서버나 편집기가 파일을 사용 중일 수 있다. 실행 중인 서버를 종료하고 편집기를 닫은 뒤 `npm.cmd ci`를 다시 실행한다.

## EP03 원본 줄바꿈

보관 원본 두 파일은 sourceFiles의 SHA-256 및 Master Draft 문자열과 대조하므로 Git이 바이트를 변환하면 안 된다. `.gitattributes`는 두 원본을 `-text`로 지정해 checkout 시 변환하지 않고, 출판 에세이는 원래 LF를 유지하게 한다. 원고나 저장된 해시를 수정하거나, 검증 시 trim/CRLF 정규화하여 차이를 숨기지 않는다. 일반 새 원고의 CRLF 문자열 보존 규칙도 그대로 유지한다.

이 규칙을 추가하기 전에 Windows에 내려받은 파일은 이미 CRLF로 변환됐을 수 있다. PR 변경을 받은 뒤 먼저 `git status --short`로 의도한 로컬 편집이 없는지 확인한다. 해당 세 파일을 직접 편집한 경우 먼저 별도 사본을 보관하고 차이를 검토해야 한다. 직접 편집하지 않았고 기존 `Expected explicit section 3 boundary`가 계속되면 아래 명령은 지정한 세 파일만 HEAD의 보관 바이트로 다시 체크아웃한다.

```powershell
git restore --source=HEAD --worktree -- content-authoring/pilots/ep03-hope/source/ep03-hope.json content-authoring/pilots/ep03-hope/source/ep03-hope.mdx.txt src/content/essays/ep03-hope.mdx
npm.cmd test
```

이 명령은 세 파일의 미커밋 편집을 교체하므로 자신이 편집한 원고에 무조건 실행하지 않는다. 전체 저장소 reset/clean이나 보안 설정 변경은 필요 없다.

## 경로 이탈 검사와 Windows 권한

파일 symlink는 Windows에서 Developer Mode나 별도 권한이 필요할 수 있다. 경로 이탈의 필수 테스트는 일반 권한으로 만들 수 있는 디렉터리 junction을 사용하고, Linux/macOS에서는 디렉터리 symlink를 사용한다. 이 검사는 건너뛰지 않으며 실제 파일 경로가 허용 루트 밖으로 향하는지 검증한다.

파일 링크 보안 사례도 항상 실행한다. Windows가 파일 symlink 생성을 EPERM/EACCES로 거부하면 실제 디렉터리 junction을 만들어 같은 루트 이탈/출력 경계 거부를 확인한다. 별도로 권한 거부를 강제로 주입한 하위 사례를 Windows와 Linux 모두에서 실행하므로 대체 경로도 반드시 검증된다. skip이나 무조건 성공 처리는 없다. 다른 오류는 실패하며, junction 자체를 만들 수 없는 파일시스템에서도 명확한 오류와 함께 실패한다. 관리자 실행이나 Developer Mode 활성화를 기본 요구하지 않는다.

GitHub Actions의 Windows validation은 Node 24와 `core.autocrlf=true` 체크아웃으로 설치·테스트·콘텐츠 검사·Astro 검사·빌드를 실행한다. 이 워크플로는 배포하거나 Vercel 연결을 변경하지 않는다.

## `Expected explicit section 3 boundary`의 정확한 원인

파일럿 `pilot.ts`는 업로드 원본의 3절 제목과 뒤의 빈 줄을 `### 3. 5~7세 아이와 나누는 대화법 (하버드 Serve & Return 적용)\n\n`으로 찾는다. 저장소의 실제 보관 원본은 LF이며 제목/섹션이 누락된 것이 아니다. Windows `core.autocrlf=true`가 원본 MDX의 LF를 CRLF로 바꾸면 실제 문자열은 `...\r\n\r\n`이 되어 `indexOf`가 -1을 반환한다. 이것이 초기 assertion의 직접 원인이다.

제목 검색만 CRLF 허용으로 바꾸면 이어지는 Master Draft 본문 동등성·보관 원본 SHA-256 검사도 실패한다. JSON 문자열 내부의 `\n`은 checkout으로 바뀌지 않지만 원본 MDX 파일 자체의 개행은 바뀌기 때문이다. 따라서 원문을 고치거나 해시를 갱신하지 않고 보관 원본의 체크아웃 바이트를 보존한다. 일반 제작 원고와 변환기의 CRLF 보존 규칙은 변경하지 않았다.

기존 main을 core.autocrlf=true로 체크아웃한 뒤 속성 수정 커밋으로 이동하는 재현에서도 파일 3개의 기존 CRLF가 자동으로 사라지지 않음을 확인했다. 그래서 기존 로컬 사본에는 위의 세 파일 재체크아웃이 필요할 수 있다. 새 clone/Windows CI에서는 속성 규칙이 처음부터 적용된다.
