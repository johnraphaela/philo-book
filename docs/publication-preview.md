# Master Draft → Astro dry-run

`draft:preview`는 출판 후보의 JSON/MDX 문자열과 예상 파일 경로를 stdout JSON으로 보여 주는 읽기 전용 명령이다. 파일·이미지를 만들거나 덮어쓰지 않으며, 원고 교정·자동 등록·자동 출판을 수행하지 않는다.

## 사용

저장소 루트에서 실행한다. 원본은 v1의 `ready`여야 하며 장면 본문·이미지, 필수 메타데이터, 에세이가 있으면 제목·태그·본문이 명시되어야 한다.

```sh
npm run draft:preview -- path/to/ready-master-draft.json
npm run draft:preview -- first.json second.json
npm run draft:preview -- ready.json --options publication-options.json
```

`--options`는 단일 원본일 때만 지원한다. 파일 경로는 현재 작업 디렉터리 기준이며 이미지 경로는 저장소 `public/` 기준이다. npm의 안내 줄 없이 순수 JSON이 필요하면 다음과 같이 실행한다.

```sh
node --experimental-strip-types content-authoring/preview.ts ready.json
```

현재 저장소의 예시는 미완성 draft이며 EP03도 최초 제작 draft 상태를 보존하므로 그대로 preview하면 종료 코드 1이 정상이다. 테스트는 별도의 완전한 ready 원본과 임시 public 이미지를 생성해 정상 경로를 검증한다. 실제 원고를 테스트 목적으로 ready로 변경하지 않는다.

선택 설정 예시:

```json
{
  "essayId": "parent-guide",
  "cover": { "mode": "scene", "sceneId": "opening" },
  "order": 4,
  "recommendedAge": { "min": 5, "max": 7 },
  "topics": ["identity"]
}
```

별도 표지는 `"cover": { "mode": "asset", "assetPath": "/images/new-book/cover.png" }`로 지정한다. 표지·순서·연령·주제는 없는 값을 추론하지 않는다. 원고의 id를 파일 ID와 bookId로 사용하고, essayId는 에세이 파일명만 지정한다. 모르는 설정 키·잘못된 ID·없는 표지 장면은 실패한다. 설정 생략 시 선택 필드를 출력하지 않으며 Astro의 기존 렌더 기본값은 그대로 적용된다.

## 결과와 실패

성공은 `ok: true, dryRun: true`와 다음 값을 반환한다.

- `files`: `relativePath`, UTF-8 `content`, 출력 `sha256`, 원본 `sourceHash`, `action`(`add` 또는 `noop`). content는 추가될 파일의 전체 변경 미리보기다.
- `sources`: 콘텐츠 ID, 원본 문자열 SHA-256, 안정 장면 ID→페이지 인덱스 대응, 출판 제외 필드의 경로 목록. 제작용 프롬프트·extensions 등은 원본에 그대로 남는다.
- `diagnostics`: 제작 전용/미지원 확장 필드·UI 분할 마커의 검토 경고. 경고 없는 것과 편집 승인 완료는 다르다.

오류가 하나라도 있으면 `ok: false`, 진단만 반환하고 전체 배치를 실패시킨다(종료 코드 1). 파일 후보도 성공 산출물로 반환하지 않는다. 충돌 진단은 경로와 기존/예상 해시를 보여 준다. 갱신/덮어쓰기 옵션은 없다.

