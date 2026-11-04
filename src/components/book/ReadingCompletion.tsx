interface Props {
  title: string;
  headingId: string;
  coreQuestion?: string;
  hasEssay: boolean;
  hasActivities: boolean;
  dialogue: boolean;
  onDialogue: () => void;
  onComplete: () => void;
  onReadAgain: () => void;
  onLastPage: () => void;
  onTab: (tab: 'essay' | 'harvard') => void;
}

function OptionIcon({ kind }: { kind: 'dialogue' | 'essay' | 'activity' }) {
  return <svg className="option-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {kind === 'dialogue' ? <><path d="M5 5h19v14H12l-7 5V5Z" /><path d="M24 11h4v16l-6-4h-7v-4M10 10h9M10 14h6" /></>
      : kind === 'essay' ? <><path d="M16 8c-4-3-8-3-12-2v20c4-1 8-1 12 2 4-3 8-3 12-2V6c-4-1-8-1-12 2ZM16 8v20" /><path d="m8 11 4 1m-4 4 4 1m8-5 4-1m-4 6 4-1" /></>
        : <><path d="M16 28V15M16 20C6 20 4 13 5 7c8 0 12 4 11 13ZM16 15C16 7 21 3 28 4c0 7-4 11-12 11Z" /><path d="m9 12 7 8m7-11-7 6M10 28h12" /></>}
  </svg>;
}

export default function ReadingCompletion({ title, headingId, coreQuestion, hasEssay, hasActivities, dialogue,
  onDialogue, onComplete, onReadAgain, onLastPage, onTab }: Props) {
  const card = (kind: 'dialogue' | 'essay' | 'activity', label: string, description: string, action: () => void) =>
    <button type="button" className={`completion-option option-${kind}`} onClick={action}
      aria-labelledby={`${headingId}-${kind}-title`} aria-describedby={`${headingId}-${kind}-description`}>
      <OptionIcon kind={kind} />
      <span className="option-copy"><span className="option-title" id={`${headingId}-${kind}-title`}>{label}</span>
        <span className="option-description" id={`${headingId}-${kind}-description`}>{description}</span></span>
      <span className="option-arrow" aria-hidden="true">→</span>
    </button>;
  return <div className="reading-completion">
    {dialogue && <button type="button" className="hub-return" onClick={onComplete}>← 이야기 너머로</button>}
    {!dialogue && <p className="completion-brand">PHILO-PAIRING</p>}
    <h2 id={headingId}>{dialogue ? '생각 나누기' : '이야기 너머'}</h2>
    <p className="completion-intro">{dialogue ? '아이와 서로의 생각을 듣고 질문해요' : '책은 끝났지만, 우리의 생각은 계속돼요.'}</p>
    <p className="completion-book">{title}</p>
    {coreQuestion && <section className="completion-question" aria-labelledby={`${headingId}-question`}>
      <h3 id={`${headingId}-question`}>오늘의 철학 질문</h3>
      <p>{coreQuestion}</p>
    </section>}
    {dialogue ? <p className="dialogue-principle">아이의 대답에 정답을 알려주기보다, 왜 그렇게 생각했는지 물어보세요. 부모의 생각이 다르다면 그 이유도 함께 나눠 보세요.</p>
      : <>
        <div className="completion-options">
          {card('dialogue', '생각 나누기', '아이와 서로의 생각을 듣고 질문해요', onDialogue)}
          <div className="completion-secondary">
            {hasEssay && card('essay', '어른의 시선', '같은 이야기를 어른의 눈으로 바라봐요', () => onTab('essay'))}
            {hasActivities && card('activity', '생각 펼치기', '질문을 놀이와 활동으로 이어가요', () => onTab('harvard'))}
          </div>
        </div>
        <nav className="completion-navigation" aria-label="이야기 다시 살펴보기">
          <button type="button" onClick={onLastPage}>마지막 장면 다시 보기</button>
          <button type="button" onClick={onReadAgain}>처음부터 다시 읽기</button>
        </nav>
      </>}
  </div>;
}
