# 격리된 후보 사이트 검사·미리보기

`draft:site`는 ready Master Draft를 변환하고, 새 OS 임시 디렉터리의 사이트 사본에만 후보 파일을 추가한 뒤 실제 Astro `check`·`build`를 실행한다. 원본 저장소의 출판 파일·이미지·원고·UI를 수정하거나 Vercel에 배포하지 않는다. 기존 `draft:preview`는 계속 파일을 쓰지 않는 JSON dry-run이다.

## 실행

저장소 루트에서 의존성을 설치한 상태로 실행한다. 네트워크 설치나 npm lifecycle 스크립트를 자동 실행하지 않는다.

```sh
npm run draft:site -- path/to/ready.json
npm run draft:site -- first.json second.json
npm run draft:site -- ready.json --options publication-options.json
```

원본/옵션 규칙은 [변환 미리보기](publication-preview.md)와 같다. 모르는 플래그는 거부하며 출력 디렉터리 지정·기존 plan JSON 불러오기·덮어쓰기 모드는 없다. 일반 JSON stdout만 받으려면 다음을 사용한다.

```sh
node --experimental-strip-types content-authoring/site-preview-cli.ts ready.json
```

미완성 예시와 기존 EP03의 제작 draft는 자동으로 ready로 바꾸지 않는다. 새 콘텐츠 원본으로 검토해야 하며, 기존 파일과 다른 후보는 기존 충돌 검사에서 차단한다.

## 처리 순서

1. 입력 문자열과 옵션을 복제하고 사이트 원본 파일의 바이트를 읽는다. 복사 대상은 `src/`, `public/`, `content-authoring/`, `scripts/`, `astro.config.mjs`, `tsconfig.json`, `package.json`, `package-lock.json`이다. `.env*`, Git·기존 빌드·기존 캐시는 제외하며 복사할 소스의 symlink/특수 파일은 거부한다.
2. 원본 사이트에서 현재 출판 계획을 검사한다. 준비 상태·실제 이미지·기존 책/에세이·출력 충돌 오류가 있으면 임시 사이트도 만들지 않는다.
3. `philo-site-preview-*`라는 새 OS 임시 디렉터리에 복사한다. 복사본에서도 계획을 다시 계산하고 예상 파일이 처음과 일치하는지 확인한다.
4. 설치된 의존성은 패키지별 디렉터리 링크(Windows에서는 junction)로 재사용하되, 임시 사이트의 `node_modules` 자체는 별도 디렉터리다. 원본 `node_modules/.astro`/`.vite` 캐시를 링크하지 않는다. 복사본에만 새 파일을 exclusive create로 추가하고 noop 파일은 해시를 확인한다.
5. 복사본의 콘텐츠 무결성을 검사한다. 원래 Astro 설정을 가져오는 임시 wrapper에서 root/src/public/outDir/cacheDir를 임시 디렉터리 아래로 고정한다. 실제 Astro CLI의 `check` 후 `build`를 실행하며 한 명령이 실패하면 다음 단계는 실행하지 않는다. 각 명령 제한 시간은 120초이고 로그는 최대 약 2MB를 보존한다.
6. 후보 ID별 `dist/book/<id>/index.html`이 생성되고 비어 있지 않은지 확인한다. 마지막에는 성공/실패와 관계없이 원본 복사 대상의 바이트를 다시 비교한다. 동시 편집이 발견되면 결과를 실패로 표시한다. 변경한 파일을 되돌리거나 덮어쓰지 않는다.

이는 현재 저장소의 정적 사이트 설정을 대상으로 하는 파일 사본이다. 저장소의 신뢰된 Astro 설정·플러그인·의존성 코드는 실행된다. OS 보안 샌드박스나 의존성의 독립 설치를 제공하는 기능은 아니다. 생성 에세이에 실행 가능한 MDX를 허용하지 않는 기존 정책은 그대로 유지한다. 외부 프로젝트의 임의 빌드 코드를 안전하게 실행하는 용도로 사용하지 않는다.

## 결과와 화면 열기

성공 시 종료 0과 다음 JSON을 반환한다.