- 실제 public 이미지의 경로·존재·디코딩·형식을 확인하고, 현재 출판 컬렉션의 오류도 차단한다. 별도 제작 패키지의 pending 이미지를 복사하거나 경로를 자동 보정하지 않는다.
- 같은 ID의 여러 입력, 같은 에세이 출력명, 기존 파일과의 대소문자 충돌, 다른 파일명의 동일 bookId 에세이를 거부한다. 기존 파일은 **바이트까지 동일할 때만** noop이다. 의미만 같거나 수동 편집된 기존 파일은 자동 정규화하지 않는다.
- 출력 디렉터리/public의 symlink와 기존 콘텐츠 파일 symlink를 거부한다. 이미지 경로에는 별도 안전 경로 검사를 적용한다. 파일 생성 기능이 없어 부분 쓰기가 없다.
- `steps`/`references`에 실제 내용이 있는 활동은 `mapping-required` 오류다. 현재 description만 보존하는 정책으로 구조화 원문을 삭제하지 않는다.
- 외부 에세이는 **MDX로 파싱 가능한 Markdown**만 지원한다. import/export, JSX/HTML, JavaScript 표현식은 AST 검사로 거부한 후 컴파일하며, 생성 코드는 실행하지 않는다. 코드 펜스·이스케이프된 예시는 본문 그대로 보존한다. 일반 Markdown의 꺾쇠/중괄호가 MDX 문법으로 읽히면 원본을 자동 escape하지 않고 진단한다. JSX를 사용하는 기존 출판 원고에는 이 변환기를 자동 적용하지 않는다.

## 보존과 검증 범위

`convertAstroDraft`는 메모리에서 명시 필드만 매핑한다. 장면 순서와 sceneId 이미지 연결, 본문·힌트·alt·에세이·활동의 공백/CRLF/한글/이모지/중복 문장을 보존한다. JSON과 YAML escape는 serializer가 처리하며 역파싱 후 원문 문자열과 일치해야 한다. 에세이 body는 frontmatter 닫힘 개행 직후 그대로 이어 쓴다. 구조 마커·번호를 만들거나 Essay/Play 간에 문장을 이동하지 않는다.

Astro와 변환기는 `src/lib/content-schema.ts`의 같은 책/에세이 스키마를 사용한다. 기존 스키마의 필드·기본값·제약과 glob은 보존한다. 순수 변환은 실제 자산을 확인할 수 없어 `asset-unverified` 경고가 남고, plan 계층은 실제 public 파일 검사로 이를 대체한다.

원본 `sourceHash`는 읽어 들인 UTF-8 JSON 문자열의 해시이며 JSON 재직렬화에 따라 달라진다. `sha256`은 정확한 예상 출력 바이트의 해시다. 이 결과는 검사 시점 스냅샷이다. 이후 파일 쓰기를 구현할 때에는 원본·기존 대상·이미지를 다시 확인해야 한다.

회귀 검증:

```sh
npm test
npm run content:check
ASTRO_TELEMETRY_DISABLED=1 npm run check
ASTRO_TELEMETRY_DISABLED=1 npm run build
```

새 테스트는 원문 불변성·문장/개행·YAML 왕복·배치 충돌·실제 이미지·symlink·MDX 코드 차단·CLI 읽기 전용·기존 EP03 보호를 다룬다. 기존 사이트 빌드는 보존되며, 별도 `draft:site` 명령은 임시 사이트 사본에 후보를 적용해 실제 Astro check/build를 수행한다. [격리 사이트 미리보기](isolated-site-preview.md)를 참고한다.

## 다음 구현 경계

Handoff manifest와 출판 자산의 통합 매핑, 구조화 활동의 승인된 직렬화, 기존 수동 편집의 명시적 대응표, 예상 해시 기반 갱신과 트랜잭션 파일 쓰기는 후속 단계다. 격리 사이트 빌드와 로컬 화면 미리보기는 `draft:site`로 제공한다. 이 dry-run은 학술 사실·연령 적합성·활동 안전성·출판 승인을 판단하지 않는다. 기존 EP03는 원본과 출판 편집이 달라 재출력 충돌로 보호한다.

검증 기록: 테스트 61개 통과, content:check 통과, Astro 진단 0건, 4 routes 빌드 성공. 별도 작업 트리의 EP02 자산 수정 시점과 dist 46개를 비교하여, 경로에 따라 생성되는 세 책의 Astro island uid 외에는 출력이 동일함을 확인했다. ready CLI는 종료 0, 미완성 예시 CLI는 종료 1을 확인했다.
