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

    // Stacking order:
    // Hovered book lifts to zIndex 50 so its elevated 3D cover floats cleanly over everything
    const zIndex = isHovered ? 50 : index + 1;

    // Typography
    const titleFontSize = Math.max(9, Math.round(10.5 * scale));
    const spineTitleFontSize = Math.max(9, Math.round(10 * scale));

    // Floating tooltip card dimensions
    const cardWidth = Math.max(205, Math.round(235 * scale));
    const coverThumbWidth = Math.max(34, Math.round(38 * scale));
    const coverThumbHeight = Math.max(46, Math.round(52 * scale));

    // Strict boundary containment for tooltip:
    // Left books align flush-left, right books flush-right, middle books center
    const tooltipAlignClass =
      index <= 1
        ? 'left-0'
        : index >= totalOnShelf - 2
        ? 'right-0'
        : 'left-1/2 -translate-x-1/2';

    const pointerBeakAlignClass =
      index <= 1
        ? 'left-4'
        : index >= totalOnShelf - 2
        ? 'right-4'
        : 'left-1/2 -translate-x-1/2';

    const { topColor, bottomColor, accent } = parseSpineColors(book);
    const coverUrl = sanitizeGoogleBooksCover(book.coverUrl);

    // Dynamic slot width seamlessly includes gapPx without dead zones between hitboxes
    const slotWidth =
      (isHovered ? totalExpandedWidthPx : spineWidthPx) + (isLastOnShelf ? 0 : gapPx);

    return (
      <div
        key={book.id}
        className="relative select-none cursor-pointer flex flex-col justify-end shrink-0 opacity-100 box-border"
        style={{
          width: `${slotWidth}px`,
          height: '100%',
          paddingRight: isLastOnShelf ? 0 : `${gapPx}px`,
          zIndex,
          perspective: '1000px',
          opacity: 1,
          willChange: 'width',
          transition: isHovered
            ? 'width 180ms cubic-bezier(0.2, 0, 0, 1), z-index 0ms'
            : 'width 160ms cubic-bezier(0.25, 1, 0.5, 1), z-index 0ms',
        }}
        onMouseEnter={() => setHoveredBookId(book.id)}
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
            } ${tooltipAlignClass} z-50 pointer-events-none animate-fade-in flex flex-col items-center`}
            style={{ width: `${cardWidth}px` }}
          >
            {/* If Shelf 0, beak points up */}
            {isTopShelf && (
              <div
                className={`w-2.5 h-2.5 rotate-45 bg-amber-400/90 -mb-1.5 shadow-md border-l border-t border-black/40 z-20 ${pointerBeakAlignClass}`}
              />
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
                className={`w-2.5 h-2.5 rotate-45 bg-amber-400/90 -mt-1.5 shadow-md border-r border-b border-black/40 z-20 ${pointerBeakAlignClass}`}
              />
            )}
          </div>
        )}

        {/* 
          3D BOOK VOLUME:
          - Both Spine and Front Cover exist simultaneously in true 3D (transform-style: preserve-3d)
          - In resting state: Spine (0deg) faces forward, Front Cover (90deg) is perpendicular in shelf depth
          - On hover: Spine turns away (-90deg) and naturally disappears into the shelf depth (backface-hidden),
            while Front Cover swings forward (0deg) facing the viewer!
          - The book volume elevates slightly forward (-5deg isometric tilt, translateZ) with rich drop shadow
          - Accordion: outer container widens to coverWidth, smoothly pushing neighbor books to the right
        */}
        <div
          className="relative w-full select-none"
          style={{
            height: `${heightRatio * 100}%`,
            transformStyle: 'preserve-3d',
            transformOrigin: 'left center',
            transform: isHovered
              ? `rotateY(-5deg) translateZ(${14 * scale}px) scale(1.02)`
              : 'rotateY(0deg) translateZ(0px)',
            filter: isHovered ? 'brightness(1.15)' : 'brightness(1)',
            boxShadow: isHovered
              ? `-14px 12px 28px rgba(0, 0, 0, 0.95), -4px 4px 12px rgba(0, 0, 0, 0.7), 0 0 20px ${accent}44`
              : 'none',
            willChange: 'transform',
            transition: isHovered
              ? 'transform 180ms cubic-bezier(0.2, 0, 0, 1), box-shadow 180ms ease, filter 180ms ease'
              : 'transform 160ms cubic-bezier(0.25, 1, 0.5, 1), box-shadow 160ms ease, filter 160ms ease',
          }}
        >
          {/* =========================================================================
              FACE 1: THE SPINE (Корешок — виден в обычном состоянии при rotateY(0deg),
              естественное цилиндрическое закругление, при наведении скрывается на -90deg)
              ========================================================================= */}
          <div
            className="absolute top-0 left-0 h-full flex flex-col justify-between items-center overflow-hidden select-none border border-amber-400/50 rounded-[4px] opacity-100"
            style={{
              width: `${spineWidthPx}px`,
              transformOrigin: 'left center',
              transform: isHovered ? 'rotateY(-90deg)' : 'rotateY(0deg)',
              backfaceVisibility: 'hidden',
              pointerEvents: isHovered ? 'none' : 'auto',
              background: `linear-gradient(180deg, ${topColor} 0%, #0c0e14 60%, ${bottomColor} 100%)`,
              boxShadow: isHovered
                ? 'inset -2px 0 5px rgba(0,0,0,0.7), inset 1px 0 2px rgba(255,255,255,0.1)'
                : 'inset 3px 0 6px rgba(0, 0, 0, 0.8), inset -3px 0 6px rgba(0, 0, 0, 0.8), inset 0 0 2px rgba(255, 255, 255, 0.18), -2px 3px 8px rgba(0,0,0,0.85)',
              padding: '2px 2px',
              willChange: 'transform',
              transition: isHovered
                ? 'transform 180ms cubic-bezier(0.2, 0, 0, 1), box-shadow 180ms ease'
                : 'transform 160ms cubic-bezier(0.25, 1, 0.5, 1), box-shadow 160ms ease',
            }}
          >
            {/* 3D Cylindrical lighting sheen with smooth radial convex falloff */}
            <div
              className="absolute inset-0 pointer-events-none z-20 rounded-[4px]"
              style={{
                background:
                  'linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(255,255,255,0.24) 28%, rgba(255,255,255,0.07) 55%, rgba(0,0,0,0.7) 100%)',
              }}
            />

            {/* Top Silk Headband (Каптал) */}
            <div
              className="w-full h-[2.5px] shrink-0 opacity-90 z-10 rounded-t-[2px]"
              style={{
                background:
                  'repeating-linear-gradient(90deg, #d4af37 0px, #d4af37 2px, #2b1810 2px, #2b1810 4px)',
                boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.6)',
              }}
            />

            {/* Upper Transverse Gold Rib (Бинтик) */}
            <div className="w-full px-0.5 mt-1.5 mb-1 shrink-0 z-10 pointer-events-none flex flex-col gap-[1px]">
              <div className="w-full h-[1.5px] bg-amber-400/80 shadow-xs rounded-xs" />
              <div className="w-full h-[1px] bg-amber-300/50" />
            </div>

            {/* По центру: название книги вертикально (writing-mode: vertical-rl) с максимальным вертикальным пространством */}
            <div className="flex-1 flex items-center justify-center overflow-hidden py-1 px-0.5 z-10">
              <span
                className="select-none font-serif font-black text-white leading-none text-center"
                style={{
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxHeight: '100%',
                  fontSize: `${spineTitleFontSize}px`,
                  letterSpacing: '0.04em',
                  textShadow: '0 1px 2px rgba(0,0,0,0.98), 0 0 3px rgba(0,0,0,0.9)',
                }}
                title={book.title}
              >
                {book.title}
              </span>
            </div>

            {/* Lower Transverse Gold Rib (Бинтик) */}
            <div className="w-full px-0.5 mb-1 mt-1 shrink-0 z-10 pointer-events-none flex flex-col gap-[1px]">
              <div className="w-full h-[1px] bg-amber-300/50" />
              <div className="w-full h-[1.5px] bg-amber-400/80 shadow-xs rounded-xs" />
            </div>

            {/* Снизу: компактный горизонтальный бейдж с рейтингом книги (вместо постера) */}
            <div className="shrink-0 bg-black/85 border border-amber-400/70 rounded px-1.5 py-0.5 flex items-center justify-center gap-1 shadow-sm mb-1 z-10">
              <span className="text-amber-400 text-[8.5px] font-black leading-none">★</span>
              <span className="text-amber-100 text-[8.5px] font-bold leading-none font-mono">
                {book.overallRating}
              </span>
            </div>

            {/* Bottom Silk Headband (Каптал) */}
            <div
              className="w-full h-[2.5px] shrink-0 opacity-90 z-10 rounded-b-[2px]"
              style={{
                background:
                  'repeating-linear-gradient(90deg, #d4af37 0px, #d4af37 2px, #2b1810 2px, #2b1810 4px)',
                boxShadow: 'inset 0 -1px 1px rgba(0,0,0,0.6)',
              }}
            />
          </div>

          {/* =========================================================================
              FACE 2: FRONT COVER (Лицевая обложка)
              - Примыкает к правой части книжки в обычном состоянии
              - При наведении поворачивается лицом к зрителю
              - Слева слегка выпирает закруглённая корочка/рубчик, как у настоящих книг
              ========================================================================= */}
          <div
            className={`absolute top-0 h-full flex flex-col justify-between p-2 select-none border border-amber-400/60 rounded-r-[3px] rounded-l-[1px] overflow-visible ${
              isHovered ? 'ring-1.5 ring-amber-400/90' : ''
            }`}
            style={{
              left: `${hingeWidthPx}px`,
              width: `${coverWidthPx}px`,
              transformOrigin: 'left center',
              transform: isHovered
                ? 'translateX(0px) rotateY(0deg)'
                : `translateX(${spineWidthPx - hingeWidthPx}px) rotateY(90deg)`,
              backfaceVisibility: 'hidden',
              pointerEvents: isHovered ? 'auto' : 'none',
              background: `linear-gradient(145deg, ${topColor} 0%, #0c0e14 60%, ${bottomColor} 100%)`,
              boxShadow:
                'inset 0 0 16px rgba(0, 0, 0, 0.92), inset 2px 2px 3px rgba(255, 255, 255, 0.12), inset -2px -2px 3px rgba(0, 0, 0, 0.75)',
              willChange: 'transform',
              transition: isHovered
                ? 'transform 180ms cubic-bezier(0.2, 0, 0, 1), box-shadow 180ms ease'
                : 'transform 160ms cubic-bezier(0.25, 1, 0.5, 1), box-shadow 160ms ease',
            }}
          >
            {/* Слева: слегка выпирающая закруглённая корочка/рубчик переплёта, как у настоящих книг */}
            <div
              className="absolute top-0 pointer-events-none z-10 rounded-l-[4px] flex flex-col justify-between"
              style={{
                left: `-${hingeWidthPx}px`,
                width: `${hingeWidthPx}px`,
                height: '100%',
                background: `linear-gradient(90deg, rgba(0,0,0,0.85) 0%, ${topColor} 45%, #080a0f 100%)`,
                borderTop: '1px solid rgba(245, 158, 11, 0.5)',
                borderLeft: '1px solid rgba(245, 158, 11, 0.75)',
                borderBottom: '1px solid rgba(245, 158, 11, 0.5)',
                boxShadow:
                  '-3px 0 6px rgba(0,0,0,0.9), inset 1px 0 2px rgba(255,255,255,0.22)',
              }}
            >
              {/* Верхний каптал на выпирающей корочке */}
              <div
                className="w-full h-[2.5px] rounded-tl-[2px] opacity-90"
                style={{
                  background:
                    'repeating-linear-gradient(90deg, #d4af37 0px, #d4af37 2px, #2b1810 2px, #2b1810 4px)',
                }}
              />
              {/* Нижний каптал на выпирающей корочке */}
              <div
                className="w-full h-[2.5px] rounded-bl-[2px] opacity-90"
                style={{
                  background:
                    'repeating-linear-gradient(90deg, #d4af37 0px, #d4af37 2px, #2b1810 2px, #2b1810 4px)',
                }}
              />
            </div>
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
        </div>
      </div>
    );
  };
  return (
    <div className="w-full h-full flex flex-col justify-between select-none">
      {/* 
        SHELF 1 (Top Cavity: 6 books 0..5)
        Strict containment: max-width 100%, box-sizing border-box, padding 0 12px
      */}
      <div
        className="w-full max-w-full box-border flex items-end justify-start select-none"
        style={{
          height: '26.302%',
          padding: '0 12px',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="flex items-end h-full select-none"
          onMouseLeave={() => setHoveredBookId(null)}
        >
          {shelf1.map((b, i) => renderBook(b, i, shelf1.length, 0))}
        </div>
      </div>

      {/* Spacing for shelf divider 1: thickness = 15px => 1.953% */}
      <div style={{ height: '1.953%' }} />

      {/* 
        SHELF 2 (Second Cavity: 6 books 6..11)
      */}
      <div
        className="w-full max-w-full box-border flex items-end justify-start select-none"
        style={{
          height: '23.307%',
          padding: '0 12px',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="flex items-end h-full select-none"
          onMouseLeave={() => setHoveredBookId(null)}
        >
          {shelf2.map((b, i) => renderBook(b, i, shelf2.length, 1))}
        </div>
      </div>

      {/* Spacing for shelf divider 2: thickness = 16px => 2.083% */}
      <div style={{ height: '2.083%' }} />

      {/* 
        SHELF 3 (Third Cavity: 6 books 12..17)
      */}
      <div
        className="w-full max-w-full box-border flex items-end justify-start select-none"
        style={{
          height: '23.568%',
          padding: '0 12px',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="flex items-end h-full select-none"
          onMouseLeave={() => setHoveredBookId(null)}
        >
          {shelf3.map((b, i) => renderBook(b, i, shelf3.length, 2))}
        </div>
      </div>

      {/* Spacing for shelf divider 3: thickness = 14px => 1.823% */}
      <div style={{ height: '1.823%' }} />

      {/* 
        SHELF 4 (Bottom Cavity: 6 books 18..23)
      */}
      <div
        className="w-full max-w-full box-border flex items-end justify-start select-none"
        style={{
          height: '20.964%',
          padding: '0 12px',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="flex items-end h-full select-none"
          onMouseLeave={() => setHoveredBookId(null)}
        >
          {shelf4.map((b, i) => renderBook(b, i, shelf4.length, 3))}
        </div>
      </div>
    </div>
  );
};

export default VirtualBookShelf;
