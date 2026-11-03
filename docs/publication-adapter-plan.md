# 다음 PR: Master Draft v1 → Astro 출판 변환기 설계

이 문서는 전체 변환기의 목표 설계다. 현재 순수 필드 변환과 읽기 전용 dry-run을 구현했으며 [출판 미리보기](publication-preview.md)에 실제 지원 범위를 명시했다. 격리된 후보 사이트의 실제 Astro check/build와 로컬 화면 미리보기도 [draft:site](isolated-site-preview.md)로 제공한다. Handoff 통합·편집 매핑·파일 쓰기·갱신은 아직 구현하지 않았다. 기존 `adapter.ts` 계약은 유지하고 선택 서재 메타데이터는 확장된 산출물 타입으로 지원한다.

## 입력과 사전 조건

- 입력은 `unknown` Master Draft와 별도 명시적 대상 설정이다. v1 strict 스키마 → `ready` 및 `inspectAstroDraft` → 실제 자산 검사 순서로 검증한다. ready는 편집 승인과 동의어가 아니다.
- 대상 설정은 저장소 root/public root, 책 ID, 선택적인 에세이 파일 ID, cover 선택(기존 장면 재사용 또는 별도 제공 파일), 선택적인 기존 서재 메타데이터, 충돌 처리 모드, 승인된 구조화 활동 직렬화 정책을 갖는다. 원고에서 없던 값을 추론하지 않는다.
- v1에는 cover/order/recommendedAge/topics의 정식 필드가 없고 `AstroArtifacts.book`에도 없다. 다음 PR에서 선택적 대상 설정과 산출물 타입을 Astro 스키마에 맞춰 확장해야 한다. extensions를 몰래 이 필드로 해석하지 않는다. cover 생략 시 현재 아이콘 fallback을 유지한다.
- 다중 입력 전체의 콘텐츠 ID 중복, 대소문자 충돌, bookId/장면/이미지 참조를 검사한다. 파일명·제목·배열 위치로 기존 ID를 재생성하지 않는다. Handoff manifest의 파일/출판 경로/표지 참조와 실제 자산을 대조하고 pending을 준비 완료로 승격하지 않는다.
- 원본 바이트의 SHA-256과 파싱된 원본을 보관한다. `draft:check`는 형식 검사, `draft:check -- --publication`은 필수 원문과 실제 public 이미지 검사, Handoff 검토는 전달 패키지 검사로 역할이 다르다.

## 산출물과 매핑

| 입력 | 출력 | 보존 조건 |
| --- | --- | --- |
| id | `src/content/books/<id>.json` / essay.bookId | 안정 ID, 경로 검증 |
| metadata | book 동일 필드 | 없는 값 생성 금지 |
| story.scenes 배열 | pages 배열 | 순서 그대로, sceneId로 이미지 연결 |
| scene.text/parentHint | text/hint | 문자열 완전 동등 |
| image.assetPath/alt | image/imageAlt | 경로 자동 보정 금지 |
| essay title/subtitle/tags | YAML frontmatter | 안전한 YAML serializer, 역파싱 동등성 |
| essay.body | frontmatter 다음 본문 | trim/개행/인용/Markdown 수정 금지 |
| thinking title/description | harvardPlay title/desc | 순서·문장·중복까지 보존 |

`convert`는 기존 `ConversionResult<AstroArtifacts>`를 반환하고, 쓰기 계획은 별도 계층의 `{relativePath, bytes, sha256, sourceHash, mappings, diagnostics}` manifest로 만든다. 성공 전 실제 Astro 스키마와 MDX 컴파일을 확인한다. 오류가 하나라도 있으면 artifacts 없이 실패한다. 경고는 의미/출처/미지원 필드를 구체적으로 기록한다.

장면 ID, 프롬프트, negativePrompt, 원본 파일명, 연구·편집 메타데이터와 미지원 extensions는 제작 원본에 유지하고 출판 제외 목록에 기록한다. 출력에 없다는 이유로 원본에서 지우지 않는다. 미지원 구조를 경고만 남기고 삭제해 성공시키지 않는다.

## 문장 및 활동 보존

