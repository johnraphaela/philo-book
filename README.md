# PHILO-PAIRING

Astro와 React로 만드는 어린이 철학 그림책 서재입니다. 정적 페이지를 빌드하며 Vercel 배포 출력 디렉터리는 `dist`입니다.

## 개발

Node.js `>=22.23.4`가 필요합니다.

```sh
npm ci
npm run dev -- --background
```

기본 포트는 4321입니다. 서버 관리는 다음 명령을 사용합니다.

```sh
npm run astro -- dev status
npm run astro -- dev logs
npm run astro -- dev stop
```

사용자 설정 디렉터리에 쓸 수 없는 환경에서는 명령 앞에 `ASTRO_TELEMETRY_DISABLED=1`을 지정합니다.

## 검증

```sh
npm run check
npm test
npm run content:check
npm run build
```

`check`는 Astro·TypeScript 진단, `test`는 책과 에세이 연결 규칙, `build`는 콘텐츠 스키마와 정적 페이지 생성을 검증합니다. 테스트는 별도 프로세스 없이 Node 내장 러너로 실행됩니다. `content:check`는 출판 컬렉션의 표지·장면 이미지 경로/실제 디코딩/확장자와 파일 내용, 빈 본문, 책·에세이 연결을 읽기 전용으로 검사합니다. 실패 시 종료 코드 1입니다. 기존 `build` 동작은 유지하므로 출판 전 반드시 별도 실행합니다. 제작 draft·fixture는 탐색하지 않습니다.

## 구조

- `src/content.config.ts`: 책·에세이 스키마와 로더
- `src/content/books/*.json`: 책 제목, 분류, 연령, 페이지, 부모 힌트, 활동
- `src/content/essays/*.mdx`: 부모용 에세이
- `src/lib/content.ts`: 공통 콘텐츠 조회
- `src/lib/relationships.ts`: 책·에세이 연결과 무결성 검사
- `src/layouts/BaseLayout.astro`: 공통 HTML·메타데이터
- `src/components/library/`: 서재 카드
- `src/components/book/`: 탭, 에세이, 활동 패널
- `src/components/StoryViewer.tsx`: 페이지 이동·힌트를 담당하는 React 아일랜드
- `src/styles/`: 공통·책 상세·뷰어 보조 스타일
- `src/pages/`: 목록과 `/book/[id]` 정적 경로
- `public/images/`: 기존 그림책 이미지

## 책 추가

1. `src/content/books/<책ID>.json`을 추가합니다. 파일 ID가 `/book/<책ID>` URL이 되므로 공개 후에는 이름을 유지합니다.
2. `pages`에는 한 페이지 이상이 필요하며 각 페이지에 `image`, `text`를 지정합니다. `hint`, `imageAlt`는 선택 사항입니다.
3. 이미지를 `public/images/`에 추가하고 `image`에는 `/images/...` 경로를 지정합니다. 기존 책의 이미지·본문은 덮어쓰지 않습니다.
4. 에세이가 있으면 MDX의 frontmatter에 `title`, `bookId`, `tags`를 지정합니다. `bookId`는 책 JSON 파일 ID와 같아야 합니다. 에세이 파일명은 달라도 됩니다.
5. 현재 UI는 책당 에세이 한 편을 지원합니다. 존재하지 않는 책 참조와 중복 에세이는 빌드 시 오류로 처리합니다. 에세이·활동이 없으면 해당 탭은 표시하지 않습니다.
6. 검증 명령을 실행한 뒤 서재 링크, 페이지 이동, 힌트, 탭, 모바일 화면과 이미지를 확인합니다.

현재 EP01~EP03의 장면 이미지와 표지는 업로드되어 있습니다. 2026-11-03 점검에서 EP02의 `.jpg` 12개가 실제 PNG로 확인되어 `content:check`가 실패합니다(표지 재사용 포함 13개 참조 진단). 기존 자산과 원고는 그대로 두었으며, 별도 자산 수정 후 검사 통과가 필요합니다. 이미지를 추가할 때 파일명 변경만으로 형식을 바꾸지 마세요. 자세한 내용은 [품질 점검 보고서](docs/publication-audit.md)를 참고하세요.

## 다음 우선순위

1. 이 구조에서 책 추가 흐름을 유지하고 콘텐츠 검증을 강화합니다.
2. 책을 추가하면서 소개·연령·주제 분류를 검토하고, 필요에 따라 서재 검색·필터를 확장합니다.
3. 철학 질문과 교육 활동의 독립 컬렉션은 여러 책에서 재사용할 필요가 생길 때 도입합니다.

현재 색상·카드·책 상세 URL·본문·이미지 경로를 유지합니다. 전체 React 앱 전환이나 데이터베이스 도입은 현재 단계에 필요하지 않습니다.

## 서재 메타데이터와 탐색

기존 책 본문과 이미지 경로를 유지하면서 JSON에 아래 선택 필드를 추가할 수 있습니다.

```json
{
  "summary": "서재 카드에서 보여 줄 짧은 소개",
  "cover": "/images/ep01/page1.jpg",
  "order": 1,
  "recommendedAge": { "min": 5, "max": 9 },
  "topics": ["identity", "change"]
}
```

