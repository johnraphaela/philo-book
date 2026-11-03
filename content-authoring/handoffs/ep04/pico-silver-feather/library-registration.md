# EP04 일반 서재 등록

사용자 요청 “일반서재 등록해줘”에 따라 승인 후보를 일반 Astro 컬렉션에 등록한다. Vercel Git 자동 배포 차단은 유지하며 외부 배포 명령은 실행하지 않는다.

## 등록 파일

- src/content/books/pico-silver-feather.json — 실제 이미지12장, 동화 본문·부모 힌트·alt·생각 놀이 연결.
- src/content/essays/pico-silver-feather.mdx — 승인된 에세이 본문·문헌 의역·참고 링크3개.
- public/images/pico-silver-feather/page1.png~page12.png — Handoff 이미지와 바이트 동일한 사본. 원본1448×1086/4:3 유지.

공개 URL 경로는 /book/pico-silver-feather/이며 관리 번호 때문에 ID를 바꾸지 않았다. 표지는 page1.png를 재사용하고, 기존 main의 EP04 한정4:3/contain·‘생각 놀이’ 표시를 그대로 사용한다.

기존 EP01~03의 원고·이미지·순서 설정과 UI 코드는 수정하지 않는다. EP03는 명시적 order가 없어 기존 기본값100을 사용한다. 후보의 order:4를 그대로 등록하면 EP03 앞에 놓이므로, 등록 옵션에만 order:101을 사용해 EP04를 마지막/네 번째에 추가한다. 원래 후보 승인 기록의 order:4는 이력으로 보존하고 이 조정은 library-registration.json에 기록한다. 추천 연령5~10세는 원본 값이며 topics는 임의로 추가하지 않았다.

## 원고·변환 추적

master-draft.json/source/ 및 publication-candidate.json은 보존한다. 과거 publication-approval.json의 approvedForPublication:false는 당시 후보 적용 승인 기록이다. 이번 일반 서재 등록의 실제 요청과 승인 범위는 library-registration.json에 별도로 기록한다.

등록용 publication-source.json은 승인 후보에서 만든 ready 변환 입력이다. 확인된 이미지 웹 경로와 승인된 대화/활동 표시 매핑을 넣고, 원래 구조화 활동 전체는 extensions.publicationMapping.originalStructuredActivity에 보존한다. 상태 변경은 이 별도 등록 입력에만 있으며 원본과 이전 후보는 draft로 남는다. 새 문장 윤문이나 번호/장면 변경은 없다.

기존 읽기 전용 planPublication으로 출력 JSON/MDX를 계산하고 새 파일만 배치했다. 같은 원본·옵션을 다시 검사하면 두 출판 파일 모두 noop이어야 한다. 파일별 해시·장면/활동 대응·출판 제외 제작 필드·검토 경고는 library-registration.json에 기록한다. 프롬프트와 확장값은 출판 화면에 표시하지 않지만 제작 자료에 남는다.

읽기 전용 재현 검사는 다음 명령이다.

```powershell
npm.cmd run draft:preview -- content-authoring/handoffs/ep04/pico-silver-feather/publication-source.json --options content-authoring/handoffs/ep04/pico-silver-feather/publication-options.json
```

등록 이미지와 임시 사본 이미지가 이미 존재할 때에도 preview-publication.mjs는 바이트 동일한 경우에만 재사용한다. 다른 내용의 충돌 파일은 덮어쓰지 않는다. 최초 Handoff 원고의 preview-local.mjs는 등록된 승인 에세이와 다른 과거 원문을 사용하므로 충돌 진단이 날 수 있다. 일반 검토에는 아래 기본 사이트 명령을 사용한다.

## Windows 일반 사이트 열기

main 통합 후 GitHub Desktop에서 main → Fetch origin → Pull origin을 실행한다. 이전 임시 서버는 Ctrl+C로 종료한다. PowerShell에서 프로젝트 루트로 이동한다.

```powershell
Set-Location 'C:\Users\user\Documents\GitHub\philo-book\philo-book'
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4321
```

일반 서재: http://localhost:4321/ . EP04 직접 열기: http://localhost:4321/book/pico-silver-feather/ . Astro가 다른 포트를 표시하면 해당 포트를 사용한다. 더 이상 임시 stageRoot로 이동하거나 preview.astro.config.mjs를 지정할 필요가 없다.

같은 Wi-Fi 스마트폰 검토는 --host를0.0.0.0으로 바꾸고 ipconfig에서 확인한 PC Wi-Fi IPv4를 사용해 접속한다. 방화벽 알림은 개인 네트워크만 허용한다. 검토 종료는 Ctrl+C다.

기존 의존성을 재사용한다. package.json/package-lock.json 변경은 없으므로 이번 등록 때문에 npm.cmd ci를 반복할 필요는 없다. Windows에서는 새 책 JSON/에세이의 바이트가 바뀌지 않도록 EP04에만 LF 체크아웃 규칙을 추가했다.


## 실제 검증 결과

- 테스트81개 통과, 실패0·skip0. 기존 승인 후보 검사와 일반 등록의 바이트 재현·본문/힌트/에세이/활동/준비물·이미지 보존 검사를 포함한다.
- 콘텐츠 검사 및 Astro check 오류/경고/힌트0. 일반 사이트 총5경로 빌드 성공(서재+책4권).
- 등록용 원본/옵션으로 읽기 전용 계획을 재실행해 JSON/MDX 모두 noop 확인. 등록 뒤 preview-publication.mjs도 기존 동일 이미지 사본을 재사용해 격리 check/build 성공. test:site 통과.
- Chromium PC1440×1000/모바일390×844의 일반 사이트에서 EP04가 네 번째 카드로 표시됨을 확인했다. 제목 검색·연령 필터·카드 클릭·12장면 이미지/본문/힌트·힌트 토글·에세이/문헌 링크·생각 놀이/번호를 확인했다. 가로 넘침·pageerror0.
- 기존 EP01~03 원고·이미지·UI 코드와 원본 Handoff/승인 후보 파일은 변경하지 않았다. 새 이미지12개는 Handoff와 바이트 동일하다.
- 물리 Windows/스마트폰에서 이번 일반 사이트를 새로 여는 검토는 사용자 확인 전이며 Windows CI와 구분한다.

[일반 서재 PC 화면](library-1440.png) · [일반 서재 모바일 화면](library-390.png)
