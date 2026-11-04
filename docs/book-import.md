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

## Phase 4-A 선택 Metadata

기존 6개 필드는 그대로 필수이며 아래 필드는 선택입니다. 지정되지 않은 값을 추측하거나 생성하지 않습니다.

| Markdown 필드 | 도서 JSON | 입력 형식 |
| --- | --- | --- |
| Primary Category | primaryCategory | taxonomy.ts의 대표 분류 ID 하나 |
| Subtopics | subtopics | 세부 주제 ID의 쉼표/줄 목록 또는 JSON 문자열 배열 |
| Core Question | coreQuestion | 앞뒤 공백을 제거한 단일 문자열, 최대 180자 |
| Dialogue Questions | dialogueQuestions | `- 질문`, `* 질문`, `1. 질문` 등의 줄별 목록 또는 JSON 문자열 배열 |
| Parent Reflection Question | parentReflectionQuestion | 앞뒤 공백을 제거한 단일 문자열 |

```text
Primary Category: identity
Subtopics: self-worth, recognition
Core Question: 나의 가치는 무엇일까?
Dialogue Questions:
- 어떤 이유로 그렇게 생각했니?
- 다른 생각도 가능할까?
Parent Reflection Question: 나는 어떤 기준으로 판단할까?
```

이 예시는 입력 형식 설명용이며 기존 책 원고를 변경하지 않습니다. 질문 내부의 쉼표는 구분자가 아닙니다. 후속 질문은 순서대로 저장합니다. 배열은 `[]`도 허용하지만 빈 항목은 거부합니다. 단일 질문의 빈 값, 존재하지 않는 ID, 중복 세부 주제, 모든 질문 필드 사이의 중복 질문은 오류입니다. 질문 중복 판정만 앞뒤/연속 공백을 정규화하며 문장부호나 원문 의미는 수정하지 않습니다. 대표 분류가 제공되면 세부 주제의 그룹도 일치해야 합니다. 기존 Categories는 그대로 저장합니다.

Metadata 안의 새 필드는 Summary 앞뒤 어느 위치에도 쓸 수 있습니다. 기존 섹션 및 Scene 라벨 규칙은 유지합니다. 설명 메모나 주석을 임의의 새 Metadata 라벨로 넣는 형식은 지원하지 않습니다.

`--update`에서 새 필드를 명시하면 교체하고, 생략하면 해당 책에 이미 저장된 값을 보존합니다. 병합한 결과도 동일하게 검증하므로 대표 분류만 바꿔 기존 세부 주제와 충돌하면 오류가 납니다. 빈 문자열은 삭제 요청이 아닙니다. Subtopics/Dialogue Questions는 명시적 `[]`로 비울 수 있습니다. 원고·이미지 및 기존 승인 기록을 수정해서 검증을 우회하지 않습니다.

화면은 유효한 질문 0~1개일 때 이야기 너머의 대화 안내를 인라인으로 펼치며, 서로 다른 질문 2개 이상일 때 단계별 생각 나누기로 연결합니다. 이번 변경은 Markdown 등록 경로에 한정하며 Master Draft JSON 변환 경로와 Gemini Gem 제작 지침은 변경하지 않습니다. 별도로 지정된 Phase4A Gemini 개정 지침·샘플 파일은 이번 작업 환경에 제공되지 않아 그 파일의 실제 서식까지 검증한 것은 아닙니다.

## 서재 카드 문구 권장 기준

새 책은 Metadata의 Theme와 Summary가 PR #30의 공통 카드에 표시됩니다. 제목·추천 연령·태그·4:3 표지와 카드 배치는 기존 구현을 그대로 사용합니다.

- **Theme:** 공백 포함 **20자 이내** 권장. 핵심 주제를 짧게 적습니다.
- **Summary:** **정확히 두 문장**, 공백 포함 **70~110자** 권장.

글자 수는 **카드 표시용 텍스트** 기준입니다. HTML의 일반 공백 표시처럼 줄바꿈·탭·연속 일반 공백은 한 칸으로 접고 앞뒤 일반 공백은 제외합니다. 공백·문장부호를 포함하며 한글 자모 조합과 이모지는 화면의 한 글자 단위(Unicode grapheme)로 셉니다. Metadata 라벨은 세지 않습니다. 카드는 일반 텍스트를 표시하므로 Markdown 강조 기호·역슬래시·HTML 태그를 자동 해석하거나 제거하지 않습니다. `**주제**`는 별표까지 표시·계산됩니다. 기존 책에 별도 서재 문구가 있으면 실제 표시되는 문구를 기준으로 검토합니다.

문장 수는 종결부호(`.`, `?`, `!`, `。`, `？`, `！`)가 있는 명확한 문장만 자동 판별합니다. 따옴표·괄호·말줄임표·소수·영문 약어, 종결부호 누락이나 문장 사이 공백 누락 등으로 한국어 문장 수가 불확실하면 개수를 단정하지 않고 검토 경고를 냅니다. 문학적·문법적 문장 완결성은 사람이 확인하세요.

기준을 벗어나면 **실제 글자 수와 확인할 항목만** 짧게 안내합니다.

```text
경고: Theme 24자: 20자 이내 확인
경고: Summary 65자: 70~110자 확인, 정확히 두 문장 확인(현재 1문장)
경고: Summary 88자: 두 문장 여부 검토(자동 판별 불확실)
```

이 안내는 **권고 경고**이며 길이·문장 수만으로 등록을 중단하지 않습니다. 기존 필수 항목·이미지·충돌·빌드 검사는 계속 적용됩니다. 문장을 자르거나 다시 쓰지 않고, 원본 원고·등록 데이터·기존 책을 일괄 수정하지 않습니다. `--update`나 변경 없는 재등록에서도 해당 책의 표시 문구를 검토합니다.

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