- `cover`가 없으면 그림책 아이콘으로 표시합니다. 위 예시는 실제로 있는 첫 번째 책의 첫 삽화를 재사용합니다.
- `order`는 작은 값부터 표시하며, 생략 시 100입니다. 같은 값이면 책 ID 순서로 정렬합니다.
- `recommendedAge`는 부모가 고를 때 참고할 추천 범위입니다. `5–7세 / 8–9세 / 10–12세`와 겹치는 모든 필터에 표시합니다. 이전 `ageGroups`는 보존하며 추천 범위가 없을 때 카드에 표시합니다. 추천 범위가 없는 책은 연령 필터를 적용하면 제외됩니다.
- `topics`는 공통 분류 ID이며 `identity`(자아와 정체성), `change`(변화와 성장), `self-esteem`(자존감과 감정)을 지원합니다. 새 분류는 `src/lib/library.ts`의 `TOPICS`에 먼저 추가합니다.
- `categories`는 기존 책별 자유 태그로 유지합니다. 공통 분류와 자유 태그는 별도로 관리합니다.
- 검색은 제목·소개·테마·자유 태그·공통 주제명을 대상으로 하며, 공백으로 나눈 검색어를 모두 포함하는 책을 표시합니다. 연령·주제 필터도 함께 적용됩니다.
- 검색 결과 수, 결과 없음 안내, 초기화 버튼을 제공합니다. JavaScript가 꺼져 있으면 필터 대신 전체 정적 서재를 표시합니다.

초기 두 책의 추천 연령을 기반으로 정리한 초기 분류·소개이므로, 편집 과정에서 조정할 수 있습니다. 본문·힌트·활동·에세이를 검색 대상으로 전송하지 않습니다.

## 에세이와 사고놀이 읽기 화면

- 에세이는 MDX를 유지합니다. frontmatter의 선택 필드 `subtitle`로 부제를 지정할 수 있으며, 없는 부제나 질문은 생성하지 않습니다.
- 본문 첫 H1이 frontmatter 제목과 같을 때만 렌더링 단계에서 생략합니다. 서로 다른 제목과 본문은 보존하며, 본문 소제목은 화면의 H1 아래 위계로 정리합니다.
- 공식 `@astrojs/markdown-remark` 처리기와 `remark-cjk-friendly` 확장으로 한글·괄호·인용 부호에 붙은 강조 문법을 처리합니다. 코드·이스케이프된 별표는 그대로 둡니다.
- `src/plugins/rehype-essay-layout.mjs`는 에세이의 참고자료·질문 제목 아래를 별도 section으로 감쌉니다. 질문 제목은 `질문`, `함께 생각`, `생각해 보`를, 참고자료 제목은 `참고`, `References`를 기준으로 인식합니다. 본문에 섞인 수사적 질문을 임의 추출하지 않습니다.
- `harvardPlay`의 기존 `{ title, desc }` 구조를 유지합니다. `N단계 [제목]: 목표`로 명시된 줄만 단계 카드로 나누며, 물음표가 있는 원문 단락은 질문·대화 영역으로 표시합니다. 단계가 없는 활동에 새 단계를 만들지 않습니다.
- 참고자료라는 제목의 활동은 별도 영역에 표시합니다. JSON의 목록과 강조도 빌드 시 Markdown으로 렌더링합니다. 이 처리기는 저장소에서 관리하는 콘텐츠용이며 사용자 입력 HTML을 받는 API가 아닙니다.
- `src/styles/reading.css`는 `.reading-paper` 내부 읽기 화면에만 적용합니다. 동화책 뷰어의 스타일·구조는 유지합니다.

## 콘텐츠 제작 원본

제작용 Master Draft는 출판 컬렉션과 분리된 `content-authoring/`에 둡니다. 최소 필드, 장면 ID, 상태·버전, 검증 명령, 향후 변환기 계약은 [Master Draft 안내](docs/master-draft.md)를 참고하세요. 예시는 제작 중인 초안이며 서재에 자동 등록되지 않습니다.

## 출판 전 점검과 후속 변환기

새 책 등록 후 `npm test`, `npm run check`, `npm run content:check`, `npm run build`를 모두 실행합니다. 에세이는 선택이며 연결한 경우 책당 한 편이어야 합니다. 표지도 선택이나 지정된 경로는 유효해야 합니다. 이미지 검사 지원 형식은 JPEG/PNG/WebP/GIF/AVIF입니다. `content:check`는 전체 Astro 스키마 검사나 학술 검수·출판 승인을 대신하지 않습니다.

Master Draft는 `npm run draft:check -- <원본.json>`으로 미완성 형식을 검사하고, 출판 검토 시 `npm run draft:check -- --publication <원본.json>`으로 ready·필수 원문·실제 public 이미지까지 검사합니다. 저장소 루트에서 실행하며 이미지 경로는 원본 파일 옆이 아닌 `public/`을 기준으로 합니다.

[점검 결과와 수동 검수 항목](docs/publication-audit.md), [다음 PR의 변환기 설계](docs/publication-adapter-plan.md)를 참고하세요. 이번 변경에 변환기·자동 파일 생성·자동 출판은 포함되지 않습니다.
