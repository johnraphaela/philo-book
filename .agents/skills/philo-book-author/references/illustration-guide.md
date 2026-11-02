# illustration — Character Bible과 Style Guide

대상 동화의 실제 scene ID와 캐릭터·장면 내용을 읽는다. 캐릭터/화풍이 미정이면 먼저 시각 설정 후보만 제안하고 승인을 기다린다. 이미 승인된 설정이 있으면 같은 승인을 반복해서 요구하지 않는다.

## 설정

- `extensions.philoBookAuthor.characters`: 캐릭터 ID·이름·외형·색상·의상·표정/행동 특성·불변 특징·허용 변형.
- `extensions.philoBookAuthor.styleGuide`: 공통 화풍·팔레트·세계관·배경 규칙·조명·기본 화면 비율·금지 요소.
- 샘플 외형은 예시이며 실제 책의 확정 설정이 아니다. 원문에 없는 설정은 제안으로 구분한다.

## 장면 프롬프트

선택한 `images` 항목을 sceneId로 찾아 공통 불변 특징 → 장면 행동·감정 → 구도·카메라 시점·조명 → 스타일·비율 → Negative prompt 순서로 작성한다. 같은 캐릭터 설명은 장면마다 재사용하며 색·의상·세계관을 임의 변경하지 않는다.

`images[].prompt/negativePrompt`는 공통 언어로 작성한다. 모델별 문법·seed·옵션은 실제 요청된 경우에만 `images[].extensions.modelHints`에 분리한다. 특정 생성 서비스에 공통 지침을 종속시키지 않는다.

존재하지 않는 sceneId는 오류로 알리고 장면이나 프롬프트를 만들지 않는다. 새 장면에만 이미지 항목을 추가하며 중복 sceneId를 만들지 않는다. 실제 이미지 파일 경로인 assetPath와 alt는 승인된 수정 범위에 없다면 보존한다. 생성하지 않은 이미지·경로·seed를 만들었다고 주장하지 않는다.

캐릭터 설정 변경은 다른 그림에 미치는 영향만 안내하고 타 장면을 자동 재생성하지 않는다. 실제 이미지 생성 API는 실행하지 않는다.
