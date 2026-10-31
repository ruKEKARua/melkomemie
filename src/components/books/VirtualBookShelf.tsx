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

  // 6 books strictly divided across each of the 4 wooden shelves of the cabinet:
  // Shelf 1 (Top Cavity): books 0..5 (6 books)
  // Shelf 2 (Second Cavity): books 6..11 (6 books)
  // Shelf 3 (Third Cavity): books 12..17 (6 books)
  // Shelf 4 (Bottom Cavity): books 18..23 (6 books)
  const shelf1 = books.slice(0, 6);
  const shelf2 = books.slice(6, 12);
  const shelf3 = books.slice(12, 18);
  const shelf4 = books.slice(18, 24);

  const renderBook = (
    book: BookClubBook,
    index: number,
    totalOnShelf: number,
    shelfIndex: number
  ) => {
    const isHovered = hoveredBookId === book.id;
    const isLastOnShelf = index === totalOnShelf - 1;
    const isTopShelf = shelfIndex === 0;

    // Organic height variations (natural library proportions)
    const heightRatios = [0.93, 0.96, 0.90, 0.94, 0.92, 0.95];
    const heightRatio = heightRatios[index % heightRatios.length];

    // 3D Geometry Dimensions for 6 books per shelf:
    // 1. Front Cover (лицевая корочка слева, основная часть)
    const coverWidthPx = Math.max(68, Math.round(78 * scale));
    // 2. Side Spine (боковой корешок справа, ширина 14px-16px)
    const spineWidthPx = Math.max(13, Math.round(15 * scale));
    // Total book width
    const totalBookWidthPx = coverWidthPx + spineWidthPx;

    // Overlap math for 6 books:
    // Visible step for each covered book = right spine (15px) + 11px edge of cover = ~26px.
    const stepPx = Math.max(22, Math.round(26 * scale));
    const overlapPx = totalBookWidthPx - stepPx;
    const restingMarginRight = isLastOnShelf ? 0 : -overlapPx;

    // On hover: eliminated the gap between books completely!
    // The next book sits snugly against the hovered book's spine with a slight 3-4px underlap.
    // This removes the black void entirely and prevents the cursor from losing hover.
    const hoverMarginRight = isLastOnShelf
      ? 0
      : -Math.max(2, Math.round(4 * scale));

    const marginRight = isHovered ? hoverMarginRight : restingMarginRight;

    // Stacking order:
    // Right books stack above left books (zIndex = index + 1).
    // Hovered book immediately lifts to zIndex 50!
    const zIndex = isHovered ? 50 : index + 1;

    // Typography: sized to fit even the longest titles without ellipsis
    const titleFontSize = Math.max(9, Math.round(10 * scale));

    // Floating tooltip card dimensions
    const cardWidth = Math.max(215, Math.round(245 * scale));
    const coverThumbWidth = Math.max(36, Math.round(40 * scale));
    const coverThumbHeight = Math.max(48, Math.round(56 * scale));

    const { topColor, bottomColor, accent } = parseSpineColors(book);
    const coverUrl = sanitizeGoogleBooksCover(book.coverUrl);

    return (
      <div
        key={book.id}
        className="relative select-none cursor-pointer flex flex-col justify-end shrink-0"
        style={{
          width: `${totalBookWidthPx}px`,
          height: `${heightRatio * 100}%`,
          marginRight: `${marginRight}px`,
          zIndex,
          perspective: '1000px',
          transition:
            'margin-right 300ms cubic-bezier(0.16, 1, 0.3, 1), z-index 0ms',
        }}
        onMouseEnter={() => setHoveredBookId(book.id)}
        onMouseLeave={() => setHoveredBookId(null)}
        onClick={() => onSelectBook(book)}
      >
        {/* 
          Hover Information Tooltip:
          Floats above/below the shelf with pointer-events-none so it never interferes with cursor
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
              <div
                className={`w-2.5 h-2.5 rotate-45 bg-amber-400/90 -mt-1.5 shadow-md border-r border-b border-black/40 z-20`}
              />
            )}
          </div>
        )}

        {/* 
          3D BOOK VOLUME:
          - Stable horizontal position (translateX: 0px) to guarantee cursor never slips off
          - Steps forward in 3D (translateZ) and turns face towards user (rotateY: -6deg)
          - Next book touches seamlessly against the right spine with zero gap
        */}
        <div
          className="relative w-full h-full select-none"
          style={{
            transformOrigin: 'right center',
            transform: isHovered
              ? `perspective(1000px) rotateY(-6deg) translateZ(${20 * scale}px) translateX(0px) scale(1.02)`
              : 'perspective(1000px) rotateY(-18deg) translateZ(0px) translateX(0px)',
            filter: isHovered ? 'brightness(1.15)' : 'brightness(1)',
            transition:
              'transform 300ms cubic-bezier(0.16, 1, 0.3, 1), filter 300ms ease',
          }}
        >
          {/* Main Book Shell */}
          <div
            className={`relative w-full h-full flex rounded-l-[3px] rounded-r-[2px] ${
              isHovered ? 'ring-1.5 ring-amber-400/90' : ''
            }`}
            style={{
              boxShadow: isHovered
                ? `-18px 16px 36px rgba(0, 0, 0, 0.95), -6px 4px 15px rgba(0, 0, 0, 0.7), 0 0 24px ${accent}44`
                : '-5px 6px 14px rgba(0, 0, 0, 0.78), -1px 2px 4px rgba(0, 0, 0, 0.55)',
              transition: 'box-shadow 300ms ease',
            }}
          >
            {/* =========================================================================
                FACE 1: FRONT COVER (Лицевая корочка слева — винтажный переплет)
                ========================================================================= */}
            <div
              className="relative h-full flex flex-col justify-between p-1.5 select-none border-t border-l border-b border-amber-400/35 rounded-l-[3px] overflow-hidden"
              style={{
                width: `${coverWidthPx}px`,
                background: `linear-gradient(145deg, ${topColor} 0%, rgba(12,14,20,0.85) 60%, ${bottomColor} 100%)`,
                boxShadow:
                  'inset 0 0 16px rgba(0, 0, 0, 0.92), inset 2px 2px 3px rgba(255, 255, 255, 0.12), inset -2px -2px 3px rgba(0, 0, 0, 0.75)',
              }}
            >
              {/* Micro-texture stippled leather grain */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 1px, transparent 1px), radial-gradient(circle at 0% 0%, rgba(0,0,0,0.3) 1px, transparent 1px)',
                  backgroundSize: '3px 3px, 4px 4px',
                }}
              />

              {/* Diagonal front cover satin sheen */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-white/[0.12] pointer-events-none" />

              {/* Vintage Embossed Gold Border Frame */}
              <div
                className="absolute inset-[4.5px] pointer-events-none border border-amber-400/40 rounded-xs z-10"
                style={{
                  boxShadow: 'inset 0 0 4px rgba(0,0,0,0.45)',
                }}
              >
                {/* Secondary fine inner gold line */}
                <div className="absolute inset-[2px] border border-amber-300/25 rounded-2xs" />

                {/* Classic Corner Filigree Accents */}
                <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 border-t-2 border-l-2 border-amber-300/70" />
                <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 border-t-2 border-r-2 border-amber-300/70" />
                <div className="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 border-b-2 border-l-2 border-amber-300/70" />
                <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-b-2 border-r-2 border-amber-300/70" />

                {/* Background classical vignette watermark ornament */}
                <div
                  className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-14 opacity-12 pointer-events-none flex items-center justify-center text-amber-300"
                  style={{
                    backgroundImage:
                      'radial-gradient(ellipse at center, rgba(245,158,11,0.25) 0%, transparent 70%)',
                  }}
                >
                  <span className="text-2xl select-none font-serif">⚜</span>
                </div>
              </div>

              {/* Top: ONLY the rating badge */}
              <div className="relative z-20 w-full flex justify-end items-center">
                <div className="shrink-0 bg-black/80 px-1 py-0.5 rounded border border-amber-400/50 flex items-center gap-0.5 shadow-sm">
                  <span className="text-amber-400 text-[8.5px] font-black leading-none">★</span>
                  <span className="text-amber-100 text-[8.5px] font-bold leading-none">
                    {book.overallRating}
                  </span>
                </div>
              </div>

              {/* Center Area: Full Title centered vertically without cutoffs */}
              <div className="relative z-20 flex-1 flex flex-col justify-center items-center text-center my-auto px-1 py-0.5">
                <h3
                  className="font-serif font-black text-white text-center leading-[1.14] select-none break-words line-clamp-7"
                  style={{
                    fontSize: `${titleFontSize}px`,
                    textShadow:
                      '0 1px 3px rgba(0,0,0,0.98), 0 0 3px rgba(0,0,0,0.9)',
                  }}
                >
                  {book.title}
                </h3>
              </div>

              {/* Bottom: Published Year & Gold filigree marker */}
              <div className="relative z-20 w-full flex items-center justify-between border-t border-amber-400/35 pt-0.5 mt-0.5">
                <span className="text-[7.5px] text-zinc-300 font-mono">
                  {book.publishedYear ? `${book.publishedYear} г.` : 'Клуб'}
                </span>
                <div className="w-1 h-1 rotate-45 bg-amber-400/70 shadow-xs" />
              </div>
            </div>

            {/* =========================================================================
                FACE 2: THE SPINE (Боковой корешок справа — 13px-16px)
                ========================================================================= */}
            <div
              className="relative h-full flex flex-col justify-between overflow-hidden select-none border-t border-r border-b border-black/80 rounded-r-[2px]"
              style={{
                width: `${spineWidthPx}px`,
                background: `linear-gradient(180deg, ${bottomColor} 0%, rgba(10,10,16,0.98) 100%)`,
                borderLeft: '1px solid rgba(0, 0, 0, 0.95)',
                boxShadow:
                  'inset -2px 0 5px rgba(0,0,0,0.7), inset 1px 0 2px rgba(255,255,255,0.1)',
              }}
            >
              {/* 3D Cylindrical lighting sheen */}
              <div
                className="absolute inset-0 pointer-events-none z-20"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(255,255,255,0.32) 32%, rgba(255,255,255,0.1) 60%, rgba(0,0,0,0.75) 100%)',
                }}
              />

              {/* Top Silk Headband (Каптал) */}
              <div
                className="w-full h-[2.5px] shrink-0 opacity-90 z-10"
                style={{
                  background:
                    'repeating-linear-gradient(90deg, #d4af37 0px, #d4af37 2px, #2b1810 2px, #2b1810 4px)',
                  boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.6)',
                }}
              />

              {/* Upper Transverse Gold Ribs (Бинтики) */}
              <div className="w-full px-0.5 mt-2 mb-1 shrink-0 z-10 pointer-events-none flex flex-col gap-[2px]">
                <div className="w-full h-[1.5px] bg-amber-400/85 border-b border-black/80 shadow-xs" />
                <div className="w-full h-[1px] bg-amber-300/60" />
              </div>

              {/* Middle Spine Accent Strip with Gold Dots */}
              <div className="flex-1 flex flex-col items-center justify-center gap-1.5 z-10 py-1">
                <div className="w-1 h-1 rotate-45 bg-amber-400/70" />
                <div className="w-0.5 h-full max-h-[50%] bg-amber-400/40 rounded-full" />
                <div className="w-1 h-1 rotate-45 bg-amber-400/70" />
              </div>

              {/* Lower Transverse Gold Ribs (Бинтики) */}
              <div className="w-full px-0.5 mb-2 mt-1 shrink-0 z-10 pointer-events-none flex flex-col gap-[2px]">
                <div className="w-full h-[1px] bg-amber-300/60" />
                <div className="w-full h-[1.5px] bg-amber-400/85 border-b border-black/80 shadow-xs" />
              </div>

              {/* Bottom Silk Headband (Каптал) */}
              <div
                className="w-full h-[2px] shrink-0 opacity-90 z-10"
                style={{
                  background:
                    'repeating-linear-gradient(90deg, #d4af37 0px, #d4af37 2px, #2b1810 2px, #2b1810 4px)',
                  boxShadow: 'inset 0 -1px 1px rgba(0,0,0,0.6)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col justify-between select-none">
      {/* 
        SHELF 1 (Top Cavity: 6 books 0..5)
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
        SHELF 2 (Second Cavity: 6 books 6..11)
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
        SHELF 3 (Third Cavity: 6 books 12..17)
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
        SHELF 4 (Bottom Cavity: 6 books 18..23)
      */}
      <div
        className="w-full h-full flex items-end justify-start px-1"
        style={{ height: '20.964%' }}
      >
        {shelf4.map((b, i) => renderBook(b, i, shelf4.length, 3))}
      </div>
    </div>
  );
};

export default VirtualBookShelf;
