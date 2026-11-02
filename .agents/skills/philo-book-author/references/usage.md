# 사용 안내

Codex 호출, 문헌 기반 기획과 단계별 승인 예시는 [sample-workflow.md](../examples/sample-workflow.md), 검증 명령은 [validation.md](validation.md)를 참고한다. 핵심 원칙은 [common-guide.md](common-guide.md)에 둔다.

Gemini에서 조사·글/그림 제작 → 필요한 영역만 독립 검수 → 승인된 Master Draft 선택 → handoff로 원본 사본·manifest·보고서·실제 이미지 목록 준비 → Codex에 파일과 요청 범위 전달 → 후속 변환·이미지 배치·테스트·Vercel Preview → 사용자 확인 후 PR 병합 결정의 흐름을 권장한다. 단계 생략/독립 실행은 기존 원칙을 유지한다.

예: ‘이 승인 원고는 바꾸지 말고 handoff 패키지를 준비해줘. 이미지가 없는 장면은 pending, 존재 여부를 확인하지 못하면 null로 기록하고 남은 검수를 알려줘.’ 파일 생성이 불가능한 Gemini 환경에서는 파일별 내용을 받아 사용자가 저장·이미지 다운로드를 따로 해야 한다. [패키지 예시](../examples/sample-handoff/master-draft.json)와 [전체 계약](handoff.md)을 참고한다. 이 예시는 미승인·이미지 미준비 상태이며 실제 ep03을 대체하지 않는다.
