# 출판 안정성·품질 점검 (2026-11-03 KST)

기준 main: `91f4bb3eed19e1f6d5a6c09835dd2739cff37427` (PR #15 이후 EP02 이미지 삭제·재업로드 포함). 이 보고서는 발견 사항과 수정 후보이며 출판 원고 수정 승인이 아니다. 이번 PR에서는 UI/CSS/출판 JSON/MDX/이미지/제작 원본을 변경하지 않았다.

## 기존 PR과 배포

| PR | 내용 | GitHub 결과 |
| --- | --- | --- |
| [#1](https://github.com/johnraphaela/philo-book/pull/1) | Ver 0.1 | 닫힘, 미병합 |
| [#2](https://github.com/johnraphaela/philo-book/pull/2) | feat: improve editorial essay and activity reading layouts | 병합 |
| [#3](https://github.com/johnraphaela/philo-book/pull/3) | feat: add versioned master draft authoring foundation | 병합 |
| [#4](https://github.com/johnraphaela/philo-book/pull/4) | feat: add staged philo-book-author Codex skill | 병합 |
| [#5](https://github.com/johnraphaela/philo-book/pull/5) | feat: extend author skill with research and candidate review | 병합 |
| [#6](https://github.com/johnraphaela/philo-book/pull/6) | Add lossless Gemini ep03 Master Draft pilot and isolated preview | 병합 |
| [#7](https://github.com/johnraphaela/philo-book/pull/7) | Register ep03 book and essay in production content collections | 병합 |
| [#8](https://github.com/johnraphaela/philo-book/pull/8) | Fix ep03 shelf cover and move parent dialogue into activities | 병합 |
| [#9](https://github.com/johnraphaela/philo-book/pull/9) | Reorganize ep03 dialogue and practical activities with distinct card … | 병합 |
| [#10](https://github.com/johnraphaela/philo-book/pull/10) | Extend author skill with Gemini handoff contract and read-only packag… | 병합 |
| [#11](https://github.com/johnraphaela/philo-book/pull/11) | test: strengthen handoff validation coverage | 병합 |
| [#12](https://github.com/johnraphaela/philo-book/pull/12) | fix: point ep02 pages to uploaded jpg images | 병합 |
| [#13](https://github.com/johnraphaela/philo-book/pull/13) | fix: add ep02 library cover image | 병합 |
| [#14](https://github.com/johnraphaela/philo-book/pull/14) | content: import full ep01 essay and five play activities | 병합 |
| [#15](https://github.com/johnraphaela/philo-book/pull/15) | fix: preserve Korean words in story viewer wrapping | 병합 |

#1은 merge_commit_sha 값이 있어도 merged=false, merged_at=null이므로 병합으로 집계하지 않는다. #2~#15의 merge commit은 main 이력에서 확인했다.

해당 기준 SHA의 GitHub commit status에서 다음 Vercel 컨텍스트 **6개 모두 success**를 확인했다. 이는 Vercel이 보고한 배포 성공이며 실제 운영 도메인/프로젝트 선택과 브라우저 동작 전체 검증을 뜻하지 않는다. 중복 연결의 의도는 사용자 확인 대상이다. 설정·연결·배포 트리거를 변경하지 않았다.

- [philo-book](https://vercel.com/johnraphaela/philo-book/GH4yKAxJywJbbknYfNsxhhnXAQP8)
- [philo-book-ila5](https://vercel.com/johnraphaela/philo-book-ila5/7rXKVL5DwY39ZC71cr3vM1p6PEvb)
- [philo-book-uvmk](https://vercel.com/johnraphaela/philo-book-uvmk/6rCbh7Pu4DJWaJRou3BAHip65Kg2)
- [philo-book-a5hh](https://vercel.com/johnraphaela/philo-book-a5hh/8d8FZxngZYZkeZxGYZNQcUvGuqy6)
- [philo-book-3q54](https://vercel.com/johnraphaela/philo-book-3q54/HaWKbrUwdkCZTMsf8J3cquAZdTYf)
- [philo-book-tvze](https://vercel.com/johnraphaela/philo-book-tvze/Aw8t7ezQprJ9ZjGNzjqhqtWoeCP8)

## 기반 구조 분석

- Astro는 books JSON과 essays MDX의 직속 파일만 glob으로 읽는다. 책 pages는 최소 1개, text는 min(1)이나 공백 문자열은 기존 스키마에서 허용된다. cover는 선택이며 /images/ prefix만 검사한다. 페이지 image는 일반 문자열이다. 실제 파일 검사와 공백 본문 보완은 이번 독립 검사에서 수행한다.
- `getLibrary → indexEssays`는 파일명이 아닌 bookId로 연결하며 없는 책 참조·책당 복수 에세이는 빌드 오류다. 에세이가 없는 책은 정상이다. 표지 미지정도 아이콘 fallback으로 정상이다.
- Master Draft v1은 strict 스키마, 안정 ID와 장면별 이미지 참조·중복 검사를 제공한다. draft/review는 미완성 저장 가능하다. ready도 실제 이미지·학술 검수·출판 승인을 보증하지 않는다.
- `inspectAstroDraft`는 순수 필수 원문 검사다. `adapter.ts`는 계약만 있고 convert 구현이 없다. 실제 출판 스키마의 선택 서재 메타데이터가 AstroArtifacts에 없고, 표지·구조화 활동·extensions 변환 정책도 미정이다.
- Handoff 검증기는 경로 이탈/일반 파일/빈 파일, manifest 참조·상태 충돌, baseline 바이트 및 연구·presentation 메타데이터를 확인한다. nonempty 파일의 실제 이미지 디코딩을 보증하지 않으며 항상 publicationReady=false다. 패키지 파일과 public에 등록된 자산은 별도 경계다. 이번 변경은 Handoff 계약을 변경하지 않는다.
- 에세이 렌더러는 일치하는 첫 제목만 숨기고 읽기 영역·참고자료/질문을 정리한다. 활동 렌더러는 기존 N단계 문법과 opt-in 대화/활동 마커를 파싱하고 공식 Markdown 처리기로 렌더링한다. 참고자료를 뒤로 배치하며 smartypants=false다.
- 기존 50개 테스트는 관계, 서재, Markdown/CJK, 단계·번호, 파일럿 원문 대응, author/Handoff의 정상·부정 사례를 다룬다. 신규 검사는 디코딩과 실제 파일 경계를 추가한다.

## 콘텐츠 무결성

| 항목 | EP01 | EP02 | EP03 |
| --- | --- | --- | --- |
| 책 ID/에세이 bookId | ep01-robot-mong / 일치 | ep02-self-esteem / 일치 | ep03-hope / 일치 |
| 장면/본문 | 12개, 빈 본문 없음 | 12개, 빈 본문 없음 | 12개, 빈 본문 없음 |
| 표지 | page1.jpg 재사용, 존재 | page1.jpg 재사용, 존재 | page1.jpg 재사용, 존재 |
| 장면 이미지 | 12/12, JPEG, 1024×572 | 12/12, **실제 PNG**, 1254×1254 | 12/12, JPEG, 1024×765 |
| 디코딩 | 모두 성공 | 모두 성공 | 모두 성공 |
| Play 순서/번호 | 한 항목 안 Markdown 놀이 1~5 | 대화 1~3단계 → 참고자료 | 대화 1~2 → 실천 활동 1~2 |
| Essay/Play | 에세이는 철학 해설, 놀이는 Play | 에세이 문학·철학 해설 / 대화는 Play | 출판 에세이는 1·2절, 원본 3·4절은 Play로 이동·통합 |

36개 고유 장면 파일과 표지 3개 참조(모두 장면 1 재사용)를 전부 읽고 Sharp로 픽셀 디코딩했다. 누락 파일·디코딩 불가·공백 페이지/에세이·고아/중복 에세이는 발견하지 못했다. EP02 12개 파일의 확장자 불일치는 cover 재사용을 포함해 **13개 참조 오류**로 진단된다. 브라우저가 내용 sniffing으로 표시할 수 있다는 것과 파일 형식 무결성은 다르다.

활동 파서/Markdown 실행으로 EP01은 h3 제목 5개·strong 9개, EP02는 1/2/3단계와 참고자료 ul, EP03는 대화/활동의 독립 1/2 번호를 확인했다. 기존 원문 보존·CJK·목록 회귀 테스트가 통과했다. EP01은 단계 카드가 없는 일반 Markdown 한 항목이며 이는 현 데이터의 명시 구조다. 제목의 의미·놀이 순서의 교육적 적절성은 사람 검토 사항이다. 이번 작업에서는 새 브라우저 시각 회귀 검수는 수행하지 않았다.

### 제작 원본과 출판본 차이

- EP01/EP02는 별도 제작 Master Draft/수신 원본이 저장소에 없으므로 원고 전체의 무손실 원본 대조를 확정할 수 없다. Git 이력 비교는 가능하다. #14에서 EP01의 짧았던 에세이를 확장하고 Play 1개를 한 desc 안 5가지 놀이로 교체했다. #12에서 EP02 경로를 jpg로, #13에서 표지를 추가했다. 이후 main의 직접 업로드가 EP02 파일 내용을 PNG로 교체했다.
- EP03에는 원본 JSON/MDX, draft 상태 Master Draft와 source hash가 있다. 원본 .jpeg 경로는 extensions.sourceAssetPath에 보존되고 실제 참조는 .jpg다. 출판 cover는 page1.jpg로 추가됐다.
- EP03 Master Draft는 에세이 전체·원래 놀이 2개를 유지한다. 출판본은 #8/#9의 의도된 편집으로 에세이 3·4절을 Play로 이동하고, 기존 놀이와 주제를 통합해 대화/실천 두 영역으로 배열한다. 제목·구조·번호·준비물 표시가 달라졌다. 기존 파일럿 검증은 고유 원문 행/기존 두 놀이 본문의 포함을 확인하지만 출판 파일과 원본의 바이트 동일성을 주장하지 않는다. 반복 횟수까지 완전 보존하는 범용 검증도 아니다.
- 따라서 현 Master Draft를 단순 변환해서 EP03를 덮어쓰면 이미 승인된 배열을 되돌릴 수 있다. 다음 변환기는 이 차이를 충돌로 취급해야 한다.

## 심각도별 문제와 조치 경계

| 심각도 | 발견 사항 | 자동/수동 | 이번 조치 |
| --- | --- | --- | --- |
| 높음 | EP02 jpg 12개의 실제 형식이 PNG | 자동 검사 | 오류 보고. 원고/이미지 변경 없음. 후속 자산 PR에서 실제 JPEG 변환 또는 PNG 경로의 명시적 변경 중 선택 |
| 높음 | EP01 시냅스 폭발·완전 세포 교체·전혀 다른 물질이라는 과학적 단정 | 학술 수동 검수 | 아래 출처와 수정 후보만 제시 |
| 높음 | EP03 제작 원본과 현 출판 편집의 차이를 단순 재출력할 위험 | 설계/원문 대조 | 후속 변환기 충돌·명시적 매핑 정책 문서화 |
| 중간 | EP02 전두엽에 자기만족을 새긴다는 표현과 칭찬→의존의 단정, EP03 놀이의 확정적 효과 | 수동 검수 | 효능 주장과 일반 발달 개념을 분리해 검토 |
| 중간 | 철학자의 원전 요지/직역 인용/저자의 현대적 적용이 혼동될 여지 | 수동 검수 | 원전 위치·번역 판본 확인, 해설임을 표시하는 수정 후보 |
| 중간 | 기존 build만으로 실제 이미지 문제를 차단하지 못함 | 자동 검사 추가 | 명시적 content:check 출판 게이트 제공. 기존 build와 UI는 보존 |
| 낮음 | README의 EP02 이미지 업로드 예정/2권 서술 | 문서 | 현재 3권 및 기존 오류를 명시 |
| 낮음 | 파일럿 README의 초기 원문 동일/에세이 전체라는 설명과 후속 편집 기록이 함께 있어 혼동 가능 | 문서 | 본 보고서에서 최종 상태 구분. 해당 문서는 시점별 이력으로 보존 |
| 낮음 | 일부 참고자료가 포괄적 이름뿐이며 번역본·쪽수·링크 미상 | 수동 서지 검수 | 출처 정밀화 후보, 자동 보충 없음 |

치명적(사이트 빌드 불가/전체 콘텐츠 누락) 문제는 발견하지 못했다. 심각도는 출판 품질 관점이며 위 항목은 자동 수정 승인을 뜻하지 않는다.

## 학술·교육 검토: 출처와 수정 후보 (미적용)

### EP01 뇌 발달·놀이 효과

`books/ep01-robot-mong.json → harvardPlay[0].desc` 놀이 1의 “전두엽 시냅스가 폭발적으로 연결”과 “5번 이상”은 별도 근거가 필요하다. [Harvard Serve & Return 안내](https://developingchild.harvard.edu/resource-guides/guide-serve-and-return/)는 반응적인 왕복 상호작용이 발달에 기여한다는 일반 원리를 설명하지만, 이 특정 놀이의 횟수·전두엽 시냅스의 즉각적 폭발 증가를 검증하지 않는다.

수정 후보: “아이의 신호에 반응하며 주고받는 대화는 발달을 돕는 상호작용의 한 예입니다.” 반복 횟수는 효능 기준이 아닌 활동 예시로 표현하는 방안을 검토한다.

놀이 2는 억제와 인지적 유연성을 사용하는 예로 해석할 수 있다. [Harvard 실행 기능 활동 안내](https://developingchild.harvard.edu/resources/handouts-tools/activities-guide-enhancing-and-practicing-executive-function-skills/)는 연령별 상호작용·연습의 일반 근거이지 이 저자의 수리점 놀이에 대한 임상적/실험적 효과 입증이 아니다. 수정 후보: “규칙을 기억하고 바꿔 보는 놀이로 실행 기능을 사용하는 기회를 줍니다.” 훈련 효과의 크기·지속성·전이는 별도 연구 없이 보장하지 않는다.

놀이 3의 기억 연결망=자아라는 직접 연결, 놀이 4의 회복탄력성 보석함, 놀이 5의 스트레스 발산도 교육적 비유/활동 제안과 측정된 생물학적 효과를 구분해야 한다. Harvard가 이 다섯 놀이를 제작·인증했다는 근거는 확인하지 못했다. 수정 후보는 적용 아이디어임을 명시하는 것이다. UI의 Harvard 공통 문구는 이번에 수정하지 않았다.

### EP01 세포·골격 교체

`essays/ep01-robot-mong.mdx` 1절의 위벽/피부/적혈구 주기, 골격 10년 “완전히 새로운 세포”, 10년 뒤 “전혀 다른 물질 덩어리”를 검토 대상으로 표시한다.

[Sender & Milo, Nature Medicine (2021), The distribution of cellular turnover in the human body](https://pubmed.ncbi.nlm.nih.gov/33432173/)는 주요 세포 유형별 수명·질량·회전율의 차이를 정량화한다. 전체 신체가 일정 시점에 전부 교체된다는 근거로 사용할 수 없다. [미국 Surgeon General, Bone Health and Osteoporosis, 2장](https://www.ncbi.nlm.nih.gov/sites/books/NBK45504/)은 성인 골격의 대부분이 약 10년에 걸쳐 재형성된다는 설명이며, 모든 세포의 완전 교체나 모든 원자의 교체를 뜻하지 않는다. 세포/조직/물질 교체는 서로 다른 주장이다.

수정 후보: “우리 몸의 여러 조직은 서로 다른 속도로 유지되고 재형성됩니다. 뼈도 평생 재형성되지만, 온몸의 모든 세포가 같은 주기로 완전히 바뀐다는 뜻은 아닙니다.” 위벽/피부의 구체 주기는 세포 종류·연령·조건을 특정한 자료와 번역을 편집자가 추가 확인해야 한다. 이번 보고서는 각 주기를 일괄 참/거짓으로 확정하지 않는다.

### 철학자·문학 인용과 해석

- EP01 플루타르코스/홉스 설명은 직접 인용보다 재서술이다. [Plutarch, Theseus 23.1 (Perrin 번역)](https://lexundria.com/plut_thes/1.23.1/prr)은 교체된 배를 둘러싼 기존 철학자들의 논쟁을 기록한다. 저자가 질문을 처음 만들었다는 뜻과 구분할 후보다. 홉스의 추가 가정은 `De Corpore II.11.7` 위치를 원전/판본과 대조할 것. 이번에 홉스 원전 전체를 직접 확인하지는 않았다.
- EP01 로크의 의식/기억 설명은 [An Essay Concerning Human Understanding II.xxvii](https://humanum.arts.cuhk.edu.hk/humftp/E-text/Locke/echu/cib2c27.htm)의 인격 동일성 논의에 연결된다. 모든 정체성의 유일한 답이나 현대 신경과학 결론으로 읽히지 않도록 해설임을 표시할 후보다. “현대 시스템 이론은 패턴 동일성으로 설명한다”는 일반화의 특정 출처는 확보하지 못했다. 수정 후보: “이 글에서는 이를 패턴의 지속이라는 비유로 생각해 봅니다.”
- EP02 《에티카》 III 정서 정의 25의 자기만족, EP03 정의 12의 희망은 [Spinoza Ethics Part III, Elwes 영어 번역](https://en.wikisource.org/wiki/Ethics_(Spinoza)/Part_3)에서 정의 위치와 개념 대응을 확인할 수 있다. 한국어 문구의 정확한 인용은 사용 번역본·번역자·쪽수를 확인해야 한다. 이 영어 번역을 한국어 직접 인용의 검증 완료 근거로 삼지 않는다.
- EP02 “누구도 나를 보지 않는 순간에도…”는 스피노자의 원문 인용인지 현대 해석인지 구분이 필요하다. 수정 후보는 “스피노자의 개념을 빌려 이 글에서 던지는 질문”으로 명시하는 것이다.
- 쿤데라 《정체성》의 “남자들이 더 이상…”은 해당 한국어 판본과 쪽수 미확인이다. EP03의 디킨스 교훈과 스피노자 코나투스 연결은 저자의 페어링 해석이며 원작의 직접 명제와 구분한다. 판본/문장 대조는 수동 검수로 남긴다.
- EP03의 빛 실험은 특정 용기·광원·각도의 재현성과 유리/눈 안전, 감정을 무기력으로 평가할 가능성을 별도 교육 검수한다. 기존 파일럿 보고서의 미해결 항목을 자동 해결로 간주하지 않는다.

## 검사 재현과 결과

저장소 루트, Node 24.19.0. 홈 설정 디렉터리가 읽기 전용이어서 Astro 명령에는 `ASTRO_TELEMETRY_DISABLED=1`을 사용했다. 최초 telemetry 쓰기 오류는 이 설정 후 해결됐다.

| 명령 | 기준 main | 이번 변경 |
| --- | --- | --- |
| npm test | 50 통과 | 54 통과 |
| npm run check | 오류/경고/힌트 0 | 오류/경고/힌트 0 |
| npm run build | 4 routes 성공 | 4 routes 성공 |
| npm run content:check | 명령 없음 | 종료 1, EP02 형식 불일치 13개 참조 |
| draft:check (미완성 예시) | 형식 검증 지원 | 형식 통과 유지 |
| draft:check -- --publication | 필수 원문만 검사 | ready/필수값 + 실제 public 이미지까지 검사 |

신규 테스트는 작은 임시 디렉터리와 실제로 생성한 PNG/JPEG를 사용한다. 정상 디코딩, 누락/깨짐/잘린 파일, 위장 확장자, 안전하지 않은 경로·symlink 이탈, ready와 미완성 draft의 차이, 표지와 장면 각각의 누락, 공백 페이지·빈 책·빈 에세이, 다른 이름의 정상 에세이, 고아/중복 에세이와 잘못된 YAML을 다룬다.

기준 main 빌드와 변경 후 빌드의 dist 파일 46개 SHA-256이 모두 동일했다. 추적된 src/·public/·파일럿 원본·adapter.ts에도 diff가 없다.

새 검사는 읽기 전용이며 정상 원고·자산을 자동 보정하지 않는다. 형식/파일 검사는 학술 사실, 창작 해석, 그림과 장면의 의미 대응, 연령 적합성, 활동 안전성, 출판 승인, 브라우저 시각 검수를 대신하지 않는다. 기존 build에 새 검사를 자동 연결하지 않았으므로 위 별도 명령을 출판 전 필수로 실행해야 한다. EP02의 기존 오류를 숨기는 allowlist/예외는 추가하지 않았다.

다음 PR은 [범용 변환기 설계](publication-adapter-plan.md)를 구현한다. 자산 수정 및 학술 원고 수정은 각각 별도 PR에서 검토한다. 이번 PR은 main에 병합하지 않는다.

## 후속 자산 수정: EP02 PNG 경로 정리

이후 별도 자산 PR에서 EP02 page1~12의 파일명을 실제 형식에 맞춰 `.png`로 변경하고 책 JSON의 장면 12개·표지 참조를 갱신했다. 이미지 SHA-256은 모두 보존되며 본문·힌트·놀이·에세이·UI는 변경하지 않았다. 위 표와 13개 오류는 기준 main 점검 당시의 기록이다. 수정 후 `content:check`는 통과한다.
