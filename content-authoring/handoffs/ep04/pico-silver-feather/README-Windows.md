# EP04 부모 힌트 보완본 — Windows 로컬 미리보기

정본은 draft이며 정식 공개 승인이 아니다. 이 디렉터리의 preview-local.mjs는 원본을 쓰지 않고 임시 후보를 사용해 EP04의 실제 그림·부모 힌트·에세이·놀이를 검토한다. 임시 후보에만 기술 테스트용 ready 플래그가 있다. 본문과 이미지를 변경하거나 운영 src/public에 파일을 추가하지 않는다.

## 작업 결과와 전달 상태

기준 main: 30901b7514de6a5c13ab6c278a31d796eb036a24(PR #23 병합). 검토 브랜치: review/ep04-teaching-points. PR #23은 작업 확인 시 이미 병합돼 있었으며 이번 작업에서 병합하지 않았다. 사용자는 2026-11-03에 관련 Vercel 프로젝트를 모두 Disconnect했다고 알려줬다. 그 확인 후 별도 검토 브랜치를 전달하며 Vercel 배포나 main 병합은 수행하지 않는다. GitHub Desktop에서 Fetch origin 후 이 브랜치를 선택하면 파일을 받을 수 있다. 사용자의 Vercel 설정 변경 자체를 별도로 인증한 것은 아니다.

사용자가 사전검사를 완료했다고 알려준 사실을 반영하며 기본 테스트 반복 실행을 요구하지 않는다. 아래는 새 EP04 파일을 전달받은 뒤 실행할 명령이다.

## 실행

GitHub Desktop의 Show in Explorer로 package.json이 있는 실제 저장소 위치를 확인한다. 최근 사용자 경로가 저장소 루트일 경우 다음을 사용한다. package.json이 한 단계 아래 philo-book에 있다면 그 폴더에서 실행한다.

```powershell
Set-Location 'C:\Users\user\Documents\GitHub\philo-book'
Test-Path .\package.json
node --experimental-strip-types .agents/skills/philo-book-author/scripts/review-handoff.ts content-authoring/handoffs/ep04/pico-silver-feather --baseline 'content-authoring/handoffs/ep04/pico-silver-feather/source/Master Draft.md'
node --experimental-strip-types content-authoring/handoffs/ep04/pico-silver-feather/preview-local.mjs
```

Test-Path가 True인 프로젝트 루트에서 실행한다. 이미 설치한 node_modules를 재사용하며 npm 설치나 배포를 자동 실행하지 않는다. 필요 시 기존 프로젝트 의존성 설치는 npm.cmd ci를 사용한다. Node >=22.23.4이며 이번 실행은 Linux/Node24.19.0이다. 실제 Windows에서 이 새 보조 스크립트는 미실행이지만 junction은 기존 PR #20 방식을 사용한다.

마지막 명령이 성공하면 JSON의 site.ok:true, site.stageRoot, site.checks를 확인한다. 검토용 Astro JSON/MDX 문자열은 결과 plan 파일의 files[].content에 있고, 실제 적용 사본은 site.stageRoot/src/content/books/pico-silver-feather.json 및 essays/pico-silver-feather.mdx에 있다. workspace/test-candidate.json, activity-mapping.json, publication-plan.json은 모두 임시 경로에만 있다. 원본 status는 draft로 남는다.

성공 결과의 실제 site.stageRoot로 이동해 다음 서버를 실행한다.

```powershell
Set-Location '<site.stageRoot의 실제 값>'
$env:ASTRO_TELEMETRY_DISABLED = '1'
node node_modules/astro/bin/astro.mjs preview --config preview.astro.config.mjs --host 127.0.0.1 --port 4321
```

PC에서 http://localhost:4321/ 및 http://localhost:4321/book/pico-silver-feather/ 를 연다. Astro가 다른 포트를 표시하면 그 포트를 사용한다. 이 주소는 사용자가 위 서버를 PC에서 실행한 뒤에만 열리며 클라우드 검증 서버 주소가 아니다.

같은 Wi-Fi의 스마트폰 검토는 서버를 Ctrl+C로 종료한 뒤 아래 명령으로 실행한다.

```powershell
node node_modules/astro/bin/astro.mjs preview --config preview.astro.config.mjs --host 0.0.0.0 --port 4321
```

별도 PowerShell에서 ipconfig로 Wi-Fi IPv4를 확인하고 스마트폰에서 http://<PC IPv4>:4321/book/pico-silver-feather/ 를 연다. 방화벽 알림은 개인 네트워크만 허용한다. 게스트 Wi-Fi의 기기 간 통신 차단이 있으면 접속되지 않을 수 있다. 종료는 Ctrl+C. 포트 전달·외부 호스팅·Vercel은 사용하지 않는다.

## 확인된 결과

| 검사 | 결과 |
|---|---|
| Master Draft 스키마·새 원본 바이트 대조 | 통과. 힌트12개·프롬프트12개·모든 본문 보존 |
| PNG12개 | 모두 1448×1086/4:3, 실제 PNG/전체 디코딩 통과, 누락·바이트 중복 없음 |
| Handoff --baseline | 오류0·경고0·사람 검토2, publicationReady:false |
| 정본 draft:preview/draft:site | not-ready·missing-image(assetPath 미지정)·mapping-required로 차단. 의도적으로 정본 변경 없음 |
| 임시 후보 plan·격리 사이트 check/build | 모두 통과. check 오류/경고/힌트0. 기존4경로+EP04 총5경로 빌드 |
| Chromium PC1440×1000/모바일390×844 | 서재 카드·12장면 이미지/본문/힌트·힌트 토글·에세이·놀이 원문/준비물·대화1/2·활동1/2 확인 |
| 화면 실행 | pageerror0, 모바일 가로 넘침 없음 |
| 이미지 잘림 | 기존16:9/cover 정책으로 위아래 합계25% 잘림 확인. 원본4:3 이미지는 미변경 |
| 원본 보호 | helper의 전후 source/public/content-authoring 파일 바이트 검사 통과. git diff의 src/public/기존 EP03 변경 없음 |
| 실제 Windows 실행·물리 스마트폰 | 이번 세션에서는 미실행 |

범용 변환기 경고4개는 제작용 prompt/확장값/대화·활동 표시 마커에 대한 검토 경고다. original draft와 source/에 모두 보존했고 출판 JSON에는 prompt가 포함되지 않는다. 이는 학술 승인이나 Vercel 배포 성공을 의미하지 않는다.

## 검토 후 남은 판단

review-report.md의 철학 해석·한국어 인용 출처·놀이 감독/안전·5~10세 적합성·활동 표시 매핑·4:3 잘림 허용을 검토한다. 사용자 승인 없는 추가 원고 수정이나 정식 ready 변경은 하지 않았다. 표지 첫 장면 재사용과 서재 order:4는 임시 옵션에만 명시했다. 공개 URL ID는 pico-silver-feather로 유지한다.

정본/새 원본 Markdown의 Windows 개행 변환을 막기 위해 이 EP04 디렉터리에만 .gitattributes를 추가했다. 루트 속성이나 EP01~03는 바꾸지 않았다. 파일을 수동 복사하거나 편집해 원본 바이트가 달라지면 보조 스크립트는 해시 오류로 중단하므로 원문 해시를 임의 갱신하지 말고 차이를 먼저 검토한다.
