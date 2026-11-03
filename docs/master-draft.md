# Master Draft 제작 원본 v1

## 기존 구조와 이번 변경의 경계

현재 `src/content/books/*.json`의 `pages`는 그림책 뷰어에, `harvardPlay: [{title, desc}]`는 사고놀이 화면에 전달됩니다. 에세이는 `src/content/essays/*.mdx`이며 frontmatter의 `bookId`로 연결됩니다. 사고놀이의 구조화된 단계는 현재 긴 `desc` 문자열에서 읽습니다.

제작 원본은 `content-authoring/`에 둡니다. 이 폴더는 Astro 컬렉션 glob 경로 밖에 있으므로 예시를 추가해도 서재에 새 책이 생기지 않습니다. 기존 파일의 마이그레이션, UI 수정, `src/content.config.ts` 변경은 없습니다. 자동 생성 Skill·CMS·파일 변환기는 이번 범위에 없습니다.

## 파일 구성

```text
content-authoring/
  schema.ts                     # 타입과 구조·참조 검증
  adapter.ts                    # 출판 어댑터 계약과 필수 원문 검사
  check.ts                      # 읽기 전용 CLI
  examples/seed-and-wind.json    # 새로 작성한 미완성 예시
```

## 최소 원본

```json
{ "schemaVersion": 1, "id": "new-book", "status": "draft" }
```

필수값은 이 세 가지뿐입니다. 작성하기 시작한 장면·활동·단계에는 각각 `id`가 필요합니다. ID는 소문자 영문·숫자·하이픈으로 정하며, 배열 순서나 제목을 바꿔도 ID는 유지합니다. 장면 ID는 책 안에서, 활동 ID는 책 안에서, 단계 ID는 활동 안에서 유일합니다. 콘텐츠 ID는 원본의 안정적 식별자이자 향후 책 파일 ID 후보입니다. 서로 다른 원본 파일 간 콘텐츠 ID 중복 검사는 아직 구현하지 않았습니다.

선택 영역:

| 영역 | 역할 |
| --- | --- |
| `metadata` | 제목·테마·소개·기존 출판용 분류·연령 원문 |
| `story.scenes` | 장면 ID·동화 본문·부모 힌트 |
| `essay` | 제목·부제·Markdown/MDX 본문·태그 |
| `thinking.activities` | 활동 ID·제목·설명·단계·참고자료 |
| `images` | 장면 참조·이미지 프롬프트·네거티브 프롬프트·실제 자산 경로·대체 텍스트 |
| `extensions` | 실험 중인 필드를 보존하는 명시적 확장 공간 |

`images[].sceneId`는 반드시 실제 장면을 참조해야 하며, 현재는 장면당 이미지 항목 하나를 지원합니다. 프롬프트는 이미지 파일 경로가 아닙니다. 생성 후보 이미지를 여러 개 관리하는 구조는 추후 버전에서 검토합니다.

## 버전과 상태

`schemaVersion`은 정수 `1`을 지원합니다. 모르는 버전은 추측하거나 자동 변환하지 않고 실패합니다.

- `draft`: 작성 중. 본문·이미지·에세이가 없어도 구조 검증 가능.
- `review`: 검토 중.
- `ready`: 제작자가 출판 검토 가능하다고 표시한 상태. 자동 공개·승인을 뜻하지 않음.
- `archived`: 보관. 출판 준비 검사에서는 차단.

상태 전환 자동화는 없습니다. `ready`여도 누락 데이터·이미지 파일·에디토리얼 검토·빌드를 확인해야 합니다. 실제 배포 이력은 제작 상태와 별도로 관리해야 합니다.

## 검증

```sh
npm run draft:check -- content-authoring/examples/seed-and-wind.json
npm run draft:check -- --publication content-authoring/examples/seed-and-wind.json
npm test
```

첫 명령은 원본 타입·버전·ID·장면 참조를 검증하며 종료 코드 0입니다. 예시는 의도적으로 미완성이라 두 번째 명령은 누락 본문·분류·이미지·에세이 태그 등의 오류와 프롬프트·실험 필드 경고를 출력하고 종료 코드 1입니다. 잘못된 JSON·버전·파일 경로도 실패합니다. 이 명령은 원본·출판 파일을 쓰지 않습니다. `--publication`은 저장소 루트의 `public/`을 기준으로 실제 이미지 존재·디코딩·경로·확장자와 파일 내용을 추가 검사합니다. 일반 형식 검사는 미완성 상태를 계속 허용합니다.

