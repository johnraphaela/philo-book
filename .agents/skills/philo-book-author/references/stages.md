# 단계별 계약

아래 경로만 해당 단계에서 작성한다. 원본의 다른 키·미지의 확장값은 그대로 보존한다. 공유 설정 변경은 별도 사용자 요청이 있을 때만 한다.

| 단계 | 입력 | 허용되는 산출물 |
| --- | --- | --- |
| plan | 철학 주제, 대상 연령, 전달하고 싶은 질문 | `metadata` 중 요청받은 필드, `extensions.philoBookAuthor.plan` |
| story | 승인된 기획, 선택 장면 또는 분량 | `story.scenes`의 요청 장면과 해당 영역의 확장값 |
| essay | 승인된 기획, 부모·교사 독자, 요청한 관점 | `essay`, `extensions.philoBookAuthor.evidence.essay` |
| play | 승인된 기획, 선택 활동, 놀이 맥락 | `thinking.activities`의 요청 활동, `extensions.philoBookAuthor.evidence.play` |
| illustration | 실제 장면 ID, 캐릭터 설정, 그림 방향 | 선택한 `images` 항목의 `prompt/negativePrompt`, `extensions.philoBookAuthor.characters` 중 승인받은 변경 |
| revise | 대상 영역과 장면/활동 ID 또는 명시적 필드 경로, 수정 의도 | 지정된 범위만. 승인된 원문은 후보 파일로 제안 |

실제 승인 기록을 남기는 경우 `extensions.philoBookAuthor.workflow`의 해당 단계 기록만 갱신한다. 전역 `status` 변경은 별도 명시적 요청이 필요하다. 승인=ready 또는 공개가 아니다.

## plan

- 핵심 철학 질문, 가능한 해석, 대상 연령, 갈등과 선택, 결말의 열린 질문, 예상 장면 흐름을 제안한다.
- 계획한 장면 흐름은 `plan.sceneOutline: [{ sceneId, purpose }]`에 둔다. 아직 원고가 아니므로 `story.scenes`에 본문을 넣지 않는다.
- 연령은 사용자가 제시한 값으로 `metadata.ageGroups` 또는 `plan.audience`에 보존한다. 없는 연령·주제를 추측해서 확정하지 않는다.
- 기존 장면이 있으면 그 ID를 사용한다. 순서 변경만으로 ID를 바꾸지 않는다.

## story

- `story.scenes: [{ id, text?, parentHint?, extensions? }]` 구조다. 장면 순서와 대상 연령에 맞춰 원고를 작성한다.
- 승인된 outline의 sceneId를 재사용한다. outline에 없는 장면 추가·삭제나 결말 변경이 필요하면 먼저 변경안을 제시하고 승인을 기다린다.
- 신규 장면에만 새 ID를 부여한다. 이미지 참조가 있는 장면을 삭제하면 참조가 끊기므로 삭제를 자동 실행하지 않는다.
- 에세이·사고놀이·이미지 프롬프트는 함께 수정하지 않는다. 원문 수정으로 다른 영역이 어긋나면 영향만 알린다.

## essay

- `essay: { title?, subtitle?, body?, tags?, extensions? }`에 작성한다.
- 제목은 frontmatter용 `title`에 두고 `body`에 같은 H1을 반복하지 않는다. 본문은 `##` 소제목, 문단, 목록, 인용문을 사용한다.
- 철학 개념→서사와의 연결→부모·교사의 관찰→열린 질문 순서를 기본 제안으로 삼되 원문과 사용자의 목적을 우선한다.
- 직접 인용과 참고문헌 규칙은 evidence.md를 따른다. 다른 영역의 본문은 고치지 않는다.

## play

- `thinking.activities: [{ id, title?, description?, steps?, references?, extensions? }]`를 사용한다.
- 각 단계는 `{ id, title?, goal?, questions?: string[], explanation?, extensions? }`이다. 3단계를 요청하면 관찰·질문·확장 등 맥락에 맞는 구성으로 제안하되 고정된 정답을 강요하지 않는다.
- 단계별 목표, 열린 질문, 진행 설명을 구분한다. 연령·준비물·소요시간 등 실험 필드는 활동 `extensions`에 둔다.
- Harvard 공식 자료에서 확인된 원리와 창작한 놀이를 구분한다. 출처를 확인하지 못하면 '하버드 검증', '뇌 발달 효과 입증' 등으로 표현하지 않는다.
- `references`는 확인된 자료만 사용한다. 미확인 후보는 evidence.play의 pendingSources로 따로 보존한다. 출판용 `desc`로 자동 변환하지 않는다.

## illustration

- illustration.md에 따라 기존 캐릭터의 불변 특징을 먼저 확인한다.
- 선택한 장면의 `images` 항목을 sceneId로 찾는다. 같은 장면에 중복 항목을 만들지 않는다.
- 기존 `assetPath`, `alt`, 타 장면 프롬프트는 보존한다. 대체 텍스트 변경은 실제 이미지와 수정 범위를 확인한 뒤 별도로 요청받아 수행한다.
- 캐릭터 설정이 없으면 후보를 제안하고 승인을 받은 다음 장면 프롬프트를 작성한다. 승인 없이 외형을 확정하거나 나머지 장면 프롬프트를 자동 생성하지 않는다.

## revise

- 영역과 범위가 불명확하면 먼저 확인한다. '더 좋게'라는 요청을 전 원고 재작성으로 해석하지 않는다.
- `story`는 scene ID, `thinking`은 activity/step ID, `images`는 sceneId, `essay`는 본문 소제목 아래 구역 또는 지정 문장을 기준으로 선택한다. 배열 인덱스만으로 대상을 정하지 않는다.
- 에세이의 선택 문장이 여러 곳과 일치하면 사용자에게 구역을 확인한다.
- 대상 밖 데이터·ID·배열 순서·원문 인용·승인값은 보존한다. 불가피한 연쇄 변경은 실행하지 않고 영향과 대안을 제시한다.
- 승인된 내용은 후보 파일에서만 수정한다. 원본과 후보의 차이를 보고하고, 사용자 승인 뒤 명시적으로 적용 요청을 받으면 해당 변경만 원본에 반영한다.
