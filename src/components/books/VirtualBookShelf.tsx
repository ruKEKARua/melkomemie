import React, { useState } from 'react';
import { sanitizeGoogleBooksCover, type BookClubBook } from '../../api/bookClubData';

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

    // Organic height variations (simulating real hardcovers on library shelves)
    const heightRatios = [0.90, 0.94, 0.86, 0.92];
    const heightRatio = heightRatios[index % heightRatios.length];

    // Width as percentage of shelf width: 4 books = 22.5% each, total 90%, leaving 10% space
    const bookWidth = totalOnShelf === 4 ? '22.5%' : '22.5%';

    // 50% larger title font size as requested (scales automatically with 4K/FullHD)
    const titleFontSize = Math.max(11, Math.round(16.5 * scale));
    const starFontSize = Math.max(9, Math.round(13.5 * scale));

    // Cover preview card dimensions: compact on shelf 1 to ensure zero header clipping
    const coverWidth = shelfIndex === 0 ? Math.max(54, Math.round(68 * scale)) : Math.max(62, Math.round(78 * scale));
    const coverHeight = shelfIndex === 0 ? Math.max(80, Math.round(102 * scale)) : Math.max(92, Math.round(116 * scale));

    const coverUrl = sanitizeGoogleBooksCover(book.coverUrl);

    return (
      <div
        key={book.id}
        className={`relative group select-none cursor-pointer flex flex-col justify-end items-center ${
          isHovered ? 'z-50' : 'z-10'
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
          Floating Book Cover Preview on hover:
          Instead of just displaying the title text, displays the actual book cover artwork
          with an amber glow and club rating badge.
        */}
        {isHovered && (
          <div
            className="absolute bottom-[104%] left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center animate-fade-in"
          >
            {/* 3D Book Cover Card */}
            <div
              className="relative rounded-lg overflow-hidden border border-amber-400/90 shadow-[0_16px_36px_rgba(0,0,0,0.95)] ring-2 ring-black/70 bg-slate-950 flex flex-col items-center"
              style={{
                width: `${coverWidth}px`,
                height: `${coverHeight}px`,
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
                  className="w-full h-full flex flex-col justify-between p-1.5 text-center"
                  style={{
                    background: `linear-gradient(135deg, ${book.spineAccent} 0%, #0a0a10 90%)`,
                  }}
                >
                  <span className="text-[9px] font-bold text-amber-300 leading-tight line-clamp-3">
                    {book.title}
                  </span>
                  <span className="text-[8px] text-zinc-400 truncate">{book.author}</span>
                </div>
              )}

              {/* Bottom Subtle Rating Pill Overlay */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-3 pb-0.5 px-1 flex items-center justify-center">
                <span
                  className="font-bold text-amber-400 drop-shadow flex items-center gap-0.5 leading-none"
                  style={{ fontSize: `${Math.max(8, Math.round(10.5 * scale))}px` }}
                >
                  ★ {book.overallRating}
                </span>
              </div>
            </div>

            {/* Pointer Beak pointing straight at the pulled-out book */}
            <div className="w-2.5 h-2.5 rotate-45 bg-amber-400/90 -mt-1 shadow-md border-r border-b border-black/40" />
          </div>
        )}

        {/* 
          Upright Book Spine:
          Slides forward towards the user in 3D perspective without lifting upwards,
          casting deep shadows on adjacent books.
        */}
        <div
          className={`w-full h-full rounded-t-xs rounded-b-2xs shadow-md flex flex-col justify-between py-1 px-0.5 text-center border-l border-t border-white/25 border-r border-black/50 ${
            isHovered ? 'ring-2 ring-amber-400' : ''
          }`}
          style={{
            background: `linear-gradient(135deg, ${book.spineAccent} 0%, rgba(18,18,24,0.96) 80%)`,
            transformOrigin: 'bottom center',
            transform: isHovered
              ? `perspective(600px) translateZ(${38 * scale}px) translateY(${5 * scale}px) scale(1.15)`
              : 'perspective(600px) translateZ(0px) translateY(0px) scale(1)',
            boxShadow: isHovered
              ? '0 20px 35px rgba(0, 0, 0, 0.95), -8px 0 18px rgba(0, 0, 0, 0.7), 8px 0 18px rgba(0, 0, 0, 0.7), 0 0 18px rgba(245, 158, 11, 0.45)'
              : undefined,
            filter: isHovered ? 'brightness(1.12)' : 'brightness(1)',
            transition:
              'transform 280ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 280ms cubic-bezier(0.16, 1, 0.3, 1), filter 280ms ease',
          }}
        >
          {/* Top Decorative Spine Ribbon */}
          <div className="w-full h-0.5 bg-white/35 rounded-2xs mb-0.5" />

          {/* Vertical Book Title (+50% larger font size) */}
          <div className="flex-1 flex items-center justify-center overflow-hidden py-0.5">
            <span
              className="font-black tracking-tight leading-none truncate"
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                color: book.spineTextColor || '#ffffff',
                textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.9)',
                fontSize: `${titleFontSize}px`,
                maxHeight: '85%',
              }}
            >
              {book.title}
            </span>
          </div>

          {/* Bottom Star Rating Marker (+50% larger) */}
          <div className="w-full flex items-center justify-center pt-0.5 border-t border-white/20">
            <span
              className="font-bold text-amber-400 leading-none"
              style={{ fontSize: `${starFontSize}px` }}
            >
              ★
            </span>
          </div>

          {/* Realistic 3D Book Spine Ridge Lighting */}
          <div className="absolute inset-y-0 left-0 w-0.5 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-0.5 bg-gradient-to-l from-black/70 to-transparent pointer-events-none" />
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
        3 Books aligned with columns 1, 2, 3 of the shelves above (Catalog plaque removed)
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
