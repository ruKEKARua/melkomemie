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
    const isTopShelf = shelfIndex === 0;

    // Organic height variations (simulating real hardcovers on library shelves)
    const heightRatios = [0.92, 0.96, 0.88, 0.94];
    const heightRatio = heightRatios[index % heightRatios.length];

    // Width as percentage of shelf width: 4 books = 22.5% each, total 90%, leaving 10% space
    const bookWidth = '22.5%';

    // Slide distance to the right on hover (scaled)
    const slideRightDistance = Math.max(16, Math.round(20 * scale));

    // Dynamic scaled dimensions for fonts and elements
    const spineTitleFontSize = Math.max(11, Math.round(14 * scale));
    const authorFontSize = Math.max(8, Math.round(9.5 * scale));
    const starFontSize = Math.max(9, Math.round(11 * scale));
    const ratingFontSize = Math.max(8, Math.round(10 * scale));

    // Horizontal title card popup dimensions
    const cardWidth = Math.max(230, Math.round(270 * scale));
    const coverThumbWidth = Math.max(42, Math.round(48 * scale));
    const coverThumbHeight = Math.max(58, Math.round(66 * scale));
    const cardTitleFontSize = Math.max(12, Math.round(14 * scale));
    const cardAuthorFontSize = Math.max(10, Math.round(11.5 * scale));

    const { topColor, bottomColor, accent } = parseSpineColors(book);
    const coverUrl = sanitizeGoogleBooksCover(book.coverUrl);
    const authorLastName = book.author.split(' ').slice(-1)[0];

    // Tooltip horizontal alignment logic:
    // Leftmost book (index 0) stays flush left to avoid clipping.
    // Rightmost book (index 3) stays flush right.
    // Middle books center over the book.
    const tooltipAlignClass =
      index === 0
        ? 'left-0'
        : index === totalOnShelf - 1
        ? 'right-0'
        : 'left-1/2 -translate-x-1/2';

    const pointerBeakAlignClass =
      index === 0
        ? 'left-6'
        : index === totalOnShelf - 1
        ? 'right-6'
        : 'left-1/2 -translate-x-1/2';

    return (
      <div
        key={book.id}
        className={`relative group select-none cursor-pointer flex flex-col justify-end items-center ${
          isHovered ? 'z-40' : 'z-10'
        }`}
        style={{
          width: bookWidth,
          height: `${heightRatio * 100}%`,
        }}
        onMouseEnter={() => setHoveredBookId(book.id)}
        onMouseLeave={() => setHoveredBookId(null)}
        onClick={() => onSelectBook(book)}
      >
        {/* 
          Horizontal Title & Book Info Card on hover:
          Comfortable, instant horizontal reading with cover artwork, full title, author, and rating.
        */}
        {isHovered && (
          <div
            className={`absolute ${
              isTopShelf ? 'bottom-[102%]' : 'bottom-[104%]'
            } z-50 pointer-events-none animate-fade-in flex flex-col items-center ${tooltipAlignClass}`}
            style={{ width: `${cardWidth}px` }}
          >
            {/* Glowing Card */}
            <div
              className="relative w-full rounded-xl overflow-hidden border border-amber-400/90 shadow-[0_20px_45px_rgba(0,0,0,0.98)] ring-2 ring-black/80 bg-slate-950/95 backdrop-blur-md flex items-center gap-2.5 p-2 sm:p-2.5"
            >
              {/* Left: Book Cover Miniature */}
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
                <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none" />
              </div>

              {/* Right: Book Details with Large Horizontal Title */}
              <div className="flex-1 flex flex-col justify-between min-w-0 text-left py-0.5">
                {/* Title & Rating */}
                <div className="flex items-start justify-between gap-1.5">
                  <span
                    className="font-black text-white leading-snug line-clamp-2 drop-shadow"
                    style={{ fontSize: `${cardTitleFontSize}px` }}
                  >
                    {book.title}
                  </span>
                  <div className="shrink-0 bg-amber-500/20 border border-amber-400/60 rounded px-1.5 py-0.5 flex items-center gap-1 shadow-xs">
                    <span className="text-amber-400 text-[10px] font-black leading-none">★</span>
                    <span className="text-amber-100 text-[10px] font-bold leading-none">
                      {book.overallRating}
                    </span>
                  </div>
                </div>

                {/* Author & Year */}
                <div
                  className="flex items-center gap-1 text-zinc-300 mt-1"
                  style={{ fontSize: `${cardAuthorFontSize}px` }}
                >
                  <span className="text-amber-300 font-semibold truncate">{book.author}</span>
                  {book.publishedYear && (
                    <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                      ({book.publishedYear} г.)
                    </span>
                  )}
                </div>

                {/* Action Hint */}
                <div className="mt-1 text-[9px] text-amber-400/80 font-medium flex items-center gap-1">
                  <span>Нажмите для подробностей</span>
                  <span>→</span>
                </div>
              </div>
            </div>

            {/* Pointer Beak pointing down directly at the book */}
            <div
              className={`w-2.5 h-2.5 rotate-45 bg-amber-400/90 -mt-1.5 shadow-md border-r border-b border-black/40 z-20 ${pointerBeakAlignClass}`}
            />
          </div>
        )}

        {/* 
          Authentic Hardcover Book Volume:
          - On hover: Smoothly slides slightly to the RIGHT out of the shelf row ("выезжает вправо")
          - 3D curved spine lighting and leather/cloth grain
          - Classical horizontal raised bands (бинтики)
          - Silk headbands (каптал) at top and bottom
          - Elegant vertical title typography running top-to-bottom (Russian standard, perfectly legible)
          - Gold embossed author and rating
        */}
        <div
          className="relative w-full h-full select-none"
          style={{
            transformOrigin: 'bottom center',
            transform: isHovered ? `translateX(${slideRightDistance}px)` : 'translateX(0px)',
            filter: isHovered ? 'brightness(1.12)' : 'brightness(1)',
            transition:
              'transform 280ms cubic-bezier(0.16, 1, 0.3, 1), filter 280ms ease',
          }}
        >
          <div
            className={`relative w-full h-full flex flex-col justify-between overflow-hidden rounded-t-[3px] rounded-b-[2px] select-none border-l border-t ${
              isHovered ? 'ring-1.5 ring-amber-400/90' : ''
            }`}
            style={{
              background: `linear-gradient(180deg, ${topColor} 0%, ${bottomColor} 100%)`,
              borderColor: isHovered ? '#fbbf24' : 'rgba(255, 255, 255, 0.22)',
              borderRight: '1px solid rgba(0, 0, 0, 0.75)',
              borderBottom: '1px solid rgba(0, 0, 0, 0.85)',
              boxShadow: isHovered
                ? `-10px 8px 22px rgba(0, 0, 0, 0.9), 0 4px 12px rgba(0, 0, 0, 0.7), 0 0 16px ${accent}44`
                : '0 3px 8px rgba(0, 0, 0, 0.65), -1px 0 2px rgba(0, 0, 0, 0.4), inset 1px 0 2px rgba(255, 255, 255, 0.15)',
              transition: 'box-shadow 280ms ease, border-color 280ms ease',
            }}
          >
            {/* 3D Convex Spine Cylindrical Lighting Sheen */}
            <div
              className="absolute inset-0 pointer-events-none z-20"
              style={{
                background:
                  'linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(255,255,255,0.2) 18%, rgba(255,255,255,0.06) 40%, rgba(0,0,0,0.15) 75%, rgba(0,0,0,0.65) 100%)',
                boxShadow: 'inset 2px 0 3px rgba(0,0,0,0.4), inset -2px 0 4px rgba(0,0,0,0.6)',
              }}
            />

            {/* 1. TOP EDGE: Woven Silk Headband (Каптал) */}
            <div
              className="w-full h-[2.5px] shrink-0 opacity-85 z-10"
              style={{
                background:
                  'repeating-linear-gradient(90deg, #d4af37 0px, #d4af37 2px, #2b1810 2px, #2b1810 4px)',
                boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.6)',
              }}
            />

            {/* 2. TOP SECTION: Author's Name in Gold Capitals */}
            <div className="w-full text-center px-0.5 pt-1 z-10 shrink-0">
              <span
                className="font-bold tracking-widest uppercase block truncate text-amber-200/90"
                style={{
                  fontSize: `${authorFontSize}px`,
                  textShadow: '0 1px 2px rgba(0,0,0,0.95)',
                  fontFamily: 'Georgia, serif',
                }}
              >
                {authorLastName}
              </span>
            </div>

            {/* Upper Raised Band (Бинтик) */}
            <div className="w-full px-1 my-0.5 shrink-0 z-10 pointer-events-none">
              <div className="w-full h-[1.5px] bg-white/20 border-b border-black/60 shadow-[0_1px_1px_rgba(0,0,0,0.4)]" />
            </div>

            {/* 3. MIDDLE SECTION: Elegant Title Plaque with Natural Top-to-Bottom Typography */}
            <div className="flex-1 w-full flex items-center justify-center my-0.5 px-0.5 z-10 overflow-hidden">
              <div
                className="w-full h-full max-h-[92%] flex items-center justify-center rounded-xs px-0.5 border border-amber-400/35 bg-black/25 relative overflow-hidden"
                style={{
                  boxShadow: 'inset 0 0 6px rgba(0,0,0,0.6)',
                }}
              >
                {/* Classical Gold Corner Accents */}
                <div className="absolute top-0.5 left-0.5 w-1 h-1 border-t border-l border-amber-300/60" />
                <div className="absolute top-0.5 right-0.5 w-1 h-1 border-t border-r border-amber-300/60" />
                <div className="absolute bottom-0.5 left-0.5 w-1 h-1 border-b border-l border-amber-300/60" />
                <div className="absolute bottom-0.5 right-0.5 w-1 h-1 border-b border-r border-amber-300/60" />

                {/* Vertical Book Title running top-to-bottom naturally (Russian standard, no 180deg flip!) */}
                <span
                  className="font-serif font-black tracking-wide text-amber-100 select-none truncate"
                  style={{
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    fontSize: `${spineTitleFontSize}px`,
                    textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 2px rgba(251,191,36,0.35)',
                    maxHeight: '94%',
                    lineHeight: 1.1,
                  }}
                >
                  {book.title}
                </span>
              </div>
            </div>

            {/* Lower Raised Band (Бинтик) */}
            <div className="w-full px-1 my-0.5 shrink-0 z-10 pointer-events-none">
              <div className="w-full h-[1.5px] bg-white/20 border-b border-black/60 shadow-[0_1px_1px_rgba(0,0,0,0.4)]" />
            </div>

            {/* 4. BOTTOM SECTION: Gold Star & Club Rating */}
            <div className="w-full flex flex-col items-center justify-center pb-1 pt-0.5 z-10 shrink-0 border-t border-white/10">
              <div className="flex items-center gap-0.5 leading-none">
                <span
                  className="text-amber-400 font-bold"
                  style={{ fontSize: `${starFontSize}px` }}
                >
                  ★
                </span>
                <span
                  className="font-black text-amber-100 leading-none"
                  style={{
                    fontSize: `${ratingFontSize}px`,
                    textShadow: '0 1px 2px rgba(0,0,0,0.9)',
                  }}
                >
                  {book.overallRating}
                </span>
              </div>
            </div>

            {/* 5. BOTTOM EDGE: Woven Silk Tailband (Каптал) */}
            <div
              className="w-full h-[2px] shrink-0 opacity-85 z-10"
              style={{
                background:
                  'repeating-linear-gradient(90deg, #d4af37 0px, #d4af37 2px, #2b1810 2px, #2b1810 4px)',
                boxShadow: 'inset 0 -1px 1px rgba(0,0,0,0.6)',
              }}
            />
          </div>
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
        className="w-full flex items-end justify-between px-1"
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
        className="w-full flex items-end justify-between px-1"
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
        className="w-full flex items-end justify-between px-1"
        style={{ height: '23.568%' }}
      >
        {shelf3.map((b, i) => renderBook(b, i, shelf3.length, 2))}
      </div>

      {/* Spacing for shelf divider 3: thickness = 14px => 1.823% */}
      <div style={{ height: '1.823%' }} />

      {/* 
        SHELF 4 (Bottom Cavity: y = 718 to 879, height = 161px => 20.964% of cabinet)
        3 Books aligned with columns 1, 2, 3 of the shelves above
      */}
      <div
        className="w-full flex items-end justify-start gap-[3.33%] px-1"
        style={{ height: '20.964%' }}
      >
        {shelf4.map((b, i) => renderBook(b, i, 4, 3))}
      </div>
    </div>
  );
};

export default VirtualBookShelf;
