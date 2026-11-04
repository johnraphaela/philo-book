import { useEffect, useId, useRef, useState } from 'react';
import type { CollectionEntry } from 'astro:content';
import { getParentGuidance } from '../lib/story-guidance';
import { formatStoryDialogue } from '../lib/story-display';
import '../styles/story-viewer.css';

type ImageSize = { width: number; height: number };
type StoryPage = CollectionEntry<'books'>['data']['pages'][number];
interface Props {
  pages: StoryPage[];
  title: string;
  imageSizes?: (ImageSize | undefined)[];
  // Retained for callers; actual images always use their intrinsic proportions.
  illustrationAspectRatio?: '16/9' | '4/3';
  illustrationFit?: 'cover' | 'contain';
}

function Illustration({ page, title, number, size }: { page: StoryPage; title: string; number: number; size?: ImageSize }) {
  const [failed, setFailed] = useState(false);
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (image.current?.complete && image.current.naturalWidth === 0) setFailed(true);
  }, []);
  if (!page.image || failed) {
    return <div className="illustration-pending" role="status">그림을 준비하고 있어요.</div>;
  }
  return <img ref={image} src={page.image} alt={page.imageAlt ?? `${title} ${number}쪽 삽화`}
    width={size?.width} height={size?.height} decoding="async" onError={() => setFailed(true)} />;
}

export default function StoryViewer({ pages, title, imageSizes }: Props) {
  const [currentPage, setCurrentPage] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const sceneStart = useRef<HTMLDivElement>(null);
  const previousPage = useRef(0);
  const hintId = useId();
  const titleId = useId();
  const page = pages[currentPage];
  const guidance = getParentGuidance(page ?? {});

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
      if ((event.target as HTMLElement).closest('button, a, input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="tab"], [role="button"], [role="slider"]')) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        movePage(event.key === 'ArrowLeft' ? -1 : 1);
      }
    }}>
      <header className="story-heading">
        <h1 id={titleId}>{title}</h1>
        <p className="story-position" role="status" aria-live="polite" aria-atomic="true">{currentPage + 1} / {pages.length}쪽</p>
        <div className="story-progress" aria-hidden="true"><span style={{ width: `${(currentPage + 1) / pages.length * 100}%` }} /></div>
      </header>
      <div className="story-card">
        <div ref={sceneStart} className="story-scene-start" tabIndex={-1}
          aria-label={`${title}, ${currentPage + 1} / ${pages.length}쪽`}>
          <div className="story-illustration">
            <Illustration key={`${currentPage}:${page.image}`} page={page} title={title} number={currentPage + 1} size={imageSizes?.[currentPage]} />
          </div>
        </div>
        <div className="story-copy">
          <p className="story-text">{formatStoryDialogue(page.text)}</p>
          {guidance.length > 0 && (
            <div className="story-parent">
              <button type="button" aria-expanded={showHint} aria-controls={hintId}
                onClick={() => setShowHint(open => !open)}>
                <span>함께 이야기하기</span><span aria-hidden="true">{showHint ? '−' : '+'}</span>
              </button>
              <div id={hintId} hidden={!showHint} className="story-parent-content">
                {guidance.map(item => <section key={item.label}><strong>{item.label}</strong><p>{item.text}</p></section>)}
              </div>
            </div>
          )}
        </div>
        <nav className="story-pagination" aria-label="동화 페이지 이동">
          <button type="button" onClick={() => movePage(-1)} disabled={currentPage === 0} aria-label="이전 페이지">← 이전</button>
          <span aria-hidden="true">{currentPage + 1} / {pages.length}쪽</span>
          <button type="button" onClick={() => movePage(1)} disabled={currentPage === pages.length - 1} aria-label="다음 페이지">다음 →</button>
        </nav>
      </div>
    </article>
  );
}
