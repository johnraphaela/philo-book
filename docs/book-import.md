# 폴더로 도서 등록

현재 작업 브랜치에서 실행합니다. 기존 Master Draft/Handoff 명령은 그대로 사용할 수 있습니다.

```text
book-imports/ep06/
  manuscript.md   # 또는 UTF-8 manuscript.txt, 원고는 정확히 하나
  page1.png
  ...
  page12.png
```

이미지는 PNG, JPG/JPEG, WebP를 혼합할 수 있습니다. 로컬 복사나 GitHub Desktop으로 추가하세요. ZIP/채팅 업로드는 필요 없습니다. `book-imports`는 public 밖의 원본 보관 폴더이며 사이트에 복사되지 않습니다. 다른 로컬 폴더의 절대/상대 경로도 가능합니다.

```sh
npm run book:import -- --input book-imports/ep06
```

GitHub에 커밋한 입력도 **사용자가 지정한 브랜치를 로컬에서 체크아웃한 뒤**, 같은 명령을 실행합니다. 명령은 현재 체크아웃/로컬 폴더만 읽으며 fetch, checkout, 다른 브랜치 탐색을 하지 않습니다. 미커밋 파일도 읽습니다. 원격 URL을 --input으로 받지는 않습니다.

Book ID는 원문대로 `sourceBookId`와 원본 원고에 보존합니다. URL에 사용할 수 없는 ID는 `--slug ep06`를 추가하세요. 기존 등록 결과가 달라지면 `--update ep06`처럼 **대상 URL slug**를 명시해야 합니다. 동일 결과의 재실행은 변경 없음입니다. 기존 수동 등록 책/이미지와 충돌하면 다른 slug를 요구하며 자동 대체하지 않습니다.

## 원고 라벨

섹션 제목은 Metadata, Story, Parent Essay, Harvard Play, Illustration Guide, References입니다. 일반 라벨, Markdown 제목(`#`~`######`), 굵은 라벨을 지원합니다. 필드는 `Text: 내용` 또는 `Text:` 다음 줄에 내용을 적습니다. 빈 줄·CRLF·일반적인 라벨 공백을 허용합니다. 본문 내부 문장/문단/목록은 변환하거나 재작성하지 않습니다. 필드 경계의 빈 공백만 정리하며 원본 파일 바이트도 별도 보관합니다.

- Metadata: Book ID, Title, Theme, Age Groups, Categories, Summary
- Story: `Scene 01`부터 연속된 번호. 각 장면에 Text, Parent Teaching Point, Parent Interaction 필수. English는 있을 때 보존
- Parent Essay: Title, Tags, Body
- Harvard Play: Parent Guide, Conversation, Activities
- Illustration Guide: Character Bible, Common Art Style, Image Prompts
- References: 뒤의 전체 본문

Age Groups, Categories, Tags는 쉼표 구분, 한 줄에 하나씩 쓰는 목록, JSON 문자열 배열을 허용합니다. 다른 필드의 목록은 그대로 보존합니다. 위 섹션/필드와 같은 독립 라벨 줄은 경계로 사용되므로, 본문에서 같은 경계 라벨을 내용으로 사용하면 모호성 오류가 날 수 있습니다. 알 수 없는 서식은 자동 추측하지 않습니다. 누락/중복/라벨 밖 텍스트는 위치/이유를 표시하고 중단합니다. 실제 원고가 준비되면 해당 파일로 보존 검증을 추가해야 합니다.

## 생성과 검사

입력 확인 → 파싱 → 번호별 이미지 연결 → 임시 사이트 생성 → 기존 content:check → 기존 Astro check → 기존 Astro build → 검증된 파일 반영 순서입니다. 각 검사는 한 번 실행합니다. 공통 표지/장면 이미지는 한 번만 디코딩합니다. 실패하면 기존 출판 파일을 바꾸지 않습니다. 반영 오류에는 대상 파일 백업을 복원하며, 검사 중 대상 파일 변경도 감지합니다. 실행은 한 번에 하나씩 하세요.

- 도서: `src/content/books/<slug>.json`
- 에세이: `src/content/essays/<slug>.md` (기존 MDX도 계속 지원)
- 이미지: `public/images/<slug>/page번호.확장자` (원본 바이트 그대로)
- 비공개 원본·파싱 결과·재실행 기록: `content-authoring/imports/<slug>/`

장면 수는 원고 기준입니다. 숫자로만 매칭하며 page1/page01 또는 확장자가 다른 동일 번호는 중복 오류입니다. 표지는 page1이며 기존 수동 등록 책의 표지는 바꾸지 않습니다. 기존 이미지 최적화 파이프라인이나 등록 해상도 제한은 없어, 크기/비율 차이는 각 이미지의 실제 수치로 경고만 합니다. 새 뷰어 이미지는 contain으로 표시하여 자르지 않습니다.

기술 검사는 파일/연결/형식/빌드만 확인합니다. 문헌 사실성·문학성·놀이 적합성을 승인하지 않으며 Review Report를 만들지 않습니다.

## 미리보기

입력 파일이 있는 **실제 작업 브랜치**에서 등록 후 실행합니다. main으로 이동할 필요가 없습니다.

```sh
npm run dev -- --background
```

기본 URL: http://localhost:4321/ , 도서 URL: http://localhost:4321/book/<slug>/ . 포트가 사용 중이면 Astro 로그에 출력된 URL을 확인하세요. 서버 관리: `npm run astro -- dev status`, `npm run astro -- dev stop`.
