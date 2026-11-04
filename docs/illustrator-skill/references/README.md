# Illustrator Skill 입력·출력 안내

[Illustrator Skill](../SKILL.md)은 장면별 이미지 생성·검수·부분 수정을 담당한다. [Author Skill](../../gemini-skill/SKILL.md)은 이야기·부모 콘텐츠·이미지 프롬프트 작성과 최종 Markdown 내보내기를 담당한다. 두 Skill의 버전은 독립적이며 Illustrator가 스토리나 Metadata를 임의로 수정하지 않는다.

## 입력

Author의 최종 Markdown에 있는 `Illustration Guide`를 전달한다.

- `Character Bible`: 캐릭터의 고정 특징
- `Common Art Style`: 공통 화풍과 비율
- `Image Prompts`: `Page 1`부터 `Page N`까지의 장면별 프롬프트

제공된 장면 수와 번호를 유지한다. Story를 함께 제공하지 않으면 원고 일치 검수는 주어진 프롬프트 범위로 제한된다. 실제 입력 구조의 기준은 Author Skill과 Illustrator Skill의 해당 지침이다.

## 출력

- 한 장면당 개별 이미지 하나
- 장면별 품질 검수 상태
- 필요한 장면만 수정한 결과물과 보존한 정상 이미지
- 실제 생성 환경에서 지원하는 파일 형식

파일명은 기본 `page1.jpg`부터 장면 순서대로 관리한다. 실제 PNG/WebP를 확장자만 JPG로 바꾸지 않으며 변환할 수 없으면 실제 형식을 명시한다. 기본 캔버스는 4:3 가로 full-bleed 직사각형이다. 생성·검수·편집·저장·첨부 가능 여부는 실행 환경에 따르며, 미생성 또는 확인 불가 상태를 완료로 표시하지 않는다.

## 기본 사용 예시

Author가 만든 실제 `Illustration Guide` 전체를 붙여넣은 뒤 실행한다. 아래 예시의 번호는 실제 입력과 진행 상태에 맞게 지정한다.

```text
/illustrate
```

제공한 Page들을 순서대로 각각 생성·검수한다. 이 문서의 명령 예시만으로 누락된 프롬프트를 창작하지 않는다.

```text
/fix 4
```

4번 이미지의 문제만 수정하고 정상 이미지는 보존한다. 필요한 경우 실제 이미지와 구체적인 수정사항을 함께 제공한다.

```text
/resume 7
```

완료된 페이지를 보존하고 7번부터 미완료 장면을 이어서 처리한다. 이전 자료에 접근할 수 없으면 해당 한계를 알린다.

## GitHub 기준과 수동 적용

GitHub 관리 경로는 `docs/illustrator-skill/`이며, main에 병합된 [SKILL.md](../SKILL.md)를 단일 기준으로 사용한다. 사용자가 이 파일 전체를 Gemini의 Illustrator Skill에 수동 반영한다. 이 README는 입출력·사용 안내이고 제작 지침을 대신하지 않는다. [변경 이력과 버전 규칙](../CHANGELOG.md)을 함께 확인한다. 자동 동기화나 이미지 생성 기능 구현은 포함하지 않는다.
