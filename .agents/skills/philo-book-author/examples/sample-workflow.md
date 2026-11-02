# Codex 사용과 단계별 승인 예시

이 문서는 호출 예시다. 아래 요청을 한 번에 실행하지 않는다. 샘플의 모든 영역은 저장 모양을 설명하는 미승인 자료이며 실제 연구·편집 승인 이력이 아니다.

## 탐색·활성화

프로젝트를 연 Codex에서 `.agents/skills/philo-book-author/SKILL.md`가 있는 브랜치를 사용한다. Skill이 보이지 않으면 저장소 루트에서 새 세션을 열고 Skill 목록/선택에서 확인한다. 세션에 추가되기 전까지 로드됐다고 가정하지 않는다.

```text
$philo-book-author research
변화와 정체성을 주제로 5–7세 그림책을 준비하고 있어.
src/content/essays/ep01-robot-mong.mdx를 먼저 읽고,
접근 가능한 원전·발달 연구가 있으면 찾아 Research Brief만 제안해줘.
새 원본 ID는 little-stone이야. 기존 출판 파일은 수정하지 마.
```

기대: `extensions.research`만 포함한 후보를 제시하고 정지한다. 외부 검색 도구가 없으면 접근 한계를 적는다. 파일이 없는 환경에서는 로컬 파일을 읽었다고 하지 않는다.

## 참고문헌 기반 기획 예시

샘플은 실제 저장소 에세이 「어제와 다른 세포로 출근하는 당신에게」의 제목·본문을 읽고 '테세우스의 배'와 변화의 연결을 확인한 예다. 이 **로컬 문서 확인**은 철학 원전이나 에세이의 생물학적 수치 검증을 뜻하지 않는다. 해당 수치를 기획의 실증 근거로 사용하지 않는다.

추가 연구는 '아동의 관점 전환과 대화 연구'라는 **탐색 주제**로만 `suggested` 처리했다. 존재하지 않는 논문·저자·연도·DOI를 만들지 않았다. 비교할 검증 문헌이 부족하므로 상충 견해를 억지로 채우지 않는다.

이 입력으로 두 기획 방향을 제안할 수 있다.

- **관찰의 이야기:** 작은 돌과 흐르는 물을 대비하며 변화와 멈춤을 바라본다.
- **역할의 이야기:** 같은 돌의 쓰임이 바뀔 때 정체성도 달라지는지 탐색한다.

두 방향은 창작적 해석이며 원전이 주장한 교육 효과가 아니다. 사용자가 선택하기 전 하나를 확정하거나 본문을 작성하지 않는다.

```text
research 후보를 승인하고 원본에 반영해줘. 다음 단계는 아직 하지 마.
```

승인된 후보만 반영하고 정지한다.

```text
$philo-book-author plan
승인된 Research Brief를 바탕으로 위 두 방향의 기획안을 제시해줘.
장면 수는 아직 정하지 말고 원고는 쓰지 마.
```

기획 후보 제안 → 검증 → 선택·승인 대기. story까지 실행하지 않는다.

```text
첫 기획안을 승인해. 반영한 뒤 story 모드로 stone-sees-river 장면만 제안해줘.
```

이 요청은 선택·반영과 다음 모드를 명시했다. 승인된 기획을 반영한 뒤 선택 장면의 원고 후보까지만 만든다. 기존 ID와 타 장면은 보존한다.

## 나머지 모드의 독립 호출

```text
$philo-book-author essay
사용자가 제공한 승인 동화만으로 부모·교사용 에세이를 제안해줘.
제공하지 않은 문헌의 직접 인용은 제외하고, story는 수정하지 마.
```

```text
$philo-book-author play
선택한 동화와 에세이를 바탕으로 관점 바꾸기 활동 하나를 제안해줘.
단계 수는 고정하지 말고 창작 활동과 검증된 원리를 구분해줘.
```

```text
$philo-book-author illustration
stone-sees-river 장면을 위한 Character Bible과 Style Guide부터 제안해줘.
```

시각 설정 후보를 승인받은 뒤 다시 요청해야 선택 장면의 프롬프트를 작성한다. 실제 이미지 생성·경로 부여는 하지 않는다.

```text
$philo-book-author revise
little-stone의 essay.body 마지막 문단만 더 쉽게 고쳐줘.
나머지 본문과 다른 영역, 승인된 장면 ID는 그대로 두고 후보를 보여줘.
```

원본을 유지하고 후보의 선택 문단만 수정한다. `/essay/body` 검사에 더해 텍스트 diff로 문단 밖 보존을 확인한다. 대상 문단이 모호하면 먼저 확인한다.

## 예시 검증

```sh
npm run draft:check -- .agents/skills/philo-book-author/assets/authoring-template.json
npm run draft:check -- .agents/skills/philo-book-author/examples/sample-draft.json
npm run draft:check -- .agents/skills/philo-book-author/examples/sample-revise.json
node --experimental-strip-types .agents/skills/philo-book-author/scripts/review-candidate.ts \
  .agents/skills/philo-book-author/examples/sample-draft.json \
  .agents/skills/philo-book-author/examples/sample-revise.json /essay/body
```

마지막 명령은 changedPaths가 `/essay/body` 하나이고 errors가 비어 있어야 한다. 정본 반영이나 승인을 수행하는 명령은 아니다.

## STEP 3 연결

Skill이 제안하고 사람이 승인한 Master Draft v1은 기존 `PublicationAdapter<AstroArtifacts>`의 입력 후보가 된다. STEP 3에서는 명시적 매핑, 미지원 extensions 처리, 누락·유실 진단, 파일 충돌 방지, 차이 미리보기를 구현한다. 이번 Skill은 convert를 구현하지 않으며 ready나 검증 성공을 자동 공개로 연결하지 않는다.
