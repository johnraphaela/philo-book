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
