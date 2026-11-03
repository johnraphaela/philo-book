# EP04 Handoff — 부모 힌트 보완본 검토

검토일: 2026-11-03(KST). 책 ID pico-silver-feather. 원본 상태 draft 유지. 정식 출판·ready 승격 승인 기록 없음.

## 기준 자료와 변경 범위

이번 사용자 제공 Master Draft.md/Image Manifest.md/Review Report.md를 source/에 바이트 그대로 보존했다. 앞의 두 파일은 코드 펜스 없는 순수 JSON이다. master-draft.json은 새 Master Draft.md와 바이트 동일하며 추가 윤문·문장 삭제·활동 변경 없음. SHA-256 및 이전 버전 대비 36개 필드 변경은 preservation.json에 기록했다.

사용자가 새 원본에 추가한 내용: parentHint 12개, 상세 영문 prompt 12개, alt 11개 보완, play-fly.explanation 1개 수정. 12장면 text·ID·순서, essay 전체, 나머지 활동 값은 이전 원본과 동일하다. 새 원본에 있는 터키어 단어 büyük, 중복 natural 등 프롬프트 표현도 임의 교정하지 않았다. essay.subtitle/본문 소제목은 새 원본에도 없다.

첨부 Review Report의 verified·승인 완료·명시적 승인 로그는 문서의 주장으로 보존하되 실제 대화 승인 증거로 채택하지 않았다. 현재 사용자 요청은 새 파일을 기준으로 패키지와 로컬 검토물을 만드는 범위다. 원전 주장 수정·인용 교체·추가 안전 문구·정식 공개 승인은 별도다.

## 변경 대응표

| 입력 | 출력 | 실제 처리 |
|---|---|---|
| Master Draft.md | master-draft.json | 바이트 그대로. status:draft, ID와 모든 본문/힌트/프롬프트 유지 |
| Image Manifest.md images[0..11] | image-manifest.json images[0..11] | 파일 직접 확인 후 pending→provided, exists:null→true, file/originalFileName 추가 |
| 원본 cover.imageId | cover.imageId | img-scene-11→img-scene-01. 최초 사용자 지시: 첫 장면 재사용 |
| Review Report.md | source/Review Report.md | 바이트 그대로 보존. 신규 검토 판단은 이 문서에 분리 |
| 부모 가이드/대화/실천 활동 | 정본 thinking 배열 | guide→conversation→practice, order1/2/3, dialogue/practice numberingGroup 그대로 |
| 구조화 steps | 임시 기술 테스트 후보만 | 기존 UI 마커 대화1·2/활동1·2로 각 제목·질문·설명을 직렬화. 준비물도 보존. 원래 구조 전체는 임시 후보 extensions와 정본에 남김 |

정본 삭제 문구: 없음. 정본에 assetPath를 추측 삽입하지 않음. public/·src/·UI·EP01~03·기존 학술 원고는 변경하지 않음.

## 이미지 실제 검사

PR #23에서 제공된 page1.png~page12.png를 직접 읽었다. PR은 사용자 측에서 이미 main에 병합된 상태였다(30901b7514de6a5c13ab6c278a31d796eb036a24). 이번 작업은 그 main에서 review/ep04-teaching-points 로컬 브랜치로 분리했다.

- 12개 모두 PNG 시그니처·sharp 메타데이터·전체 raw 디코딩 통과.
- 전부 1448×1086, 4:3. 서로 다른 SHA-256 12개로 바이트 중복 없음. page1~12 누락 없음.
- GitHub blob SHA와 로컬 바이트를 대조한 기록 및 파일별 해시는 validation/images.json.
- 실제 파일을 축소 모아 시각 검토했고 pageN→scene-N 대응 확인. 그림 의미 일치의 정밀 독자 검토는 별도.
- 새 Master Draft alt와 Manifest alt 12개가 일치한다. prompt/alt 문장을 교정하지 않음.
- 표지는 page1.png/img-scene-01 재사용. 새 표지 생성·이미지 크롭·재인코딩 없음.
- scene-01의 길이 재기는 날개 펼침으로 표현되며 측정 도구가 보이지 않는다. scene-03의 나무 밑동 그림과 본문의 둥지 구석 사이에 배경 차이가 있다. 원고/그림을 바꾸지 않고 사람 검토로 남김.

## 학술·발달·안전 검토(원고에 미적용)

