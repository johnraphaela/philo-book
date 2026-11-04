# PHILO-PAIRING 콘텐츠 분류 체계 (Phase 1)

## 목적
부모는 아이와 나누고 싶은 **생활 속 질문**으로 책을 찾고, 제작자는 하나의 이야기에서 **철학적 탐구와 부모의 성찰**을 설계한다. 일반 서점의 넓은 주제와 철학 전문 용어를 그대로 혼합하지 않는다.

## 8대 대분류
| ID | 사용자에게 보일 이름 | 콘텐츠 제작의 초점 |
| --- | --- | --- |
| emotions | 마음과 감정 | 감정을 알아차리고 표현 |
| identity | 나와 정체성 | 나다움과 자기 가치 |
| relationships | 관계와 공감 | 우정, 공감, 갈등, 경계 |
| ethics | 윤리와 선택 | 공정함, 정직, 규칙, 책임 |
| thinking | 질문과 사고 | 근거, 관점, 추론, 정보 판단 |
| growth | 성장과 도전 | 희망, 실수, 도전, 변화 |
| world | 세상과 공존 | 자연, 다양성, 공동체 |
| meaning | 삶과 의미 | 행복, 시간, 사랑, 존재 |

단일 책에는 **대표 분류 하나**(`primaryCategory`), **세부 주제 여러 개**(`subtopics`), 아이와 함께 탐구할 **열린 질문 하나**(`coreQuestion`)를 권장한다. 세부 주제는 `src/lib/taxonomy.ts`에 등록된 안정적인 ID를 사용한다. 추후 필요하면 다른 대분류의 세부 주제를 보조 태그로 함께 선택할 수 있다.

## 기존 5권의 초기 배치
| ID | 대표 분류 | 세부 주제 | 핵심 질문 |
| --- | --- | --- | --- |
| ep01-robot-mong | identity | personal-change, self-continuity | 몸의 모든 부품이 바뀌어도 몽은 여전히 몽일까? |
| ep02-self-esteem | identity | self-worth, recognition | 아무도 나를 알아주지 않아도 나의 가치는 그대로일까? |
| ep03-hope | growth | hope, agency | 희망은 기다리는 마음일까, 직접 움직이는 행동일까? |
| pico-silver-feather | identity | comparison, individuality | 남보다 잘해야만 내 날개가 멋진 걸까? |
| ep05 | ethics | fairness, rules | 모두에게 공정한 놀이터는 어떻게 만들 수 있을까? |

## 콘텐츠 제작 원칙
1. **아이의 경험에서 출발**한다. 갈등과 이야기가 먼저이며 철학자는 부모의 이해를 위한 참고다.
2. `coreQuestion`은 한 가지 교훈을 강요하지 않고, 다양한 답과 이유가 가능해야 한다.
3. 부모 콘텐츠에는 아이를 지도하는 설명뿐 아니라 **부모 자신의 관점을 돌아보는 질문**을 포함한다.
4. 철학자의 원전, 현대적 재해석, 아동 발달·과학적 주장, 저자의 창작 비유를 구분해 검수한다.
5. 한 권의 대표 분류는 하나만 두며, 여러 영역에 걸친 내용은 세부 태그로 표시한다.

## 이 PR의 변경 범위
- `primaryCategory`, `subtopics`, `coreQuestion`을 **선택 필드**로 추가한다.
- 기존 5권에 해당 필드만 추가한다.
- 기존 `categories`, `topics`, `theme`, `summary`, `pages`, `harvardPlay`, 에세이, 이미지 및 공개 URL은 변경하지 않는다.
- 기존 서재는 여전히 옛 `categories`로 탐색한다. 새 카테고리 필터·카드 표시·홈 화면은 **다음 PR**에서 진행한다.
- 책이 없는 대분류는 초기 서재에 표시하지 않으며, 새로운 책은 분류 기준을 검수한 뒤 등록한다.

## 새 책 작성 예시
```json
{
  "primaryCategory": "ethics",
  "subtopics": ["fairness", "rules"],
  "coreQuestion": "모두에게 공정한 놀이터는 어떻게 만들 수 있을까?"
}
```

제작 지침/Gemini 원고 양식과 `book:import`에도 해당 메타데이터를 전달하는 기능은 후속 작업이다. 현재 import 명령은 이 신규 필드를 자동 생성하지 않는다.
