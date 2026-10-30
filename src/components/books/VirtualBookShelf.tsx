import React, { useState } from 'react';
import { sanitizeGoogleBooksCover, type BookClubBook } from '../../api/bookClubData';

interface VirtualBookShelfProps {
  books: BookClubBook[];
  onSelectBook: (book: BookClubBook) => void;
  onOpenCatalog?: () => void;
  scale: number;
}

function parseSpineColors(book: BookClubBook) {
  const hexMatches = book.spineColor?.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/g);
  const topColor = hexMatches?.[0] || book.spineAccent || '#450a0a';
  const bottomColor = hexMatches?.[1] || '#12141d';
  const accent = book.spineAccent || '#f59e0b';
  return { topColor, bottomColor, accent };
}

export const VirtualBookShelf: React.FC<VirtualBookShelfProps> = ({
  books,
  onSelectBook,
  scale,
}) => {
  const [hoveredBookId, setHoveredBookId] = useState<number | null>(null);

  // 15 books strictly divided across the 4 wooden shelves of the cabinet:
  // Shelf 1 (Top Cavity): books 0..3 (4 books)
  // Shelf 2 (Second Cavity): books 4..7 (4 books)
  // Shelf 3 (Third Cavity): books 8..11 (4 books)
  // Shelf 4 (Bottom Cavity): books 12..14 (3 books)
  const shelf1 = books.slice(0, 4);
  const shelf2 = books.slice(4, 8);
  const shelf3 = books.slice(8, 12);
  const shelf4 = books.slice(12, 15);

  const renderBook = (
    book: BookClubBook,
    index: number,
    totalOnShelf: number,
    shelfIndex: number
  ) => {
    const isHovered = hoveredBookId === book.id;
    const isLastOnShelf = index === totalOnShelf - 1;
    const isTopShelf = shelfIndex === 0;

    // Organic height variations (simulating real hardcovers on library shelves)
    const heightRatios = [0.93, 0.96, 0.90, 0.94];
    const heightRatio = heightRatios[index % heightRatios.length];

    // 3D Geometry Dimensions:
    // Front Cover width (main face)
    const coverWidthPx = Math.max(72, Math.round(82 * scale));
    // Spine thickness (perpendicular 90-degree side wall)
    const spineWidthPx = Math.max(22, Math.round(26 * scale));

    // Overlap math:
    // In resting state, each book has negative margin-right so the book to the right
    // covers its front cover, leaving only its right spine + a small edge of cover visible.
    // The rightmost book has margin-right: 0 (nothing covers it).
    const restingMarginRight = isLastOnShelf
      ? 0
      : -Math.max(42, Math.round(52 * scale));

    // On hover: margin-right expands, smoothly pushing all books to the right
    // and completely unveiling the front cover with the book title!
    const hoverMarginRight = isLastOnShelf
      ? 0
      : Math.max(6, Math.round(10 * scale));

    const marginRight = isHovered ? hoverMarginRight : restingMarginRight;

    // Stacking order:
    // Right books stack above left books (zIndex = index + 1).
    // Hovered book immediately lifts to zIndex 50!
    const zIndex = isHovered ? 50 : index + 1;

    // Typography
    const titleFontSize = Math.max(10, Math.round(11.5 * scale));
    const authorFontSize = Math.max(7.5, Math.round(8.5 * scale));
    const starFontSize = Math.max(8, Math.round(9.5 * scale));

    // Floating tooltip card dimensions
    const cardWidth = Math.max(220, Math.round(250 * scale));
    const coverThumbWidth = Math.max(38, Math.round(44 * scale));
    const coverThumbHeight = Math.max(52, Math.round(60 * scale));

    const { topColor, bottomColor, accent } = parseSpineColors(book);
    const coverUrl = sanitizeGoogleBooksCover(book.coverUrl);
    const authorLastName = book.author.split(' ').slice(-1)[0];

    return (
      <div
        key={book.id}
        className="relative select-none cursor-pointer flex flex-col justify-end shrink-0"
        style={{
          width: `${coverWidthPx}px`,
          height: `${heightRatio * 100}%`,
          marginRight: `${marginRight}px`,
          zIndex,
          perspective: '1000px',
          transition:
            'margin-right 320ms cubic-bezier(0.16, 1, 0.3, 1), z-index 0ms',
        }}
        onMouseEnter={() => setHoveredBookId(book.id)}
        onMouseLeave={() => setHoveredBookId(null)}
        onClick={() => onSelectBook(book)}
      >
        {/* 
          Hover Information Tooltip:
          Floats above the shelf without obstructing the physical book cover
        */}
        {isHovered && (
          <div
            className={`absolute ${
              isTopShelf ? 'top-[104%]' : 'bottom-[104%]'
            } left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fade-in flex flex-col items-center`}
            style={{ width: `${cardWidth}px` }}
          >
            {/* If Shelf 0, beak points up */}
            {isTopShelf && (
              <div className="w-2.5 h-2.5 rotate-45 bg-amber-400/90 -mb-1.5 shadow-md border-l border-t border-black/40 z-20" />
            )}

            {/* Tooltip Card */}
            <div className="relative w-full rounded-xl overflow-hidden border border-amber-400/90 shadow-[0_20px_45px_rgba(0,0,0,0.98)] ring-2 ring-black/80 bg-slate-950/95 backdrop-blur-md flex items-center gap-2.5 p-2 sm:p-2.5">
              <div
                className="relative rounded-md overflow-hidden shrink-0 shadow-md border border-white/20 bg-slate-900"
                style={{
                  width: `${coverThumbWidth}px`,
                  height: `${coverThumbHeight}px`,
                }}
              >
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={book.title}
                    className="w-full h-full object-cover block"
                    loading="eager"
                  />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center p-1 text-center"
                    style={{
                      background: `linear-gradient(135deg, ${topColor} 0%, #0a0a14 100%)`,
                    }}
                  >
                    <span className="text-sm">📖</span>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between min-w-0 text-left py-0.5">
                <div className="flex items-start justify-between gap-1.5">
                  <span className="font-black text-white text-xs leading-snug line-clamp-2 drop-shadow">
                    {book.title}
                  </span>
                  <div className="shrink-0 bg-amber-500/20 border border-amber-400/60 rounded px-1.5 py-0.5 flex items-center gap-1 shadow-xs">
                    <span className="text-amber-400 text-[10px] font-black leading-none">★</span>
                    <span className="text-amber-100 text-[10px] font-bold leading-none">
                      {book.overallRating}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-zinc-300 mt-0.5">
                  <span className="text-amber-300 font-semibold truncate">{book.author}</span>
                  {book.publishedYear && (
                    <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                      ({book.publishedYear} г.)
                    </span>
                  )}
                </div>

                <div className="mt-1 text-[9px] text-amber-400/80 font-medium flex items-center gap-1">
                  <span>Нажмите для подробностей</span>
                  <span>→</span>
                </div>
              </div>
            </div>

            {/* If Shelves 1, 2, 3, beak points down */}
            {!isTopShelf && (
              <div className="w-2.5 h-2.5 rotate-45 bg-amber-400/90 -mt-1.5 shadow-md border-r border-b border-black/40 z-20" />
            )}
          </div>
        )}

        {/* 
          TRUE 3D MONOLITHIC BOOK MODEL:
          - transform-style: preserve-3d
          - Resting: rotateY(-36deg) around the right edge. Viewer sees the front cover receding
            leftwards, and the perpendicular 90-degree spine on the right.
          - Hover: rotates to rotateY(-16deg), steps forward (translateZ), and expands margin-right
            to smoothly part the neighboring books.
        */}
        <div
          className="relative w-full h-full select-none"
          style={{
            transformStyle: 'preserve-3d',
            transformOrigin: 'right center',
            transform: isHovered
              ? `rotateY(-16deg) translateZ(${26 * scale}px) translateX(${10 * scale}px)`
              : 'rotateY(-36deg) translateZ(0px) translateX(0px)',
            filter: isHovered ? 'brightness(1.15)' : 'brightness(1)',
            transition:
              'transform 320ms cubic-bezier(0.16, 1, 0.3, 1), filter 320ms ease',
          }}
        >
          {/* =========================================================================
              FACE 1: FRONT COVER (Лицевая обложка)
              - Recedes into the shelf in 3D perspective
              - Clean rich leather base (NO ghosting or clipped author text)
              - Full title centered vertically without line-clamp truncation
              ========================================================================= */}
          <div
            className={`relative w-full h-full flex flex-col justify-between px-2 py-2 select-none border-t border-l border-b border-amber-400/35 rounded-l-[3px] ${
              isHovered ? 'ring-1.5 ring-amber-400/90' : ''
            }`}
            style={{
              background: `linear-gradient(135deg, ${topColor} 0%, ${bottomColor} 100%)`,
              boxShadow: isHovered
                ? `-18px 16px 36px rgba(0, 0, 0, 0.95), -6px 4px 15px rgba(0, 0, 0, 0.7), 0 0 20px ${accent}44, inset 0 0 10px rgba(0,0,0,0.85)`
                : '-4px 5px 12px rgba(0, 0, 0, 0.75), inset 0 0 10px rgba(0,0,0,0.85)',
              transition: 'box-shadow 320ms ease',
            }}
          >
            {/* Front cover surface gloss reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/12 pointer-events-none rounded-l-[3px]" />

            {/* Top Header on Cover: ONLY the rating badge (NO author text to avoid clutter/clipping) */}
            <div className="relative z-10 w-full flex justify-end items-center">
              <div className="shrink-0 bg-black/75 px-1.5 py-0.5 rounded border border-amber-400/50 flex items-center gap-1 shadow-xs">
                <span className="text-amber-400 text-[9px] font-black leading-none">★</span>
                <span className="text-amber-100 text-[9px] font-bold leading-none">
                  {book.overallRating}
                </span>
              </div>
            </div>

            {/* Center Area: Full Title completely visible without truncation */}
            <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center my-auto py-1">
              <h3
                className="font-serif font-black text-white text-center leading-[1.16] select-none break-words line-clamp-6"
                style={{
                  fontSize: `${titleFontSize}px`,
                  textShadow:
                    '0 1px 3px rgba(0,0,0,0.98), 0 0 3px rgba(0,0,0,0.9)',
                }}
              >
                {book.title}
              </h3>
            </div>

            {/* Bottom Bar: Publication Year & Decorative gold diamond */}
            <div className="relative z-10 w-full flex items-center justify-between border-t border-amber-400/30 pt-1 mt-0.5">
              <span className="text-[8px] text-zinc-300 font-mono">
                {book.publishedYear ? `${book.publishedYear} г.` : 'Клуб'}
              </span>
              <div className="w-1.5 h-1.5 rotate-45 bg-amber-400/60" />
            </div>
          </div>

          {/* =========================================================================
              FACE 2: THE SPINE (Корешок — настоящая боковая грань под 90 градусов)
              - Attached to the right edge of the front cover (left: 100%)
              - Perpendicular: transform: rotateY(90deg), transform-origin: left center
              - Width: spineWidthPx (~24-28px)
              - Faces forward/right towards the room and viewer
              ========================================================================= */}
          <div
            className="absolute top-0 bottom-0 flex flex-col justify-between overflow-hidden select-none border-t border-r border-b border-black/70 rounded-r-[2px]"
            style={{
              left: '100%',
              width: `${spineWidthPx}px`,
              transformOrigin: 'left center',
              transform: 'rotateY(90deg)',
              background: `linear-gradient(180deg, ${topColor} 0%, ${bottomColor} 100%)`,
              boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.5)',
            }}
          >
            {/* 3D Convex Lighting highlight */}
            <div
              className="absolute inset-0 pointer-events-none z-20"
              style={{
                background:
                  'linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(255,255,255,0.25) 30%, rgba(0,0,0,0.15) 75%, rgba(0,0,0,0.7) 100%)',
              }}
            />

            {/* Top Silk Headband (Каптал) */}
            <div
              className="w-full h-[2.5px] shrink-0 opacity-85 z-10"
              style={{
                background:
                  'repeating-linear-gradient(90deg, #d4af37 0px, #d4af37 2px, #2b1810 2px, #2b1810 4px)',
              }}
            />

            {/* Author Last Name at top of spine */}
            <div className="w-full text-center px-0.5 pt-1 z-10 shrink-0">
              <span
                className="font-bold tracking-widest uppercase block truncate text-amber-200/90"
                style={{
                  fontSize: `${authorFontSize}px`,
                  fontFamily: 'Georgia, serif',
                  textShadow: '0 1px 2px rgba(0,0,0,0.95)',
                }}
              >
                {authorLastName}
              </span>
            </div>

            {/* Upper Raised Rib (Бинтик) */}
            <div className="w-full px-0.5 my-0.5 shrink-0 z-10 pointer-events-none">
              <div className="w-full h-[1.5px] bg-white/20 border-b border-black/60 shadow-xs" />
            </div>

            {/* Middle Spine Accent Line */}
            <div className="flex-1 flex items-center justify-center z-10">
              <div className="w-0.5 h-full max-h-[70%] bg-amber-400/40 rounded-full" />
            </div>

            {/* Lower Raised Rib (Бинтик) */}
            <div className="w-full px-0.5 my-0.5 shrink-0 z-10 pointer-events-none">
              <div className="w-full h-[1.5px] bg-white/20 border-b border-black/60 shadow-xs" />
            </div>

            {/* Star Rating on Spine */}
            <div className="w-full flex items-center justify-center pb-1 pt-0.5 z-10 shrink-0">
              <span
                className="text-amber-400 font-bold"
                style={{ fontSize: `${starFontSize}px` }}
              >
                ★
              </span>
            </div>

            {/* Bottom Silk Headband (Каптал) */}
            <div
              className="w-full h-[2px] shrink-0 opacity-85 z-10"
              style={{
                background:
                  'repeating-linear-gradient(90deg, #d4af37 0px, #d4af37 2px, #2b1810 2px, #2b1810 4px)',
              }}
            />
          </div>

          {/* =========================================================================
              FACE 3: TOP PAGES CUT (Верхний срез страниц — монолитный стык под 90°)
              - Attached to the top edge of front cover (top: 0, left: 0)
              - Width: 100% of cover
              - Height: spineWidthPx (book thickness)
              - Folded back 90 degrees: transform: rotateX(-90deg), transform-origin: top center
              - Seamlessly closes the 3D volume between front cover and perpendicular spine!
              ========================================================================= */}
          <div
            className="absolute top-0 left-0 pointer-events-none z-30"
            style={{
              width: '100%',
              height: `${spineWidthPx}px`,
              transformOrigin: 'top center',
              transform: 'rotateX(-90deg)',
              background: '#eadecc',
              backgroundImage:
                'repeating-linear-gradient(90deg, #eadecc 0px, #cbbca5 1px, #eadecc 2px)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.25)',
              borderRight: '1px solid rgba(0,0,0,0.4)',
              borderLeft: '1px solid rgba(255,255,255,0.3)',
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col justify-between select-none">
      {/* 
        SHELF 1 (Top Cavity: y = 112 to 314, height = 202px => 26.302% of cabinet)
      */}
      <div
        className="w-full h-full flex items-end justify-start px-1"
        style={{ height: '26.302%' }}
      >
        {shelf1.map((b, i) => renderBook(b, i, shelf1.length, 0))}
      </div>

      {/* Spacing for shelf divider 1: thickness = 15px => 1.953% */}
      <div style={{ height: '1.953%' }} />

      {/* 
        SHELF 2 (Second Cavity: y = 329 to 508, height = 179px => 23.307% of cabinet)
      */}
      <div
        className="w-full h-full flex items-end justify-start px-1"
        style={{ height: '23.307%' }}
      >
        {shelf2.map((b, i) => renderBook(b, i, shelf2.length, 1))}
      </div>

      {/* Spacing for shelf divider 2: thickness = 16px => 2.083% */}
      <div style={{ height: '2.083%' }} />

      {/* 
        SHELF 3 (Third Cavity: y = 524 to 705, height = 181px => 23.568% of cabinet)
      */}
      <div
        className="w-full h-full flex items-end justify-start px-1"
        style={{ height: '23.568%' }}
      >
        {shelf3.map((b, i) => renderBook(b, i, shelf3.length, 2))}
      </div>

      {/* Spacing for shelf divider 3: thickness = 14px => 1.823% */}
      <div style={{ height: '1.823%' }} />

      {/* 
        SHELF 4 (Bottom Cavity: y = 718 to 879, height = 161px => 20.964% of cabinet)
        3 Books aligned in cascade
      */}
      <div
        className="w-full h-full flex items-end justify-start px-1"
        style={{ height: '20.964%' }}
      >
        {shelf4.map((b, i) => renderBook(b, i, 3, 3))}
      </div>
    </div>
  );
};

export default VirtualBookShelf;
