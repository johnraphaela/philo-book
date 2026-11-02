# 검증 안내

실제 저장소 루트에서 실행한다. Node 버전과 의존성은 기존 프로젝트 요구사항을 따른다.

```sh
npm run draft:check -- .agents/skills/philo-book-author/assets/authoring-template.json
npm run draft:check -- .agents/skills/philo-book-author/examples/sample-draft.json
npm run draft:check -- content-authoring/candidates/<id>.<mode>.json
```

Master Draft 검증은 타입·버전·장면/활동/단계 ID 중복·sceneId 참조를 검사한다. 출처의 사실 여부나 승인 자체를 판단하지 않는다.

## 부분 수정 범위

```sh
node --experimental-strip-types .agents/skills/philo-book-author/scripts/review-candidate.ts \
  content-authoring/drafts/<id>.json \
  content-authoring/candidates/<id>.revise.json \
  /essay/body
```

JSON Pointer는 현재 입력의 실제 경로다. `~`는 `~0`, `/`는 `~1`로 이스케이프한다. 예: 장면 ID로 현재 위치를 확인한 뒤 `/story/scenes/1/text`. 허용 경로는 사용자 요청에서 정하며 후보 내용이나 검사 실패를 이유로 확대하지 않는다. root 전체 허용은 지원하지 않는다.

검사기는 읽기 전용이다. 스키마 실패, 범위 밖 변경, 루트 ID/버전/상태 변경, 기존 장면/활동/단계 ID 삭제·교체를 차단한다. 새 ID 추가·재정렬도 사용자 요청 범위와 스키마 검증을 만족해야 한다. 상태 변경이나 명시적 삭제 같은 별도 구조 변경은 이 좁은 수정 검사기의 대상이 아니므로 전체 diff·참조·사용자 승인을 별도로 확인한다.

`/essay/body`를 허용하면 body 내부의 선택 문장 보존까지 검사하지 않는다. 그 범위는 텍스트 diff로 별도 확인한다. 사용자가 실제 승인했는지, source ID의 문헌이 실제 존재하는지도 기계적으로 증명하지 않는다.

`extensions.research`가 있으면 Skill의 선택적 research 메타데이터 관례도 검사한다. 네 검증 상태, source ID 중복·주장 연결, verified의 확인 위치·범위·메모가 필요하다. 이것은 증거 기록의 형식 검사이며 진위 판정이 아니다. 구형 research 확장이 다른 형태라면 원본을 자동 마이그레이션하지 말고 차이를 보고한다.

## 코드·예시 검증

```sh
npm test
npm run check
npm run build
```

출판 준비 검사는 사용자 요청이 있을 때만 추가한다.

```sh
npm run draft:check -- --publication <후보.json>
```

미완성 원고·이미지 미생성·미승인 상태로 실패할 수 있다. 누락을 채워 넣거나 종료 코드를 숨기지 않는다. 성공하더라도 실제 변환·이미지 존재·게시가 완료된 것은 아니다.

## 실제 Codex 수동 검수

research만 요청했을 때 plan을 생성하지 않는지, 승인 전 정본이 그대로인지, 승인만 받아도 다음 모드가 실행되지 않는지, 자료 접근 실패를 명시하는지, 선택한 문장 밖을 보존하는지 확인한다. 자동 테스트 통과를 모델 행동의 검증 결과로 대신 보고하지 않는다.