- `stageRoot`, `dist`: 임시 사본과 실제 빌드 출력의 절대 경로
- `routes`: 이번 후보 책의 `/book/<id>/` 경로 목록
- `checks`: check/build의 종료 코드와 로그 경로
- `sourceHashes`: 검사한 원본 파일별 SHA-256
- `preview`: 미리보기 실행 위치(`cwd`), 실행 파일(`executable`), 인자 배열(`args`)

보고서는 임시 디렉터리의 `preview-report.json`, 로그는 `preview-logs/check.log`와 `build.log`에 남는다. 실패 시 종료 1이며 오류·임시 경로·이미 실행한 검사 결과를 반환한다. 실패한 빌드를 화면 검수 완료로 해석하지 않는다. 이 명령은 서버를 자동 시작하지 않는다.

성공 결과의 실제 stageRoot로 이동한 뒤 서버를 실행한다.

```sh
cd /tmp/philo-site-preview-실제생성값
node node_modules/astro/bin/astro.mjs preview --config preview.astro.config.mjs --host 127.0.0.1
```

Astro가 표시한 로컬 주소에서 서재와 결과의 routes를 연다. 서버는 해당 터미널에서 Ctrl+C로 종료한다. 서버를 외부 인터페이스에 공개하거나 호스팅 연결을 변경하지 않는다.

임시 경로는 해당 머신에만 있고 세션 종료 후 사라질 수 있다. 원본 프로젝트에서 생성 보고서의 경로를 그대로 사용해 미리보기를 다시 여는 방식이다. 검수 후에는 보고서의 `stageRoot`가 정확히 해당 임시 디렉터리인지 확인한 뒤 그 디렉터리만 삭제하면 된다. 자동 정리·운영 출판 파일 반영은 제공하지 않는다.

## 검증 범위와 남은 단계

자동 검사는 실제 컬렉션 스키마, MDX 컴파일, 콘텐츠 연결·이미지 무결성, 정적 페이지 생성을 확인한다. 화면 검수는 별도로 이미지 디코딩, 페이지 이동·힌트·탭, 에세이 Markdown, 놀이 순서·번호, 모바일 가로 넘침을 확인해야 한다. 학술 사실·연령 적합성·활동 안전성·편집 승인은 자동 판단하지 않는다.

이번 구현 검증에서는 검증 전용 ready 후보(기존 이미지를 참조)를 work/에만 만들어, 임시 사이트에 후보 1권을 추가하고 실제 check·build에 성공했다. Chromium 390×844와 1440×1000에서 후보의 이미지·페이지 이동·세 탭·강조·본문 목록·대화 번호·마무리, 기존 EP01~EP03의 이미지와 가로 넘침 없음을 확인했다. 브라우저 pageerror는 0건이며 스크린샷을 시각 검토했다. 검증용 후보는 실제 출판 컬렉션이나 제작 예시에 등록하지 않았다.

테스트는 byte-identical 기존 파일의 noop 처리, 후보의 정확한 문자열 적용·원본 보존·캐시 분리·비밀 파일 제외, 충돌 시 생성/빌드 없음, check 실패 시 build 중단과 로그 보존, HTML 누락, 실패 도중 원본 변경 탐지, 소스 symlink 거부를 다룬다. 단위 테스트의 명령 실행은 주입한 runner로 검증하며 실제 Astro 명령과 Chromium 검수는 별도 통합 실행으로 확인했다.

실제 출판 파일에 적용하는 트랜잭션 쓰기·예상 해시 기반 갱신, Handoff 통합, 구조화 활동의 승인된 매핑은 후속 단계다. 이 기능은 기존 학술 검토 항목이나 Vercel 빌드 횟수 제한을 해결하지 않는다.

최종 검증: 전체 테스트 68개, 콘텐츠 검사, Astro 진단 0건, 기존 사이트 4 routes 빌드 통과. 별도 후보 사이트도 실제 check/build와 모바일·PC 브라우저 검수를 통과했다.

Windows 호환성 보강: 의존성 링크와 경로 이탈 테스트에 junction을 사용해 파일 symlink 생성 권한을 요구하지 않는다. PR #21의 원본 줄바꿈/로컬 테스트 수정도 포함했다. 이 보강 후 전체 테스트는 71개다.
