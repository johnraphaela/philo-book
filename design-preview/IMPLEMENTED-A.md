# A안 운영 소스 반영

사용자의 최종 진행 요청에 따라 작업 체크아웃에 A안을 적용했다. 이전 REPORT.md/README.md의 “운영 소스 변경 없음”은 시안 제작 단계의 기록이며 현재 상태는 이 문서를 기준으로 한다. main 병합·푸시·배포하지 않았다.

변경 파일:
- src/styles/library-a.css: 선택한 A안의 종이색/녹색 테마, 역할별 색상 토큰, 한글 폰트 fallback, 홈·필터·카드·읽기 화면 표현.
- src/layouts/BaseLayout.astro: 테마 스타일 가져오기.
- src/components/library/BookCard.astro: EP01 표지를 정확히 지정하기 위한 data-book-id 속성.

EP01 표지는 4:3 영역을 cover/중앙 정렬로 가득 채운다. 원본 비율을 유지하며 좌우 일부를 잘라 표시한다. 다른 표지는 contain. 원본 파일과 본문 뷰어의 이미지 표시 방식은 그대로다. A안과 B안의 비교 시안은 기록으로 보존한다.

현재 검증: 360/390/768/1440px 운영 홈·대표 에세이·활동 가로 넘침 없음. 5권 표시, 빈 검색 결과, 초기화, 분류 선택, 연령 복합 필터 확인. 대표 읽기 다음/이전·힌트·완료·생각 나누기·키보드 탭 확인. 증거는 evidence/implemented-a/.

npm run check 오류 0/경고 0/hints 35(생성된 시안 번들 등), npm test 123 통과/1 skip/실패 0, npm run content:check 통과. 운영 build 결과는 evidence/implemented-a/build.txt.

출판 콘텐츠·원본 이미지·제작 원고·승인/소유권/원본 해시·Vercel deploymentEnabled:false는 변경 없음. 기능 로직과 URL/문구 변경 없음. 이미지 경량화는 수행하지 않았다. Hallmark 전체 통과나 실서비스 배포 검증을 의미하지 않는다.

## PR 준비

최신 main d46d391(EP06 등록 및 대화 화면 복구)을 디자인 브랜치에 반영했다. 초기 A/B 캡처는 도서 5권 시점의 디자인 기록이며, 최신 검증은 6권 기준 evidence/pr-validation/에 별도로 기록한다. 스타일 변경은 원본 콘텐츠와 대화 기능 로직을 변경하지 않는다.
