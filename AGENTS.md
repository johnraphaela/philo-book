## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Content import compatibility

그림책 콘텐츠 스키마·분류·등록 형식을 변경할 때는 `docs/gemini-skill/SKILL.md`와 `docs/gemini-skill/references/ep04-example.md`의 호환성을 함께 확인한다. Skill 동작·출력 규격이 실제 변경되면 버전과 CHANGELOG를 갱신하며, 코드만 바뀌고 Skill 내용이 같으면 버전을 올리지 않는다. 기존 출판 원고·이미지·승인 기록·해시는 변경하지 않는다. Gemini Skill 적용은 사용자가 main의 확정 버전을 수동 반영한다.

## Illustrator Skill compatibility

이미지 생성·검수 규칙을 변경할 때는 `docs/illustrator-skill/SKILL.md`를 확인한다. Illustrator Skill의 실제 동작·출력 규칙이 바뀌면 Author Skill과 독립적으로 버전과 `docs/illustrator-skill/CHANGELOG.md`를 함께 갱신한다. 이미지 프롬프트 데이터 구조를 바꿀 때는 Author Skill과 Illustrator Skill의 입력·출력 호환성을 확인한다. 기존 출판 원고와 이미지 자산은 사용자의 명시적 요청 없이 변경하지 않는다. 두 Skill은 GitHub의 main에 병합된 버전을 기준으로 사용하며 Gemini에 실제 반영하는 작업은 사용자가 수동으로 수행한다.

## Reviewer Skill compatibility

그림책 제작 규격을 변경할 때는 `docs/reviewer-skill/SKILL.md`의 검수 규칙과 호환성을 확인한다. Reviewer Skill 변경 시 독립 버전과 `docs/reviewer-skill/CHANGELOG.md`를 함께 갱신한다. Reviewer의 진단·검수 기준은 Author의 제작·수정 및 Illustrator의 이미지 생성·시각 검수와 분리하며 기존 출판 원고·이미지·승인 기록을 임의로 수정하지 않는다. main의 확정 지침을 Gemini·ChatGPT에 적용하는 작업은 사용자가 수동으로 수행한다.
