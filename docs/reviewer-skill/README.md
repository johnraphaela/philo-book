# Philo-book Reviewer

Author 원고를 독립적으로 검수하는 [공용 지침](SKILL.md)이다. **Author → Reviewer → Illustrator** 흐름에서 진단과 최소 수정 지시안을 제공한다. [변경 이력](CHANGELOG.md)과 버전은 Author·Illustrator와 독립적으로 관리한다.

## Gemini 사용

1. main에 병합된 `docs/reviewer-skill/SKILL.md` 전체를 Reviewer Skill 지침으로 수동 등록한다.
2. Author에서 생성한 원고 `.md`를 제공한다.
3. `/review`를 실행한다.
4. 검수 결과의 `/revise` 프롬프트를 Author에 전달한다.
5. 수정본과 직전 검수 결과를 제공하고 `/recheck`를 실행한다.

## ChatGPT 사용

1. 같은 `docs/reviewer-skill/SKILL.md`를 ChatGPT 프로젝트 지침으로 설정하거나 대화에 첨부하여 이 지침에 따른 검수를 요청한다.
2. Gemini에 제공한 것과 동일한 Author 원고 `.md`를 제공한다.
3. `/review`를 요청한다.
4. 전체 판정·문제 위치·이유를 Gemini 결과와 비교한다. 수정본은 이전 검수 결과와 함께 `/recheck`한다.

명령과 판정 기준은 동일하다. 자동 설치·Skill 호출·파일 작업·출처 접근·코드 실행이나 두 플랫폼의 동일한 실행 환경은 보장하지 않는다. 동일 기준을 사용해도 모델의 실제 판단이 일치하는지는 별도 확인이 필요하다.

## 공통 명령과 판정

| 텍스트 명령 | 용도 |
| --- | --- |
| `/review` | 신규 원고 검수; 중간 원고와 최종 export 구분 |
| `/recheck` | 수정본의 기존 지적 해결 여부·새 회귀 확인 |
| `/prompt` | 최신 검수 결과의 Author용 `/revise` 요청문만 생성 |
| `/check-export` | 최종 Markdown 구조·Metadata·장면·프롬프트 정적 점검 |

PASS는 필수 수정 없음, REVISE는 콘텐츠 수정 권장·필요, BLOCK은 명확한 필수 누락·구조·등록 차단 문제다. 주관적 편집 제안은 BLOCK으로 분류하지 않는다. 결과는 전체 판정, 필수 수정사항, 권장 개선사항, 잘 유지할 요소, Author 수정 프롬프트, 재검수 대상의 6개 항목을 사용한다.

## 역할과 호환성

- 한 권당 하나의 최종 승인 원고를 유지한다.
- [Author](../gemini-skill/SKILL.md)는 제작·수정, Reviewer는 검수를 담당한다. Reviewer가 출판 원고를 직접 덮어쓰거나 승인 없이 확정본을 변경하지 않는다.
- [Illustrator](../illustrator-skill/SKILL.md)는 실제 이미지 생성·시각 검수를 담당한다.
- Codex는 코드·스키마·등록기 기반 기술 검사와 등록을 담당한다. Reviewer의 정적 판정은 실제 import·빌드 성공을 보장하지 않는다.

현재 계약은 [content-schema.ts](../../src/lib/content-schema.ts), [taxonomy.ts](../../src/lib/taxonomy.ts), [import-metadata.ts](../../scripts/import-metadata.ts), [book-import.ts](../../scripts/book-import.ts)를 우선한다. 접근하지 못하면 잠정 검사임을 표시하며 ID·그룹·검증 결과를 추측하지 않는다. 신규 Author의 Core Question 포함 원칙과 등록기의 확장 필드 선택 계약을 구분한다. 실제 이미지·출처·기술 검사는 수행한 범위만 보고한다.

## 실제 플랫폼 확인

Gemini·ChatGPT에 동일 원고를 제공해 네 명령의 처리, 중간 원고의 미작성 섹션을 BLOCK으로 오판하지 않는지, 주관적 제안과 실제 등록 오류를 구분하는지, 수정 후 재검수와 미확인 출처 표기가 일관되는지 확인한다. GitHub 정적 검사만으로 실제 플랫폼 테스트 완료를 뜻하지 않는다.
