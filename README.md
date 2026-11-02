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
npm run build
```

`check`는 Astro·TypeScript 진단, `test`는 책과 에세이 연결 규칙, `build`는 콘텐츠 스키마와 정적 페이지 생성을 검증합니다. 테스트는 별도 프로세스 없이 Node 내장 러너로 실행됩니다. 이미지 파일 누락은 현재 빌드를 막지 않습니다.

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

두 번째 책의 그림은 업로드 예정입니다. 기존 `/images/epXX/*.jpeg` 경로는 보존했으며 이미지 로드 실패 시 준비 안내가 표시됩니다. 실제 파일 업로드 시 JSON의 경로·확장자와 일치시켜 주세요. 이 안내는 JavaScript 활성화 후 표시됩니다.

## 다음 우선순위

1. 이 구조에서 책 추가 흐름을 유지하고 콘텐츠 검증을 강화합니다.
2. 표지·소개·명시적 정렬과 연령·주제 분류 기준을 추가한 뒤 검색·필터를 구현합니다.
3. 철학 질문과 교육 활동의 독립 컬렉션은 여러 책에서 재사용할 필요가 생길 때 도입합니다.

현재 색상·카드·책 상세 URL·본문·이미지 경로를 유지합니다. 전체 React 앱 전환이나 데이터베이스 도입은 현재 단계에 필요하지 않습니다.
