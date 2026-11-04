/**
 * Editorial taxonomy for PHILO-PAIRING.
 * These stable IDs are for content planning. The library UI will adopt them
 * in a separate PR; legacy `categories` and `topics` remain intact.
 */
export const CONTENT_CATEGORIES = [
  { id: 'emotions', label: '마음과 감정', description: '감정을 알아차리고 표현하기' },
  { id: 'identity', label: '나와 정체성', description: '나다움과 나의 가치를 탐구하기' },
  { id: 'relationships', label: '관계와 공감', description: '다른 마음을 듣고 연결되기' },
  { id: 'ethics', label: '윤리와 선택', description: '공정함과 책임 있는 선택을 생각하기' },
  { id: 'thinking', label: '질문과 사고', description: '근거를 묻고 다양한 관점을 탐색하기' },
  { id: 'growth', label: '성장과 도전', description: '실패와 변화 속에서 배우기' },
  { id: 'world', label: '세상과 공존', description: '생명과 사회, 다양성을 이해하기' },
  { id: 'meaning', label: '삶과 의미', description: '행복과 시간, 존재를 질문하기' },
] as const;

/** Subtopics are searchable secondary tags, not additional primary categories. */
export const CONTENT_SUBTOPICS = [
  { id: 'anger', label: '화와 분노', group: 'emotions' },
  { id: 'sadness', label: '슬픔', group: 'emotions' },
  { id: 'fear', label: '두려움', group: 'emotions' },
  { id: 'jealousy', label: '질투', group: 'emotions' },
  { id: 'emotional-expression', label: '감정 표현', group: 'emotions' },
  { id: 'self-worth', label: '자기 가치', group: 'identity' },
  { id: 'recognition', label: '타인의 인정', group: 'identity' },
  { id: 'comparison', label: '비교', group: 'identity' },
  { id: 'individuality', label: '개성', group: 'identity' },
  { id: 'personal-change', label: '나의 변화', group: 'identity' },
  { id: 'self-continuity', label: '정체성의 지속', group: 'identity' },
  { id: 'friendship', label: '우정', group: 'relationships' },
  { id: 'empathy', label: '공감', group: 'relationships' },
  { id: 'conflict', label: '갈등', group: 'relationships' },
  { id: 'forgiveness', label: '용서', group: 'relationships' },
  { id: 'boundaries', label: '관계의 경계', group: 'relationships' },
  { id: 'fairness', label: '공정함', group: 'ethics' },
  { id: 'honesty', label: '정직', group: 'ethics' },
  { id: 'rules', label: '규칙', group: 'ethics' },
  { id: 'promises', label: '약속', group: 'ethics' },
  { id: 'responsibility', label: '책임', group: 'ethics' },
  { id: 'curiosity', label: '호기심', group: 'thinking' },
  { id: 'evidence', label: '증거와 근거', group: 'thinking' },
  { id: 'perspectives', label: '다양한 관점', group: 'thinking' },
  { id: 'reasoning', label: '추론', group: 'thinking' },
  { id: 'ai-literacy', label: 'AI와 정보 판단', group: 'thinking' },
  { id: 'hope', label: '희망', group: 'growth' },
  { id: 'agency', label: '능동적 실천', group: 'growth' },
  { id: 'failure', label: '실패', group: 'growth' },
  { id: 'courage', label: '용기', group: 'growth' },
  { id: 'resilience', label: '회복탄력성', group: 'growth' },
  { id: 'nature', label: '자연', group: 'world' },
  { id: 'diversity', label: '다양성', group: 'world' },
  { id: 'community', label: '공동체', group: 'world' },
  { id: 'coexistence', label: '공존', group: 'world' },
  { id: 'technology', label: '기술과 인간', group: 'world' },
  { id: 'happiness', label: '행복', group: 'meaning' },
  { id: 'time', label: '시간', group: 'meaning' },
  { id: 'memory', label: '기억', group: 'meaning' },
  { id: 'existence', label: '존재', group: 'meaning' },
  { id: 'love', label: '사랑', group: 'meaning' },
] as const;

export type ContentCategoryId = (typeof CONTENT_CATEGORIES)[number]['id'];
export type ContentSubtopicId = (typeof CONTENT_SUBTOPICS)[number]['id'];
