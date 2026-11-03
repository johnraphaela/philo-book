# EP04 승인 문구를 적용한 출판 후보

후속 일반 서재 등록은 사용자 요청 “일반서재 등록해줘”에 따라 [library-registration.md](library-registration.md)와 별도 등록 입력/기록으로 진행한다. 이 문서의 draft 상태·출판 승인 구분은 후보 적용 당시의 이력으로 보존한다.

사용자 지시 “승인, 출판후보적용”에 따라 publication-review의 E1/E2/E3/E4/S1/S2/H1과 EP04 한정 표시안을 적용했다. 후보는 publication-candidate.json이며 ID pico-silver-feather와 status:draft를 유지한다. master-draft.json/source/ 및 실제 이미지 파일은 바꾸지 않았다.

publication-approval.json은 실제 승인 문구·대상 제안 ID·원본/후보 SHA-256·출판 옵션을 기록한다. 이것은 출판 후보 적용 승인으로, ready 승격·main 병합·정식 공개 승인은 아니다. 최초 proposed-edits.json의 approved:false는 승인 전 제안을 보관한 이력이며 현재 승인은 별도 승인 기록을 기준으로 본다.

## 적용한 내용

- 에티카의 원전 설명과 그림책의 교육적 해석 구분.
- 데미안 한국어 직접 인용을 확인한 영문판 기반의 교육적 의역으로 바꾸고 실제 참고자료 명시.
- 제자리 눈 뜬 동작/앉아서 눈 감는 상상, 보호자 감독·중단 조건·가위/테이프 주의 보완.
- Serve and Return 원리 참고와 특정 놀이 효과 보장 구분.
- 실제 EP04 본문/표지를 4:3·contain으로 표시해 그림 전체를 보여 줌. 탭은 ‘생각 놀이’, 제목은 ‘함께 나누는 생각 놀이’로 표시.
- 대화1/2·활동1/2, 원래 제목·질문·준비물·단계 ID와 배열 순서는 유지.

src/lib/book-presentation.ts가 pico-silver-feather ID에만 표시 설정을 반환한다. 다른 책과 모르는 ID는 기존 컴포넌트 기본값인16:9/cover 및 기존 놀이 제목을 사용한다. 출판 스키마는 바꾸지 않았다. 사용자는 후속 지시로 현재 후보 PR의 main 병합도 요청했다. 실제 서재 등록과 정식 공개는 여전히 별도다.

## Windows에서 후보 미리보기

GitHub Desktop에서 Fetch origin 후 review/ep04-publication-plan 브랜치를 선택한다. 이전 미리보기 서버가 실행 중이면 그 터미널에서 Ctrl+C로 먼저 종료한다. package.json이 있는 프로젝트 루트에서 다음을 실행한다.

```bat
node --experimental-strip-types content-authoring/handoffs/ep04/pico-silver-feather/preview-publication.mjs
```

기존 preview-local.mjs는 최초 Handoff 원고를 그대로 검토하는 명령이다. 승인 문구가 적용된 이번 후보는 preview-publication.mjs를 사용한다. 설치된 의존성을 재사용하며 후보 생성 명령 자체가 임시 사이트의 Astro check/build를 실행한다. 원래 프로젝트의 src/content/public에 후보를 쓰지 않는다.

성공 결과 site.ok:true와 실제 site.stageRoot를 확인한다. CMD에서는 아래 명령을 한 줄씩 실행한다. 경로를 결과의 실제 Windows 경로로 바꾼다.

```bat
cd /d "<site.stageRoot의 실제 경로>"
set ASTRO_TELEMETRY_DISABLED=1
node node_modules/astro/bin/astro.mjs preview --config preview.astro.config.mjs --host 127.0.0.1 --port 4321
```

PowerShell을 쓰는 경우 폴더 이동은 `Set-Location '<실제 경로>'`, 환경 변수 설정은 `$env:ASTRO_TELEMETRY_DISABLED = '1'`이다. 마지막 node 서버 명령은 같다. 서버 출력 포트가 다른 경우 표시된 포트를 사용한다.

PC: http://localhost:4321/book/pico-silver-feather/ . 서버는 켜두고 검토 후 Ctrl+C로 종료한다.

스마트폰은 같은 Wi-Fi에서 확인한다. 서버를 종료하고 --host를0.0.0.0으로 바꿔 실행한 다음, ipconfig에서 확인한 PC Wi-Fi IPv4를 사용해 http://<PC IPv4>:4321/book/pico-silver-feather/ 를 연다. Windows 방화벽 알림은 개인 네트워크만 허용한다.

## 보존과 검증

candidate-validation.json과 candidate-browser-validation.json에 실제 실행 결과를 기록한다. 테스트는 승인된7개 교체를 적용한 값과 후보 전체가 동일한지, 원본과 승인 밖 필드/동화/힌트/이미지/ID/상태가 보존되는지를 검사한다. 로컬 미리보기도 원본 파일 전후 바이트를 비교한다. Windows의 원본/후보 JSON 개행 변환을 막는 .gitattributes 규칙을 사용한다.

현재 공개 컬렉션에는 EP04 JSON/MDX를 추가하지 않았다. 후보의 예상 Astro JSON/MDX는 미리보기 결과 plan 파일의 files[].content에서, 실제 적용 사본은 site.stageRoot 아래 src/content에서 확인한다. 출력 계획에서 제외한 이미지 프롬프트·확장값은 제작 원본/후보에 남는다.

## 다음 결정

사용자가 이 승인 후보의 문구·그림 비율·번호·모바일 화면을 확인한 후 별도 공개 등록 여부를 결정한다. 현재 후보 PR의 main 병합은 후속 지시에 포함하며, ready 상태 변경·공개 컬렉션 등록·정식 출판은 구분한다. Vercel 배포 명령은 실행하지 않는다.

사용자가 “vercel 빼고는 다 병합”을 요청해 루트 vercel.json에 git.deploymentEnabled:false를 추가했다. 이는 모든 브랜치의 Git 자동 배포를 끄는 [Vercel 공식 설정](https://vercel.com/docs/project-configuration/git-configuration#turning-off-all-automatic-deployments)이다. 로컬 Astro 명령과 기존 배포 파일은 바꾸지 않는다.


## 이번 후보의 실제 검사 결과

- 승인 문구7개 적용 및 변경 허용4곳 밖의 값 보존 검사 통과. 원본·후보 해시와 실제 승인 기록을 대조했다.
- 테스트79개 통과, 실패0·skip0. 콘텐츠 검사 통과. Astro check 오류/경고/힌트0. 기존 사이트4경로 빌드 및 test:site 통과.
- 승인 후보의 별도 임시 사이트도 check/build 통과, 기존4+EP04 총5경로 생성. 임시 입력만 기술 검증용 ready이며 저장된 원고/후보는 draft다.
- Chromium PC1440×1000/모바일390×844에서 실제 구현으로 이미지12장·힌트12개·힌트 토글·에세이/문헌 링크3개·안전 문구·준비물·대화1/2·활동1/2를 확인했다. 가로 넘침·pageerror0.
- EP01~03 각각의 PC/모바일 첫 장면 스크린샷6개를 이전 빌드와 픽셀 비교해 모두 동일함을 확인했다. 기존 놀이 탭/제목도 유지된다.
- 새 후보의 물리 Windows/스마트폰 미리보기는 아직 사용자 확인 전이다. 이전 원고의 Windows 성공과 구분한다.

[실제 모바일 동화 화면](candidate-story-390.png) · [실제 PC 동화 화면](candidate-story-1440.png) · [실제 모바일 놀이 화면](candidate-activities-390.png)
