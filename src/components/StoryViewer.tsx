import { useEffect, useRef, useState } from 'react';
import type { CollectionEntry } from 'astro:content';
import '../styles/story-viewer.css';

type StoryPage = CollectionEntry<'books'>['data']['pages'][number];
interface Props {
  pages: StoryPage[];
  title: string;
  illustrationAspectRatio?: '16/9' | '4/3';
  illustrationFit?: 'cover' | 'contain';
}

function Illustration({ page, title, number, fit }: { page: StoryPage; title: string; number: number; fit: 'cover' | 'contain' }) {
  const [failed, setFailed] = useState(false);
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // An SSR image may fail before React attaches the error handler.
    if (image.current?.complete && image.current.naturalWidth === 0) setFailed(true);
  }, []);
  if (!page.image || failed) {
    return <div className="illustration-pending" role="status">그림을 준비하고 있어요.</div>;
  }
  return <img ref={image} src={page.image} alt={page.imageAlt ?? `${title} ${number}쪽 삽화`}
    onError={() => setFailed(true)} style={{ width: '100%', height: '100%', objectFit: fit, display: fit === 'contain' ? 'block' : undefined }} />;
}

export default function StoryViewer({ pages, title, illustrationAspectRatio = '16/9', illustrationFit = 'cover' }: Props) {
  const [currentPage, setCurrentPage] = useState(0);
  const [showHint, setShowHint] = useState(true);

  const page = pages[currentPage];

  if (!page) return <p role="status">아직 등록된 페이지가 없어요.</p>;

  return (
    <div style={{ maxWidth: '920px', margin: '24px auto', padding: '0 16px' }}>
      <div style={{ background: '#fff', borderRadius: '20px', boxShadow: '0 12px 32px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        
        {/* 일러스트 영역 */}
        <div style={{ width: '100%', aspectRatio: illustrationAspectRatio, background: '#cfdef3', position: 'relative' }}>
          <span aria-live="polite" aria-atomic="true" style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '5px 14px', borderRadius: '20px', zIndex: 2 }}>
            {currentPage + 1} / {pages.length}
          </span>
          <button type="button" aria-pressed={showHint}
            onClick={() => setShowHint(!showHint)}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.9)', border: '1px solid #fde68a', padding: '5px 12px', borderRadius: '20px', zIndex: 2, cursor: 'pointer' }}
          >
            {showHint ? '💡 부모 힌트 숨기기' : '💡 부모 힌트 보기'}
          </button>
          <Illustration key={page.image} page={page} title={title} number={currentPage + 1} fit={page.teachingPoint ? 'contain' : illustrationFit} />
        </div>

        {/* 텍스트 영역 */}
        <div className="story-copy" style={{ padding: '36px 28px', textAlign: 'center', minHeight: '190px' }}>
          <p style={{ fontSize: '1.45rem', lineHeight: '1.65', fontWeight: '600', whiteSpace: 'pre-line', marginBottom: '18px' }}>
            {page.text}
          </p>
          {showHint && (page.teachingPoint || page.interaction) && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '12px 20px', borderRadius: '12px', textAlign: 'left', whiteSpace: 'pre-wrap' }}>
              {page.teachingPoint && <section><strong>Parent Teaching Point</strong><p>{page.teachingPoint}</p></section>}
              {page.interaction && <section><strong>Parent Interaction</strong><p>{page.interaction}</p></section>}
            </div>
          )}
          {showHint && page.hint && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '12px 20px', borderRadius: '12px', display: 'inline-block', maxWidth: '90%' }}>
              {page.hint}
            </div>
          )}
        </div>

        {/* 하단 컨트롤 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', background: '#f9fafb' }}>
          <button type="button"
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            style={{ padding: '10px 20px', background: currentPage === 0 ? '#cbd5e1' : '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: currentPage === 0 ? 'not-allowed' : 'pointer' }}
          >
            ◀ 이전
          </button>
          <button type="button"
            onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
            disabled={currentPage === pages.length - 1}
            style={{ padding: '10px 20px', background: currentPage === pages.length - 1 ? '#cbd5e1' : '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: currentPage === pages.length - 1 ? 'not-allowed' : 'pointer' }}
          >
            다음 ▶
          </button>
        </div>

      </div>
    </div>
  );
}
