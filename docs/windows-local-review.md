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

기존 파일 symlink 사례도 별도 하위 테스트로 유지한다. Windows에서 해당 링크 생성 자체가 EPERM/EACCES로 거부될 때 그 하위 사례만 명시적으로 skip한다. 절대 경로·상위 경로·junction·CLI 읽기 전용 검사와 다른 기능 테스트는 계속 실행한다. 권한 오류 이외의 실패나 Linux/macOS 오류는 skip하지 않는다. 관리자 실행이나 Developer Mode 활성화를 기본 요구하지 않는다.

GitHub Actions의 Windows validation은 Node 24와 `core.autocrlf=true` 체크아웃으로 설치·테스트·콘텐츠 검사·Astro 검사·빌드를 실행한다. 이 워크플로는 배포하거나 Vercel 연결을 변경하지 않는다.
