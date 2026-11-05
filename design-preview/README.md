# PHILO-PAIRING 디자인 검토

2026-11-05, 기준 main `1deee73074341483b38d046a96f075bc47c2674e`. fetch 후 HEAD와 FETCH_HEAD 일치 확인. 시작 시 working tree clean. 운영 소스·출판 콘텐츠·원고·이미지·승인/소유권/해시·vercel.json 변경 없음. 병합·푸시·배포하지 않음.

## 미리보기

저장소 루트에서:

```sh
ASTRO_TELEMETRY_DISABLED=1 npm run astro -- dev --config design-preview/astro.config.mjs --host 127.0.0.1 --background
```

- A: http://127.0.0.1:4321/a/
- B: http://127.0.0.1:4321/b/
- 대표 읽기: 각 경로의 `book/ep01-robot-mong`
- 각 시안의 모든 책 링크는 격리된 읽기 화면으로 연결됨. 운영 `/book/<id>`는 변경 없음.
- 정적 미리보기 빌드: `npm run build -- --config design-preview/astro.config.mjs`
- 출력: `design-preview/dist`. 운영 기본 빌드는 기존 6개 경로만 생성, 시안은 별도 12개 경로.
- 두 서버 동시 실행은 Astro의 background 서버 상태 공유 때문에 별도 정적 서버 필요. 운영 비교는 `python3 -m http.server 4322 --bind 127.0.0.1 --directory dist`로 수행.

[전체 보고서](REPORT.md), [A 데스크톱](evidence/a-1440.png), [A 모바일](evidence/a-390.png), [B 데스크톱](evidence/b-1440.png), [B 모바일](evidence/b-390.png). 같은 폴더에 360/768px, 뷰어, 부모 에세이 화면도 보관.

## Hallmark

Hallmark는 런타임 UI 라이브러리가 아닌 에이전트 스킬 + 검사 스크립트. 공식 `Nutlope/hallmark` main 커밋 `de4999e0cd7a7a41df0b4e6903fa02fe9f1492a8`의 README, SKILL.md(v2.0.0), redesign.md, flow.md Harnesses, gates.md를 확인. 로컬 기존 설치 없음. 프로젝트 한정 `.tools/hallmark`에 공식 스킬 사본, `.tools/runtime`에 puppeteer-core 설치. 전역 설치/설정 및 운영 package.json/lockfile 변경 없음. 스킬의 테스트 fixture는 프로젝트 Astro 검사 혼입을 막기 위해 로컬 도구 사본에서 제외.

Codex 호출 표기는 `$hallmark audit <대상>`. 이 세션에서는 스킬 파일을 읽고 아래 공식 스크립트를 직접 실행. 독립 실행형 `hallmark` CLI를 설치한 것이 아님.

```sh
HALLMARK_PUPPETEER="$PWD/design-preview/.tools/runtime" CHROME_PATH=/tmp/philo-chrome \
 node design-preview/.tools/hallmark/scripts/sloplint.mjs \
 src/pages/index.astro src/components/library src/styles/global.css \
 --genre editorial --render --before --url http://127.0.0.1:4322/

HALLMARK_PUPPETEER="$PWD/design-preview/.tools/runtime" CHROME_PATH=/tmp/philo-chrome \
 node design-preview/.tools/hallmark/scripts/sloplint.mjs design-preview/src \
 --genre editorial --render --url http://127.0.0.1:4321/a/ --url http://127.0.0.1:4321/b/
```

`/tmp/philo-chrome`는 sandbox 환경에서 Chromium을 실행하는 `exec /usr/bin/chromium --no-sandbox "$@"` 래퍼. 영구 환경 설정 아님. 도구는 git 제외되므로 다른 체크아웃에서는 같은 공식 커밋의 `skills/hallmark`를 `.tools/hallmark`에 복사하고 `npm install --prefix design-preview/.tools/runtime puppeteer-core`로 준비. 공식 MIT 라이선스 적용.

Hallmark의 랜딩 페이지 섹션 수·카피 축약·브랜드 표기 제거 지침보다 사용자의 기존 구조/문구/기능 보존 요청을 우선. 테마 자동 선택을 수행한 새 브랜드 제작이 아니며, 기존 서비스의 audit와 격리된 비교 시안이다. Hallmark 인증/전체 규칙 통과를 의미하지 않음.
