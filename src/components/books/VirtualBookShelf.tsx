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
    const isLastOnShelf = index === totalOnShelf - 1;
    const isTopShelf = shelfIndex === 0;

    // Organic height variations (natural library proportions)
    const heightRatios = [0.93, 0.96, 0.90, 0.94];
    const heightRatio = heightRatios[index % heightRatios.length];

    // Book geometry:
    // Front Cover is on the LEFT, Spine is on the RIGHT.
    // Total book width = coverWidth + spineWidth
    const bookWidthPx = Math.max(90, Math.round(102 * scale));
    const spineWidthPx = Math.max(24, Math.round(27 * scale));
    const coverWidthPx = bookWidthPx - spineWidthPx;

    // Overlap math:
    // In resting state, each book (except the last) has negative margin-right,
    // so the next book to the right overlaps its front cover.
    // Only the spine (and a tiny edge of cover) remains visible for covered books.
    // The rightmost book has no book to its right, so its cover is fully visible!
    const overlapPx = Math.max(50, Math.round(62 * scale));
    const restingMarginRight = isLastOnShelf ? 0 : -overlapPx;
    // On hover, margin-right expands to 6px, smoothly pushing all books to the right
    // and completely unveiling the front cover with the book title!
    const hoverMarginRight = isLastOnShelf ? 0 : Math.max(4, Math.round(6 * scale));

    const marginRight = isHovered ? hoverMarginRight : restingMarginRight;

    // Stacking order:
    // Books to the right overlap books to the left (zIndex increases from left to right: index + 1).
    // When hovered, the hovered book lifts to zIndex 50!
    const naturalZIndex = index + 1;
    const zIndex = isHovered ? 50 : naturalZIndex;

    // Dynamic typography
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
          width: `${bookWidthPx}px`,
          height: `${heightRatio * 100}%`,
          marginRight: `${marginRight}px`,
          zIndex,
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
              isTopShelf ? 'top-[103%]' : 'bottom-[103%]'
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
          3D MODEL OF THE BOOK:
          - Spine is on the RIGHT (faces forward/right towards viewer)
          - Front Cover is on the LEFT (recedes into the shelf in perspective via rotateY(28deg))
          - Resting: Books cascade from left to right; book to the right covers the left book's cover.
          - Hover: The hovered book steps forward (translateZ), un-angles to rotateY(10deg) so its cover
            faces the viewer, while expanding its margin-right to push right-hand books away!
        */}
        <div
          className="relative w-full h-full select-none"
          style={{
            perspective: '900px',
            transformOrigin: 'right center',
            transform: isHovered
              ? `perspective(900px) rotateY(10deg) translateZ(${22 * scale}px) translateX(${8 * scale}px)`
              : 'perspective(900px) rotateY(28deg) translateZ(0px) translateX(0px)',
            filter: isHovered ? 'brightness(1.15)' : 'brightness(1)',
            transition:
              'transform 320ms cubic-bezier(0.16, 1, 0.3, 1), filter 320ms ease',
          }}
        >
          {/* Main 3D Book Assembly */}
          <div
            className={`relative w-full h-full flex rounded-l-[3px] rounded-r-[2px] ${
              isHovered ? 'ring-1.5 ring-amber-400/90' : ''
            }`}
            style={{
              boxShadow: isHovered
                ? `-16px 14px 32px rgba(0, 0, 0, 0.95), -6px 4px 15px rgba(0, 0, 0, 0.7), 0 0 20px ${accent}44`
                : '-4px 5px 12px rgba(0, 0, 0, 0.75), -1px 1px 3px rgba(0, 0, 0, 0.5)',
              transition: 'box-shadow 320ms ease',
            }}
          >
            {/* 
              1. TOP PAGES CUT (Верхний срез страниц в перспективе):
              Connects the spine on the right to the cover receding on the left!
            */}
            <div
              className="absolute -top-[7px] right-0 left-[6px] h-[8px] bg-[#eae0cf] border-t border-r border-white/40 pointer-events-none z-30"
              style={{
                transform: 'skewX(26deg)',
                transformOrigin: 'bottom right',
                backgroundImage:
                  'repeating-linear-gradient(90deg, #eae0cf 0px, #cbbca5 1px, #eae0cf 2px)',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
              }}
            />

            {/* 
              2. FRONT COVER (Лицевая обложка с титульным названием):
              - Sits on the LEFT side of the book
              - Recedes in 3D perspective into the depth of the shelf
              - Shows horizontal title, author, year, rating, and cover artwork
              - When hovered, turns towards the viewer and is fully exposed!
            */}
            <div
              className="relative h-full overflow-hidden flex flex-col justify-between p-1.5 sm:p-2 select-none border-t border-l border-b border-white/15 rounded-l-[3px]"
              style={{
                width: `${coverWidthPx}px`,
                background: `linear-gradient(135deg, ${topColor} 0%, ${bottomColor} 100%)`,
                boxShadow: 'inset -2px 0 6px rgba(0,0,0,0.8)',
              }}
            >
              {/* Cover image backdrop if available */}
              {coverUrl && (
                <img
                  src={coverUrl}
                  alt={book.title}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-45 filter contrast-125"
                  loading="eager"
                />
              )}

              {/* High contrast gradient overlay for razor-sharp title legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-black/35 pointer-events-none z-10" />

              {/* Cover surface glare reflection */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/12 pointer-events-none z-10" />

              {/* Top: Author & Rating */}
              <div className="relative z-20 flex items-center justify-between gap-1">
                <span className="text-[8.5px] font-bold uppercase tracking-wider text-amber-300 truncate">
                  {book.author}
                </span>
                <span className="shrink-0 text-[8.5px] font-black text-amber-300 bg-black/60 px-1 py-0.5 rounded border border-amber-400/40 leading-none">
                  ★ {book.overallRating}
                </span>
              </div>

              {/* Center: Prominent Horizontal Title ("Титульное название") */}
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

              {/* Bottom: Published Year & Gold filigree marker */}
              <div className="relative z-20 flex items-center justify-between border-t border-amber-400/30 pt-1">
                <span className="text-[8px] text-zinc-300 font-mono">
                  {book.publishedYear ? `${book.publishedYear} г.` : 'Клуб'}
                </span>
                <div className="w-1.5 h-1.5 rotate-45 bg-amber-400/60" />
              </div>

              {/* Dark crease line connecting cover to the spine on the right */}
              <div className="absolute inset-y-0 right-0 w-[1.5px] bg-black/85 z-20 pointer-events-none" />
            </div>

            {/* 
              3. THE SPINE (Корешок книги):
              - Sits on the RIGHT side of the book (facing viewer/room)
              - Rounded right edge
              - Authentic cylindrical lighting highlight
              - Top/bottom silk headbands (каптал)
              - Embossed raised ribs (бинтики)
              - Author last name & Star rating
            */}
            <div
              className="relative h-full flex flex-col justify-between overflow-hidden select-none border-r border-t border-b border-black/70 rounded-r-[2px]"
              style={{
                width: `${spineWidthPx}px`,
                background: `linear-gradient(180deg, ${topColor} 0%, ${bottomColor} 100%)`,
                boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.5)',
              }}
            >
              {/* 3D Convex Spine Cylindrical Lighting Sheen */}
              <div
                className="absolute inset-0 pointer-events-none z-20"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(255,255,255,0.25) 30%, rgba(0,0,0,0.15) 75%, rgba(0,0,0,0.7) 100%)',
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
                    fontFamily: 'Georgia, serif',
                    textShadow: '0 1px 2px rgba(0,0,0,0.95)',
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
