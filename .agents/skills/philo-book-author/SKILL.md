---
name: philo-book-author
description: Master Draft v1을 사용하는 philo-book의 콘텐츠 제작·검수 Skill. research, plan, story, essay, play, illustration, revise, handoff 모드를 독립 실행한다. 문헌 확인, 승인 전 후보 제안, 범위 제한 수정과 원고 보존이 필요할 때 사용한다. 출판 변환이나 외부 AI API를 실행하지 않는다.
---

# philo-book-author

한국어로 작업한다. 저장소의 기존 제작 원본과 출판 파일을 먼저 구분한다.

## 시작

1. 저장소의 `AGENTS.md`, `content-authoring/schema.ts`, `content-authoring/adapter.ts`, `docs/master-draft.md`를 확인한다. Master Draft v1이 계약의 기준이다. 모르는 버전은 임의 수정하지 않는다.
2. [공통 원칙·승인 흐름](references/common-guide.md)을 읽고 요청 모드의 문서만 추가로 읽는다.
3. 기존 원본·사용자 변경·승인 범위를 확인하고 `모드 / 입력 / 대상 파일 / 수정 범위`를 먼저 알린다. 필요한 값만 질문한다.
4. 후보 작성 → 검증 → 차이·한계 보고 → 사용자 승인 대기 순서로 진행한다. 승인 전에는 후보를 정본에 반영하지 않는다.

## 모드

| 모드 | 참고 문서 | 주요 산출물 |
| --- | --- | --- |
| research | [문헌 조사](references/research-guide.md) | `extensions.research`의 Research Brief |
| plan | [기획](references/planning-guide.md) | 2~3개 접근의 기획안과 장면 개요 |
| story | [동화](references/story-guide.md) | 선택한 `story.scenes` |
| essay | [에세이](references/essay-guide.md) | 독립적인 `essay` 초안 |
| play | [사고놀이](references/play-guide.md) | 선택한 `thinking.activities` |
| illustration | [그림](references/illustration-guide.md) | Character Bible·Style Guide, 선택한 `images` |
| handoff | [제작 패키지·출판 계약](references/handoff.md) | 원고 사본·image-manifest.json·review-report.md와 실제 이미지 목록 |
| revise | [부분 수정 계약](references/stages.md) | 지정 영역만 변경한 후보와 차이 |

기본 제작 순서는 Research → Plan → Story → Essay → Play → Illustration → Review → Handoff이며 필수 파이프라인이 아니다. 사용자가 제공·승인한 입력으로 원하는 모드만 실행한다. 누락된 다른 단계를 대신 생성하지 않는다. 검수는 생성과 분리해 선택 영역만 독립 실행할 수 있다. Review는 별도 생성 모드가 아니라 [편집 검수](references/editorial-review.md)다.

## 검증·보고

- [검증 안내](references/validation.md)에 따라 실제 후보의 원본 스키마와 변경 범위를 검사한다.
- 각 단계의 결과·변경한 ID/필드·근거·미확인 사항·검증 결과를 보고한 뒤 멈춘다. 승인만 받으면 승인된 후보만 반영하며 다음 모드는 실행하지 않는다.
- 모드명과 함께 다음 단계가 명시적으로 요청된 경우에만 이어간다. 이미 받은 승인이나 파일 반영 권한을 반복해서 묻지 않는다.
- `src/content/`, 기존 책·에세이·이미지·UI·출판 스키마를 변경하지 않는다. 변환기·CMS·AI API·실제 이미지 생성·자동 게시를 구현하거나 실행하지 않는다.
- Skill을 사용한 콘텐츠 작성에서 커밋·푸시·PR·배포는 별도 요청 없이는 수행하지 않는다.

## 자료

- [검증 가능한 최소 템플릿](assets/authoring-template.json)
- [전체 사용 예시·참고문헌 기반 기획](examples/sample-workflow.md)
- [저장 형식 예시](examples/sample-draft.json): 실제 승인 이력이 아닌 미승인 샘플
- [읽기 전용 변경 검사](scripts/review-candidate.ts): 사용자 승인·자료 진위를 대신 판단하지 않음

## Gemini → Codex 역할과 전달

Gemini는 문헌 조사·기획·글/그림 제작·수정·Master Draft 정리·handoff를 맡고, ChatGPT 또는 Gemini의 편집 검수는 선택적으로 분리한다. Codex는 전달 파일 검증과 향후 결정적인 TypeScript 출판 변환·이미지 연결·테스트·Vercel Preview·PR을 맡는다. 사용자는 원고/이미지 승인·미리보기 확인·병합/게시를 결정한다. 도구나 연결이 없으면 파일 작성·압축·이미지 생성·업로드·Preview·PR을 완료했다고 보고하지 않는다.

이 Skill의 handoff는 **기존 원고를 바꾸지 않는 전달**이다. 패키지 검증 통과는 내용 검증·승인·출판 가능·배포 완료가 아니다. 실제 변환기는 아직 없으며 [handoff 계약](references/handoff.md)에 후속 입력·출력 및 검증 책임을 정의한다. 현재 Astro의 `대화 N [제목]`, `활동 N [제목]`는 출판 호환 형식일 뿐 Master Draft의 필수 문법이 아니다.

기존 ep03 제작용 Master Draft와 출판 JSON은 편집 상태가 다를 수 있다. 비교 결과를 보고할 뿐 자동 동기화·덮어쓰기하지 않는다. 최신 병합된 구현을 조사해 이미 해결한 기능을 다시 만들지 않는다.
