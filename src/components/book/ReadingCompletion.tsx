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

export default function ReadingCompletion({ title, headingId, coreQuestion, hasEssay, hasActivities, dialogue,
  onDialogue, onComplete, onReadAgain, onLastPage, onTab }: Props) {
  return <div className="reading-completion">
    <p className="completion-book">{title}</p>
    <h2 id={headingId}>{dialogue ? '아이와 이야기 나누기' : '이야기를 다 읽었어요!'}</h2>
    <p className="completion-intro">{dialogue ? '서로의 생각을 천천히 들어보세요.' : '이제 우리 가족의 생각을 나눠 볼까요?'}</p>
    {coreQuestion && <section className="completion-question" aria-labelledby={`${headingId}-question`}>
      <h3 id={`${headingId}-question`}>오늘의 철학 질문</h3>
      <p>{coreQuestion}</p>
    </section>}
    {dialogue ? <>
      <p className="dialogue-principle">아이의 대답에 정답을 알려주기보다, 왜 그렇게 생각했는지 물어보세요. 부모의 생각이 다르다면 그 이유도 함께 나눠 보세요.</p>
      <button type="button" onClick={onComplete}>완독 화면으로 돌아가기</button>
    </> : <div className="completion-options" aria-label="원하는 활동 선택">
      <button type="button" onClick={onDialogue}>아이와 이야기 나누기 <span aria-hidden="true">→</span></button>
      {hasEssay && <button type="button" onClick={() => onTab('essay')}>부모의 생각 읽기 <span aria-hidden="true">→</span></button>}
      {hasActivities && <button type="button" onClick={() => onTab('harvard')}>함께하는 생각놀이 <span aria-hidden="true">→</span></button>}
    </div>}
    <p className="completion-invitation">오늘의 이야기를 우리 가족의 작은 놀이와 대화로 이어가 보세요. 지금은 쉬어 가도 좋아요.</p>
    <nav className="completion-navigation" aria-label="이야기 다시 살펴보기">
      <button type="button" onClick={onLastPage}>마지막 장면으로</button>
      <button type="button" onClick={onReadAgain}>처음부터 다시 읽기</button>
      <a href="/">서재로 돌아가기</a>
    </nav>
  </div>;
}