스키마는 임의 기본값을 채우거나 문자열을 trim하지 않습니다. 필드를 생략한 것과 명시적 빈 배열은 다릅니다. 오타가 데이터 유실로 이어지지 않도록 알 수 없는 키는 거부합니다. 실험값은 `extensions` 안에 넣습니다.

## Astro 연결 계약

`PublicationAdapter<T>`와 `AstroArtifacts`는 향후 변환기가 구현할 인터페이스입니다. 실제 `convert` 구현은 아직 없습니다. 성공 결과는 메모리상의 산출물, 실패 결과는 오류·경고만 반환하며 실패 결과에 출판 데이터를 실을 수 없습니다. 구현 시에도 오류가 하나라도 있으면 성공 결과를 반환해서는 안 됩니다. 파일 쓰기·경로 결정·기존 파일 덮어쓰기·Git 커밋·공개는 별도 승인 흐름으로 분리합니다.

예상 매핑:

| 원본 | 현재 Astro 대상 |
| --- | --- |
| `id` | 책 JSON 파일 ID 및 에세이 `bookId` |
| `metadata.title/theme/categories/ageGroups/summary` | 책의 동일 필드 |
| `story.scenes` 배열 순서 | `pages` 순서 |
| 장면 `text/parentHint` | `pages[].text/hint` |
| 장면 ID로 찾은 이미지 `assetPath/alt` | `pages[].image/imageAlt` |
| `essay.title/subtitle/tags/body` | 에세이 frontmatter와 본문 |
| 활동 `title/description` | `harvardPlay[].title/desc` |

현재 출판 스키마에는 장면 ID·프롬프트·구조화된 단계·별도 참고문헌 필드가 없습니다. 원본에는 그대로 보존하고, 단계와 참고문헌의 문자열 직렬화 정책을 별도로 결정해야 합니다. 제목·분류·연령·태그·이미지 경로를 추론해서 채우지 않습니다. 파일명으로 제목을 만들거나 프롬프트에서 이미지 경로를 생성하지 않습니다.

`inspectAstroDraft`는 현재 필수 원문을 검사하는 사전 점검입니다. 성공적인 변환·출판 검증과 같지 않습니다. 파일 존재·여러 원본 간 ID 충돌·링크·출처 사실 확인·MDX 안전성·빌드는 검사하지 않습니다. 구조화된 활동이 있으면 변환 정책 필요 경고가 남습니다. 순수 `inspectAstroDraft`에는 실제 파일 미확인 경고가 남습니다. CLI `--publication`은 비동기 `inspectDraftPublication`으로 실제 public 이미지 검사를 수행하며 해당 경고를 실제 결과로 대체합니다.

## 확장 방법

1. 가설 단계의 필드는 `extensions`의 이름 붙은 객체에 보관합니다. 예: `extensions.editorial.reviewNotes`.
2. 자주 쓰이는 필드가 안정되면 해당 영역 스키마에 선택 필드로 승격하고 타입·테스트·문서를 함께 추가합니다. 기존 예시도 계속 검증되어야 합니다.
3. 필드 삭제·의미 변경·필수화 등 호환성이 깨지는 변경은 새 버전과 명시적 마이그레이션을 추가합니다. 과거 파일을 읽으면서 덮어쓰지 않습니다.
4. 실제 변환기는 별도 작업에서 구현합니다. 경고 없는 것만 성공으로 간주하지 말고, 누락·유실·파일 충돌을 검증하고 사람이 Preview를 확인한 뒤 출판하도록 합니다.

이 기반은 AI 응답을 검증할 수 있는 타입 경계를 제공할 뿐, AI 호출이나 자동 공개를 수행하지 않습니다.

세부 입력·출력, 표지/메타데이터 타입 차이, 충돌 방지와 문장 보존 정책은 [다음 변환기 설계](publication-adapter-plan.md)를 참고하세요.
