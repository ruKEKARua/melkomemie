import React, { useState, useCallback, useMemo } from 'react';
import { sanitizeGoogleBooksCover, type BookClubBook } from '../../api/bookClubData';
import { getCachedBookCover } from '../../api/bookCache';
import { parseSpineColors, formatRating } from '../../utils/bookShelfStyles';
import { BookSpineItem } from './BookSpineItem';

interface VirtualBookShelfProps {
  books: BookClubBook[];
  onSelectBook: (book: BookClubBook) => void;
  onOpenCatalog?: () => void;
  scale: number;
}

export const VirtualBookShelf: React.FC<VirtualBookShelfProps> = ({
  books,
  onSelectBook,
  scale,
}) => {
  const [hoveredBookId, setHoveredBookId] = useState<number | null>(null);

  const handleHoverBook = useCallback((id: number) => {
    setHoveredBookId(id);
  }, []);

  // Proportional dimensions:
  // 1. Spine (корешок) — ~36px width, visible in resting state
  const spineWidthPx = Math.max(32, Math.round(36 * scale));
  // 2. Protruding leather hinge/joint on the left of front cover ("выпирающая корочка")
  const hingeWidthPx = Math.max(7, Math.round(8 * scale));
  // 3. Front Cover (лицевая обложка) — ~80px width, revealed on hover
  const coverWidthPx = Math.max(72, Math.round(80 * scale));
  // Total physical width when book is opened on hover
  const totalExpandedWidthPx = hingeWidthPx + coverWidthPx;
  const gapPx = Math.max(2, Math.round(3 * scale));

  // Floating tooltip card dimensions
  const cardWidth = Math.max(205, Math.round(235 * scale));
  const coverThumbWidth = Math.max(34, Math.round(38 * scale));
  const coverThumbHeight = Math.max(46, Math.round(52 * scale));

  // 6 books strictly divided across each of the 4 wooden shelves of the cabinet:
  const shelf1 = useMemo(() => books.slice(0, 6), [books]);
  const shelf2 = useMemo(() => books.slice(6, 12), [books]);
  const shelf3 = useMemo(() => books.slice(12, 18), [books]);
  const shelf4 = useMemo(() => books.slice(18, 24), [books]);

  const renderShelfRow = (
    shelfBooks: BookClubBook[],
    shelfIndex: number,
    heightPercent: string
  ) => {
    // Check if currently hovered book is on this shelf
    const hoveredIdx = shelfBooks.findIndex((b) => b.id === hoveredBookId);
    const hoveredBook = hoveredIdx !== -1 ? shelfBooks[hoveredIdx] : null;

    let tooltipLeft = 0;
    let beakLeft = 0;
    // Only bottom shelf (Shelf 4, index 3) pops UP; shelves 0, 1, 2 drop DOWN
    const isBottomShelf = shelfIndex === 3;

    if (hoveredBook && hoveredIdx !== -1) {
      // Books before hovered book are resting: hoveredIdx * (spineWidthPx + gapPx)
      const bookLeft = hoveredIdx * (spineWidthPx + gapPx);
      const bookCenter = bookLeft + totalExpandedWidthPx / 2;

      // Available inner shelf width (~332px inside cabinet)
      const shelfInnerWidth = Math.max(280, Math.round(332 * scale));
      const maxLeft = Math.max(0, shelfInnerWidth - cardWidth);
      const idealLeft = bookCenter - cardWidth / 2;

      tooltipLeft = Math.max(0, Math.min(maxLeft, idealLeft));
      // Beak points directly at the book center relative to the card's left edge
      beakLeft = Math.max(16, Math.min(cardWidth - 16, bookCenter - tooltipLeft));
    }

    return (
      <div
        className="w-full max-w-full box-border flex items-end justify-start select-none relative"
        style={{
          height: heightPercent,
          padding: '0 12px',
          maxWidth: '100%',
          boxSizing: 'border-box',
          zIndex: hoveredBook ? 50 : 10,
        }}
      >
        <div
          className="flex items-end h-full select-none"
          onMouseLeave={() => setHoveredBookId(null)}
        >
          {shelfBooks.map((b, i) => (
            <BookSpineItem
              key={b.id}
              book={b}
              index={i}
              totalOnShelf={shelfBooks.length}
              isHovered={hoveredBookId === b.id}
              scale={scale}
              spineWidthPx={spineWidthPx}
              hingeWidthPx={hingeWidthPx}
              coverWidthPx={coverWidthPx}
              totalExpandedWidthPx={totalExpandedWidthPx}
              gapPx={gapPx}
              onHover={handleHoverBook}
              onSelect={onSelectBook}
            />
          ))}
        </div>

        {/* 
          Hover Information Tooltip:
          Positioned strictly at shelf-level with mathematically clamped boundaries
        */}
        {hoveredBook && (
          <div
            className={`absolute ${
              isBottomShelf ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]'
            } z-50 pointer-events-none animate-fade-in flex flex-col items-center`}
            style={{
              left: `${tooltipLeft + 12}px`,
              width: `${cardWidth}px`,
            }}
          >
            {/* If dropping DOWN (Shelves 0, 1, 2): beak on top, pointing UP at the hovered book */}
            {!isBottomShelf && (
              <div
                className="w-2.5 h-2.5 rotate-45 bg-slate-950 border-l border-t border-amber-400/90 shadow-md z-20 pointer-events-none"
                style={{
                  position: 'absolute',
                  top: '-5px',
                  left: `${beakLeft}px`,
                  transform: 'translateX(-50%) rotate(45deg)',
                }}
              />
            )}

            {/* Tooltip Card Body */}
            <div className="relative w-full rounded-xl overflow-hidden border border-amber-400/90 shadow-[0_20px_45px_rgba(0,0,0,0.98)] ring-2 ring-black/80 bg-slate-950/95 backdrop-blur-md flex items-center gap-2.5 p-2 sm:p-2.5">
              <div
                className="relative rounded-md overflow-hidden shrink-0 shadow-md border border-white/20 bg-slate-900"
                style={{
                  width: `${coverThumbWidth}px`,
                  height: `${coverThumbHeight}px`,
                }}
              >
                {(getCachedBookCover(hoveredBook.id) || sanitizeGoogleBooksCover(hoveredBook.coverUrl)) ? (
                  <img
                    src={getCachedBookCover(hoveredBook.id) || sanitizeGoogleBooksCover(hoveredBook.coverUrl) || ''}
                    alt={hoveredBook.title}
                    className="w-full h-full object-cover block"
                    loading="eager"
                  />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center p-1 text-center"
                    style={{
                      background: `linear-gradient(135deg, ${
                        parseSpineColors(hoveredBook).topColor
                      } 0%, #0a0a14 100%)`,
                    }}
                  >
                    <span className="text-sm">📖</span>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between min-w-0 text-left py-0.5">
                <div className="flex items-start justify-between gap-1.5">
                  <span className="font-black text-white text-xs leading-snug line-clamp-2 drop-shadow">
                    {hoveredBook.title}
                  </span>
                  <div className="shrink-0 bg-amber-500/20 border border-amber-400/70 rounded px-1.5 py-0.5 flex items-center gap-1 shadow-xs">
                    <span className="text-amber-400 text-[10px] font-black leading-none">★</span>
                    <span className="text-amber-100 text-[10.5px] font-black leading-none font-mono">
                      {formatRating(hoveredBook.overallRating)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-zinc-300 mt-0.5">
                  <span className="text-amber-300 font-semibold truncate">
                    {hoveredBook.author}
                  </span>
                  {hoveredBook.publishedYear && (
                    <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                      ({hoveredBook.publishedYear} г.)
                    </span>
                  )}
                </div>

                <div className="mt-1 text-[9px] text-amber-400/80 font-medium flex items-center gap-1">
                  <span>Нажмите для подробностей</span>
                  <span>→</span>
                </div>
              </div>
            </div>

            {/* If popping UP (Shelf 3 - Bottom Shelf): beak on bottom, pointing DOWN at the hovered book */}
            {isBottomShelf && (
              <div
                className="w-2.5 h-2.5 rotate-45 bg-slate-950 border-r border-b border-amber-400/90 shadow-md z-20 pointer-events-none"
                style={{
                  position: 'absolute',
                  bottom: '-5px',
                  left: `${beakLeft}px`,
                  transform: 'translateX(-50%) rotate(45deg)',
                }}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col justify-between select-none">
      {/* 
        SHELF 1 (Top Cavity: 6 books 0..5)
        Strict containment: max-width 100%, box-sizing border-box, padding 0 12px
      */}
      {renderShelfRow(shelf1, 0, '26.302%')}

      {/* Spacing for shelf divider 1: thickness = 15px => 1.953% */}
      <div style={{ height: '1.953%' }} />

      {/* 
        SHELF 2 (Second Cavity: 6 books 6..11)
      */}
      {renderShelfRow(shelf2, 1, '23.307%')}

      {/* Spacing for shelf divider 2: thickness = 16px => 2.083% */}
      <div style={{ height: '2.083%' }} />

      {/* 
        SHELF 3 (Third Cavity: 6 books 12..17)
      */}
      {renderShelfRow(shelf3, 2, '23.568%')}

      {/* Spacing for shelf divider 3: thickness = 14px => 1.823% */}
      <div style={{ height: '1.823%' }} />

      {/* 
        SHELF 4 (Bottom Cavity: 6 books 18..23)
      */}
      {renderShelfRow(shelf4, 3, '20.964%')}
    </div>
  );
};

export default VirtualBookShelf;
