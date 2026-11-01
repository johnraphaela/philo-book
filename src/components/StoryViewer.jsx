import React, { useState } from 'react';

export default function StoryViewer({ pages }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [showHint, setShowHint] = useState(true);

  const page = pages[currentPage];

  return (
    <div style={{ maxWidth: '920px', margin: '24px auto', padding: '0 16px' }}>
      <div style={{ background: '#fff', borderRadius: '20px', boxShadow: '0 12px 32px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        
        {/* 일러스트 영역 */}
        <div style={{ width: '100%', aspectRatio: '16/9', background: '#cfdef3', position: 'relative' }}>
          <span style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '5px 14px', borderRadius: '20px', zIndex: 2 }}>
            {currentPage + 1} / {pages.length}
          </span>
          <button 
            onClick={() => setShowHint(!showHint)}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.9)', border: '1px solid #fde68a', padding: '5px 12px', borderRadius: '20px', zIndex: 2, cursor: 'pointer' }}
          >
            {showHint ? '💡 부모 힌트 숨기기' : '💡 부모 힌트 보기'}
          </button>
          {page.image && (
            <img src={page.image} alt="동화 삽화" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>

        {/* 텍스트 영역 */}
        <div style={{ padding: '36px 28px', textAlign: 'center', minHeight: '190px' }}>
          <p style={{ fontSize: '1.45rem', lineHeight: '1.65', fontWeight: '600', whiteSpace: 'pre-line', marginBottom: '18px' }}>
            {page.text}
          </p>
          {showHint && page.hint && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '12px 20px', borderRadius: '12px', display: 'inline-block', maxWidth: '90%' }}>
              {page.hint}
            </div>
          )}
        </div>

        {/* 하단 컨트롤 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', background: '#f9fafb' }}>
          <button 
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            style={{ padding: '10px 20px', background: currentPage === 0 ? '#cbd5e1' : '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: currentPage === 0 ? 'not-allowed' : 'pointer' }}
          >
            ◀ 이전
          </button>
          <button 
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