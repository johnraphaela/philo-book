import { useEffect, useId, useRef, useState } from 'react';
import type { CollectionEntry } from 'astro:content';
import { formatStoryDialogue } from '../lib/story-display';
import '../styles/story-viewer.css';

type StoryPage = CollectionEntry<'books'>['data']['pages'][number];
interface Props {
  pages: StoryPage[];
  title: string;
  // Retained for callers; actual images always use their intrinsic proportions.
  illustrationAspectRatio?: '16/9' | '4/3';
  illustrationFit?: 'cover' | 'contain';
}

function Illustration({ page, title, number }: { page: StoryPage; title: string; number: number }) {
  const [failed, setFailed] = useState(false);
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (image.current?.complete && image.current.naturalWidth === 0) setFailed(true);
  }, []);
  if (!page.image || failed) {
    return <div className="illustration-pending" role="status">그림을 준비하고 있어요.</div>;
  }
  return <img ref={image} src={page.image} alt={page.imageAlt ?? `${title} ${number}쪽 삽화`}
    onError={() => setFailed(true)} />;
}

export default function StoryViewer({ pages, title }: Props) {
  const [currentPage, setCurrentPage] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const sceneStart = useRef<HTMLDivElement>(null);
  const previousPage = useRef(0);
  const hintId = useId();
  const titleId = useId();
  const page = pages[currentPage];

  useEffect(() => {
    if (previousPage.current === currentPage) return;
    previousPage.current = currentPage;
    // Focus the scene, so a disabled boundary button never strands keyboard users.
    sceneStart.current?.focus({ preventScroll: true });
    sceneStart.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [currentPage]);

  function movePage(delta: number) {
    setShowHint(false);
    setCurrentPage(current => Math.max(0, Math.min(pages.length - 1, current + delta)));
  }

  if (!page) return <p role="status">아직 등록된 페이지가 없어요.</p>;

  return (
    <article className="story-viewer" aria-labelledby={titleId} onKeyDown={event => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        movePage(event.key === 'ArrowLeft' ? -1 : 1);
      }
    }}>
      <h1 id={titleId}>{title}</h1>
      <div className="story-card">
        <div ref={sceneStart} className="story-scene-start" tabIndex={-1}
          aria-label={`${title}, ${currentPage + 1} / ${pages.length}쪽`}>
          <div className="story-illustration">
            <Illustration key={`${currentPage}:${page.image}`} page={page} title={title} number={currentPage + 1} />
          </div>
        </div>
        <div className="story-copy">
          <p className="story-text">{formatStoryDialogue(page.text)}</p>
          {(page.hint || page.teachingPoint || page.interaction) && (
            <div className="story-parent">
              <button type="button" aria-expanded={showHint} aria-controls={hintId}
                onClick={() => setShowHint(open => !open)}>
                <span>부모와 함께 이야기하기</span><span aria-hidden="true">{showHint ? '−' : '+'}</span>
              </button>
              <div id={hintId} hidden={!showHint} className="story-parent-content">
                {page.teachingPoint && <section><strong>Parent Teaching Point</strong><p>{page.teachingPoint}</p></section>}
                {page.interaction && <section><strong>Parent Interaction</strong><p>{page.interaction}</p></section>}
                {page.hint && <p>{page.hint}</p>}
              </div>
            </div>
          )}
        </div>
        <nav className="story-pagination" aria-label="동화 페이지 이동">
          <button type="button" onClick={() => movePage(-1)} disabled={currentPage === 0}>◀ 이전</button>
          <span role="status" aria-live="polite" aria-atomic="true">{currentPage + 1} / {pages.length}쪽</span>
          <button type="button" onClick={() => movePage(1)} disabled={currentPage === pages.length - 1}>다음 ▶</button>
        </nav>
      </div>
    </article>
  );
}