- 입력 객체를 mutate하지 않는다. 본문 trim, Unicode 정규화, 스마트 인용부호, 요약·중복 제거·문장 교정·임의 번역·번호 재정렬을 하지 않는다. JSON/YAML escape 차이는 역파싱 후 문자열 동등성으로 검사한다. 에세이 본문은 코드 단위 문자열 동등성과 원본 바이트 해시를 함께 검사한다.
- description만 있는 활동은 그대로 출력한다. steps/references가 함께 있으면 중복 관계를 추측하지 않고 `mapping-required`로 차단한다. 사용자가 선택한 직렬화 정책과 각 원문 조각→출력 위치 대응표가 있어야 진행한다.
- 현 UI의 `대화 N [제목]`, `활동 N [제목]`, `마무리:`는 opt-in 제어 문법이다. 원문 자체에 이 문법이 들어 있는 경우 오인 분할을 진단한다. 대화/실천 번호 계열, 원문에 이미 있는 번호, 참고자료 마지막 배치 정책을 명시한다. 번호·구조 마커 변경은 문장 보존과 별도로 diff에 드러내고 승인된 매핑에만 적용한다.
- EP03는 이전 수동 편집에서 에세이 3·4절이 Play로 이동·통합되었다. 현재 v1 초안을 그대로 다시 변환하면 그 편집이 취소된다. 기존 출판본을 자동 재생성하지 말고 기존 대응표 또는 명시적 편집 매핑을 요구한다. 이번 파일럿을 범용 변환 규칙으로 복사하지 않는다.

## 충돌과 쓰기 경계

1. 기본은 dry-run: 예상 경로·추가/수정 diff·원문 대응·검사 결과만 반환한다. 네트워크 호출·Git 커밋·배포는 변환기 책임이 아니다.
2. 출력 ID는 v1 ID 문법으로 제한한다. 경로는 고정된 두 컬렉션 아래에만 생성하고 절대 경로, `..`, URL, symlink 이탈, 대소문자 및 여러 입력의 동일 출력 경로를 차단한다.
3. 기존 파일이 있으면 기본 실패한다. 바이트가 같은 경우 명시적 no-op으로 보고한다. 책뿐 아니라 이름이 다른 에세이의 bookId 중복도 전체 컬렉션에서 검사한다.
4. 갱신 모드는 사용자가 선택한 대상 파일과 예상 기존 해시가 일치할 때만 허용한다. 생성 직전 원본·자산·대상 해시를 재확인하여 동시 변경 시 중단한다. 공유 이미지 덮어쓰기·자동 확장자 변경·main 쓰기는 없다.
5. 임시 디렉터리에 전부 stage → 새 전체 컬렉션 검사·스키마·MDX 컴파일·빌드 → diff 검토 → 파일 적용 순서다. 다중 파일 쓰기는 단일 파일 rename만으로 원자성이 보장되지 않으므로 Git 작업 트리/트랜잭션 manifest와 실패 복구를 설계한다. 검증 실패 시 기존 출판 파일을 보존한다.
6. 외부 MDX는 실행 코드가 될 수 있다. 수신 단계에서 imports/exports/JSX/표현식의 허용 정책을 확정하고, 검증되지 않은 입력을 컴파일/실행하지 않는다. 저장소 내부 MDX 신뢰 모델을 외부 입력에 그대로 적용하지 않는다.

## 구현 순서와 인수 테스트

1. 타입/순수 변환: 완전한 ready fixture의 출력, 문자열·순서·선택 필드·미지원 필드 처리, 입력 불변성, repeatable 결과.
2. 자산/Handoff: missing·깨짐·위장 확장자·경로 이탈·미준비 표지·sceneId 불일치·복수 입력 ID 충돌.
3. 직렬화: 따옴표/콜론/다중 행 YAML, CRLF·한글·이모지·Markdown 목록/강조/인용, 명시적 단계/참고문헌, 중복 번호와 유실 없는 원문 조각 매핑.
4. 쓰기 계획: 기존 책/다른 파일명의 에세이 충돌, no-op, 해시 불일치, symlink, 부분 실패 복구. 실패 시 쓰기 0건.
5. 격리된 전체 사이트에서 Astro check/build 및 렌더 결과를 검증한다. EP01~03는 회귀 기준으로 비교하되 기존 파일에 자동 적용하지 않는다. 사람의 내용·학술·시각 검수와 출판 결정 후 별도 PR로 진행한다.