| 대상·위치 | 주장 유형/근거 확인 | 검증 상태·문제 | 수정 제안 | 승인 |
|---|---|---|---|---|
| essay.body 제3~4 문단 | 스피노자 원전 주장과 교육적 응용 혼재. 에티카 III 정의2~3, 정리6·7·9·58·59 공개 영문 번역 직접 확인(이전 검토) | 원전 일부 확인. 코나투스는 수동 상태에도 작용하므로 코나투스=능동적 기쁨/내재적 즐거움의 등식은 부정확. 경쟁심 전체를 수동적 슬픔으로 일반화하는 표현도 검토 필요 | 자기 존재 지속의 노력이라는 원전 설명과, 이 책이 즐거운 활동 찾기에 적용한 교육적 비유를 구분 | 미승인 |
| essay.body 데미안 인용 | 1923 Boni and Liveright 영문판 5장, 인쇄면115~116의 대응 구절·문맥 확인(이전 검토) | 대응 내용 확인. 한국어 번역자·판본·쪽수 및 독일어 원문 대조는 미확인. 경쟁/서열=알은 교육적 해석이며 원전의 유일한 뜻이 아님 | 사용할 한국어 판본을 확인하거나 승인 후 교육적 의역으로 표시 | 미승인 |
| parent-guide 및 놀이 | Harvard 공식 Serve and Return 개념 페이지 확인(이전 검토). 반응적 주고받기 원리는 확인 | EP04 질문·깃털 놀이의 신경과학 효과를 검증한 실험은 없음. 원고에 IQ/정량적 뇌효과 보장 문구는 발견 못함 | 일반 원리를 참고한 대화 예시로 한정. 5~10세 전체의 효과 보장으로 확대하지 않기 | 미승인 |
| 기존 UI 활동 제목 | “오늘 밤 전두엽을 깨우는 생각 놀이” | 특정 뇌 영역 효과를 입증한 것으로 읽힐 수 있음. 기존 UI이므로 이번 범위에서 변경하지 않음 | 후속 UI 검토 대상으로 보고 | 미승인 |
| play-fly.explanation | 새 원본은 눈 뜨고 이동/제자리에서 눈 감고 상상으로 변경됨 | 눈 감고 이동하는 기존 직접 위험은 완화됨. 다만 거실 이동 중 가구 충돌, 서서 눈 감을 때 균형 상실 위험·감독 지침 누락은 남음 | 제안: 장애물 없는 공간에서 성인 동반. 눈 감는 상상은 앉아서 하고, 불편하면 즉시 중단. 본문 미변경 | 미승인 |
| make-feather materials | 가위·테이프 사용 | 어린 연령의 가위 사용·피부 부착 주의 없음 | 끝이 둥근 가위·성인 도움, 테이프는 옷에 붙이고 얼굴/목/입 접촉 피하기 제안 | 미승인 |
| 12개 parentHint | 원본 12개 모두 연결됨. 감정·비교·자기표현 질문 | 5~10세 실제 독자 평가 미실행. 왜? 질문의 정답을 유도하거나 아이의 승부욕·슬픔을 나쁘다고 단정하지 않도록 주의 | 5~7세 읽어주기와 짧은 질문, 답변 거절/쉬기 허용. 부모가 해석을 강요하지 않기 | 미승인 |
| scene-08~10/그림 | 눈 감기·절벽·비상의 동화적 표현 | 실제 높은 곳 점프·눈 감고 이동을 모방하지 않도록 보호자 안내 필요 | 놀이와 동화 속 비행을 구분. 동화 원문은 보존 | 미승인 |

확인 근거(이전 이 세션 검토 기록, 2026-11-03):

- https://sacred-texts.com/book/the-ethics/part-iii-on-the-origin-and-nature-of-the-emotions — 공개 영문 번역의 위 정의·정리. 원 라틴어/한국어 판본 확인과는 구분.
- https://www.gutenberg.org/files/74222/74222-h/74222-h.htm — 5장 쪽지 인용과 앞뒤 맥락. 한국어 번역문 verified를 의미하지 않음.
- https://developingchild.harvard.edu/key-concept/serve-and-return/ — 공식 개념 안내. EP04 개입 실험이 아님.

검증되지 않은 문헌·개별 주장에 포괄적인 verified를 부여하지 않았다. 원고에 참고문헌 목록을 지어내거나 위 자료를 원고에 삽입하지 않음.

## 로컬 미리보기의 범위

정본 draft로 기존 draft:preview/draft:site를 먼저 실행해 실제 차단 진단을 남긴다. 범용 도구는 Handoff 이미지 자동 배치와 구조화 steps 직렬화를 제공하지 않는다.

preview-local.mjs는 이 정확한 EP04 원본 해시에만 적용되는 검토 보조다. 원본을 쓰지 않고 OS 임시 전체 사이트 사본에만 실제 이미지 사본과 테스트 후보를 배치한다. 임시 입력의 ready 표시는 기술 테스트를 위한 플래그이며 정식 승인과 무관하다. 놀이 구조의 표시 매핑은 미승인 검토안이다. 후보·activity-mapping.json·예상 Astro JSON/MDX·검사 결과는 임시 경로에 남는다. 기존 읽기 전용 planPublication과 createSitePreview를 사용하고 source/public/master/manifest 바이트를 전후 비교한다. 파일이 바뀌면 원고 해시 검사가 차단한다.

현재 UI는 16:9 영역/object-fit:cover다. 4:3 원본은 위아래 합계25%(기본 중앙 정렬에서 각12.5%)가 잘리는 계산이다. 원본 그림은 그대로다. 표지 카드도 같은 비율 정책이다. 화면 결과와 확정한 검증 항목은 validation/ 및 README-Windows.md에 기록한다. UI 수정은 이번 범위에서 하지 않는다.

자동 검사 통과는 문헌 검증·안전 승인·정식 출판이 아니다. 사람 검토: 철학 해석, 한국어 인용 출처, 연령/안전, 그림 세부 대응, 활동 표시 매핑, 이미지 잘림 허용 여부. 사용자 승인 필요: 원고 수정·정식 ready 변경·출판. 이번 작업에서 원격 푸시·PR 병합·Vercel 배포는 하지 않는다.
