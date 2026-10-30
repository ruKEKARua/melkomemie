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

  // 15 books divided across the 4 wooden shelves of the cabinet:
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

    // Organic height variations (natural hardcover library proportions)
    const heightRatios = [0.93, 0.96, 0.89, 0.94];
    const heightRatio = heightRatios[index % heightRatios.length];

    // Width of each book in perspective (33% of shelf, overlapping to fill the shelf)
    const bookWidth = '33%';

    // Horizontal offset for overlapping books:
    // Book 0 starts at 0%
    // Book 1 starts at 22.33% (tucked 10.67% behind Book 0)
    // Book 2 starts at 44.66% (tucked 10.67% behind Book 1)
    // Book 3 starts at 67% (tucked 10.67% behind Book 2, right edge hits 100%)
    const leftPercent = `${index * 22.33}%`;

    // Natural stacking order on shelf:
    // Leftmost book has highest z-index so it overlaps the book to its right.
    // When hovered, the hovered book immediately pops to z-50 to pull in front of all books!
    const naturalZIndex = totalOnShelf - index + 5;
    const zIndex = isHovered ? 50 : naturalZIndex;

    // Slide distance to the right when pulled out of the shelf (scaled)
    const slideRightPx = Math.max(28, Math.round(38 * scale));

    // Dynamic font sizes
    const titleFontSize = Math.max(10, Math.round(12 * scale));
    const authorFontSize = Math.max(8, Math.round(9.5 * scale));
    const starFontSize = Math.max(8, Math.round(10 * scale));

    // Horizontal card dimensions
    const cardWidth = Math.max(220, Math.round(250 * scale));
    const coverThumbWidth = Math.max(38, Math.round(44 * scale));
    const coverThumbHeight = Math.max(52, Math.round(60 * scale));

    const { topColor, bottomColor, accent } = parseSpineColors(book);
    const coverUrl = sanitizeGoogleBooksCover(book.coverUrl);
    const authorLastName = book.author.split(' ').slice(-1)[0];

    // Tooltip horizontal alignment logic
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
        className="absolute bottom-0 select-none cursor-pointer flex flex-col justify-end items-center"
        style={{
          left: leftPercent,
          width: bookWidth,
          height: `${heightRatio * 100}%`,
          zIndex,
        }}
        onMouseEnter={() => setHoveredBookId(book.id)}
        onMouseLeave={() => setHoveredBookId(null)}
        onClick={() => onSelectBook(book)}
      >
        {/* 
          Hover Information Tooltip:
          - Shelves 1, 2, 3: floats above the book
          - Shelf 0: floats below the book so it never collides with the header
        */}
        {isHovered && (
          <div
            className={`absolute ${
              isTopShelf ? 'top-[103%]' : 'bottom-[103%]'
            } z-50 pointer-events-none animate-fade-in flex flex-col items-center ${tooltipAlignClass}`}
            style={{ width: `${cardWidth}px` }}
          >
            {/* If Shelf 0, beak is at the top pointing up at the book */}
            {isTopShelf && (
              <div
                className={`w-2.5 h-2.5 rotate-45 bg-amber-400/90 -mb-1.5 shadow-md border-l border-t border-black/40 z-20 ${pointerBeakAlignClass}`}
              />
            )}

            {/* Glowing Info Card */}
            <div className="relative w-full rounded-xl overflow-hidden border border-amber-400/90 shadow-[0_20px_45px_rgba(0,0,0,0.98)] ring-2 ring-black/80 bg-slate-950/95 backdrop-blur-md flex items-center gap-2.5 p-2 sm:p-2.5">
              {/* Left Cover Miniature */}
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

              {/* Right Book Details */}
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

            {/* If Shelves 1, 2, 3, beak is at the bottom pointing down at the book */}
            {!isTopShelf && (
              <div
                className={`w-2.5 h-2.5 rotate-45 bg-amber-400/90 -mt-1.5 shadow-md border-r border-b border-black/40 z-20 ${pointerBeakAlignClass}`}
              />
            )}
          </div>
        )}

        {/* 
          3D MODEL OF THE BOOK:
          - Angled in 3D perspective: Front Cover ("корочка") + Spine ("корешок") + Top Pages
          - Resting: Angled at -14deg so books tuck behind one another from left to right.
          - Hover: Slides smoothly to the RIGHT ("будто книгу вытягивают"), revealing the front cover with the title!
        */}
        <div
          className="relative w-full h-full select-none"
          style={{
            perspective: '900px',
            transformOrigin: 'bottom left',
            transform: isHovered
              ? `translateX(${slideRightPx}px) translateZ(10px) rotateY(-4deg)`
              : 'translateX(0px) translateZ(0px) rotateY(-14deg)',
            filter: isHovered ? 'brightness(1.15)' : 'brightness(1)',
            transition:
              'transform 320ms cubic-bezier(0.16, 1, 0.3, 1), filter 320ms ease',
          }}
        >
          {/* Main 3D Book Assembly */}
          <div
            className={`relative w-full h-full flex rounded-r-[3px] rounded-l-[2px] ${
              isHovered ? 'ring-1.5 ring-amber-400/90' : ''
            }`}
            style={{
              boxShadow: isHovered
                ? `-18px 14px 35px rgba(0, 0, 0, 0.95), -6px 4px 15px rgba(0, 0, 0, 0.7), 0 0 20px ${accent}44`
                : '-4px 5px 12px rgba(0, 0, 0, 0.8), -1px 1px 3px rgba(0, 0, 0, 0.6)',
              transition: 'box-shadow 320ms ease',
            }}
          >
            {/* 1. TOP PAGES CUT (Верхний срез страниц в перспективе) */}
            <div
              className="absolute -top-[7px] left-0 right-[3px] h-[8px] bg-[#eae0cf] border-t border-l border-white/40 pointer-events-none z-30"
              style={{
                transform: 'skewX(-26deg)',
                transformOrigin: 'bottom left',
                backgroundImage:
                  'repeating-linear-gradient(90deg, #eae0cf 0px, #cbbca5 1px, #eae0cf 2px)',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
              }}
            />

            {/* 
              2. THE SPINE (Корешок книги - левая грань):
              - Rounded cylindrical 3D lighting sheen
              - Top/bottom silk headbands (каптал)
              - Classical horizontal raised ribs (бинтики)
              - Author name and rating
            */}
            <div
              className="relative w-[24%] h-full flex flex-col justify-between overflow-hidden select-none border-l border-t border-b border-black/70 rounded-l-[2px]"
              style={{
                background: `linear-gradient(180deg, ${topColor} 0%, ${bottomColor} 100%)`,
                boxShadow: 'inset 2px 0 4px rgba(0,0,0,0.5)',
              }}
            >
              {/* 3D Convex Spine Cylindrical Lighting Sheen */}
              <div
                className="absolute inset-0 pointer-events-none z-20"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(255,255,255,0.25) 25%, rgba(0,0,0,0.2) 80%, rgba(0,0,0,0.7) 100%)',
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

              {/* Author at top of spine */}
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
              <div className="w-full px-0.5 my-0.5 shrink-0 z-10 pointer-events-none">
                <div className="w-full h-[1.5px] bg-white/20 border-b border-black/60 shadow-xs" />
              </div>

              {/* Spine Middle Accent Strip */}
              <div className="flex-1 flex items-center justify-center z-10">
                <div className="w-0.5 h-full max-h-[70%] bg-amber-400/40 rounded-full" />
              </div>

              {/* Lower Raised Band (Бинтик) */}
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

              {/* Right hinge crease connecting to cover */}
              <div className="absolute inset-y-0 right-0 w-[1.5px] bg-black/80 z-20 pointer-events-none" />
            </div>

            {/* 
              3. THE FRONT COVER (Корочка с титульным названием):
              - Hardcover face showing title, author, and cover artwork
              - Fully exposed on Book 0
              - Tucked partially behind preceding book on Books 1, 2, 3
              - When hovered, pulls out smoothly to the right to reveal its title!
            */}
            <div
              className="relative flex-1 h-full overflow-hidden flex flex-col justify-between p-1.5 sm:p-2 select-none border-t border-r border-b border-white/15 rounded-r-[3px]"
              style={{
                background: `linear-gradient(135deg, ${topColor} 0%, ${bottomColor} 100%)`,
                boxShadow: 'inset 2px 0 6px rgba(0,0,0,0.8)',
              }}
            >
              {/* High-res cover image backdrop if available */}
              {coverUrl && (
                <img
                  src={coverUrl}
                  alt={book.title}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-45 filter contrast-125"
                  loading="eager"
                />
              )}

              {/* Deep gradient overlay to guarantee perfect title readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-black/30 pointer-events-none z-10" />

              {/* Front Cover Glare Sheen */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none z-10" />

              {/* Top Header on Cover: Author & Rating Pill */}
              <div className="relative z-20 flex items-center justify-between gap-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300 truncate">
                  {book.author}
                </span>
                <span className="shrink-0 text-[9px] font-black text-amber-300 bg-black/60 px-1 py-0.5 rounded border border-amber-400/40 leading-none">
                  ★ {book.overallRating}
                </span>
              </div>

              {/* Center / Lower: Prominent Horizontal Title ("Титульное название") */}
              <div className="relative z-20 flex flex-col gap-0.5 my-auto py-1">
                <h3
                  className="font-serif font-black text-white leading-tight drop-shadow-md line-clamp-3"
                  style={{
                    fontSize: `${titleFontSize}px`,
                    textShadow:
                      '0 1px 3px rgba(0,0,0,0.98), 0 0 3px rgba(0,0,0,0.9)',
                  }}
                >
                  {book.title}
                </h3>
              </div>

              {/* Bottom Decorative Gold Line & Year */}
              <div className="relative z-20 flex items-center justify-between border-t border-amber-400/30 pt-1">
                <span className="text-[8px] text-zinc-300 font-mono">
                  {book.publishedYear ? `${book.publishedYear} г.` : 'Клуб'}
                </span>
                <div className="w-1.5 h-1.5 rotate-45 bg-amber-400/60" />
              </div>
            </div>
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
        className="w-full relative px-1"
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
        className="w-full relative px-1"
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
        className="w-full relative px-1"
        style={{ height: '23.568%' }}
      >
        {shelf3.map((b, i) => renderBook(b, i, shelf3.length, 2))}
      </div>

      {/* Spacing for shelf divider 3: thickness = 14px => 1.823% */}
      <div style={{ height: '1.823%' }} />

      {/* 
        SHELF 4 (Bottom Cavity: y = 718 to 879, height = 161px => 20.964% of cabinet)
        3 Books aligned with columns 0, 1, 2 of the shelves above
      */}
      <div
        className="w-full relative px-1"
        style={{ height: '20.964%' }}
      >
        {shelf4.map((b, i) => renderBook(b, i, 4, 3))}
      </div>
    </div>
  );
};

export default VirtualBookShelf;
