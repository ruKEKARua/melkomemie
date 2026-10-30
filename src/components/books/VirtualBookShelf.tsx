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

    // +50% larger title font size as requested
    const titleFontSize = Math.max(12, Math.round(16.5 * scale));
    const starFontSize = Math.max(10, Math.round(13.5 * scale));

    // Full-sized poster preview dimensions (matching a real movie/book poster)
    const posterWidth = Math.max(185, Math.round(210 * scale));
    const posterHeight = Math.max(270, Math.round(305 * scale));

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
          Full-Sized Book Poster on hover (matching Screenshot 2 balloon):
          - Shelves 2, 3, 4: Floats directly above the book, pointing down at it.
          - Shelf 1: Floats immediately to the right of the book/shelf into the open room, pointing left to the book.
        */}
        {isHovered && (
          <div
            className={`absolute z-50 pointer-events-none animate-fade-in ${
              shelfIndex === 0
                ? 'top-0 left-[105%] flex items-center'
                : 'bottom-[104%] left-1/2 -translate-x-1/2 flex flex-col items-center'
            }`}
          >
            {/* If Shelf 1, beak is on the left */}
            {shelfIndex === 0 && (
              <div className="w-3 h-3 rotate-45 bg-amber-400/90 -mr-1.5 shadow-md border-l border-b border-black/40 z-20 shrink-0" />
            )}

            {/* Full-Sized Poster Card */}
            <div
              className="relative rounded-2xl overflow-hidden border-2 border-amber-400/90 shadow-[0_25px_60px_rgba(0,0,0,0.98)] ring-4 ring-black/80 bg-slate-950 flex flex-col justify-between"
              style={{
                width: `${posterWidth}px`,
                height: `${posterHeight}px`,
              }}
            >
              {/* High-res Book Cover Image */}
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={book.title}
                  className="w-full h-full object-cover block"
                  loading="eager"
                />
              ) : (
                <div
                  className="w-full h-full flex flex-col justify-between p-4 text-center"
                  style={{
                    background: `linear-gradient(135deg, ${book.spineAccent} 0%, #0a0a14 90%)`,
                  }}
                >
                  <span className="text-sm font-bold text-amber-300 leading-tight">
                    {book.title}
                  </span>
                  <span className="text-xs text-zinc-400">{book.author}</span>
                </div>
              )}

              {/* Top-Right Glowing Rating Badge */}
              <div className="absolute top-2.5 right-2.5 bg-slate-950/90 backdrop-blur-md border border-amber-400/80 rounded-full px-2.5 py-1 flex items-center gap-1 shadow-lg">
                <span className="text-amber-400 text-xs font-black">★</span>
                <span className="text-white text-xs font-bold leading-none">{book.overallRating}</span>
              </div>

              {/* Bottom Info Gradient Overlay */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-8 pb-3 px-3 flex flex-col gap-0.5 text-left">
                <span className="text-sm font-black text-white leading-tight drop-shadow truncate">
                  {book.title}
                </span>
                <div className="flex items-center justify-between text-xs text-zinc-300">
                  <span className="text-amber-300 font-semibold truncate">{book.author}</span>
                  {book.publishedYear && (
                    <span className="text-[10px] text-zinc-400 font-mono">{book.publishedYear} г.</span>
                  )}
                </div>
              </div>
            </div>

            {/* If Shelves 2, 3, 4, beak is at the bottom pointing down to the book */}
            {shelfIndex !== 0 && (
              <div className="w-3 h-3 rotate-45 bg-amber-400/90 -mt-1.5 shadow-md border-r border-b border-black/40 z-20" />
            )}
          </div>
        )}

        {/* 
          3D Book Assembly (Matching Screenshot 2):
          - Left: Cover page ("слева страницу обложки") with large title and dark hardcover
          - Right: Red / accent spine ribbon strip with star
          - Top: White / parchment cut pages block
          - On hover: Slides forward towards the user in 3D perspective without lifting
        */}
        <div
          className="relative w-full h-full flex items-end justify-center select-none"
          style={{
            transformOrigin: 'bottom center',
            transform: isHovered
              ? `perspective(800px) translateZ(${40 * scale}px) translateY(${6 * scale}px) scale(1.14)`
              : 'perspective(800px) translateZ(0px) translateY(0px) scale(1)',
            filter: isHovered ? 'brightness(1.15)' : 'brightness(1)',
            transition: 'transform 280ms cubic-bezier(0.16, 1, 0.3, 1), filter 280ms ease',
          }}
        >
          <div
            className={`relative w-full h-full flex items-end ${
              isHovered ? 'ring-2 ring-amber-400 rounded-sm' : ''
            }`}
            style={{
              boxShadow: isHovered
                ? '0 25px 45px rgba(0, 0, 0, 0.95), -12px 0 24px rgba(0, 0, 0, 0.8), 12px 0 24px rgba(0, 0, 0, 0.8), 0 0 20px rgba(245, 158, 11, 0.45)'
                : '0 4px 10px rgba(0, 0, 0, 0.7)',
              transition: 'box-shadow 280ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* 1. TOP PAGES BLOCK (Cut paper top in perspective) */}
            <div
              className="absolute -top-2 left-0 right-[28%] h-2.5 bg-[#eae2d3] border-t border-l border-white/40 pointer-events-none"
              style={{
                transform: 'skewX(-25deg)',
                transformOrigin: 'bottom left',
                backgroundImage: 'repeating-linear-gradient(90deg, #eae2d3 0px, #d5c8b5 1px, #eae2d3 2px)',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)',
              }}
            />

            {/* 2. LEFT COVER FACE ("страницу обложки слева", with title) */}
            <div
              className="relative flex-1 h-full flex flex-col justify-between py-1.5 px-1 overflow-hidden border-l border-b border-white/20"
              style={{
                background: `linear-gradient(135deg, rgba(20,20,30,0.98) 0%, rgba(35,35,48,0.95) 50%, rgba(15,15,22,0.99) 100%)`,
                boxShadow: 'inset -2px 0 6px rgba(0,0,0,0.8)',
              }}
            >
              {/* Subtle cover texture / accent glow */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${book.spineAccent} 0%, transparent 70%)`,
                }}
              />

              {/* Decorative top corner line */}
              <div className="w-full h-0.5 bg-amber-500/30 rounded-2xs mb-0.5" />

              {/* Vertical Book Title (+50% size, bold and high-contrast) */}
              <div className="flex-1 flex items-center justify-center overflow-hidden py-0.5 z-10">
                <span
                  className="font-black tracking-tight leading-none truncate text-white"
                  style={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.9)',
                    fontSize: `${titleFontSize}px`,
                    maxHeight: '85%',
                  }}
                >
                  {book.title}
                </span>
              </div>

              {/* Bottom author text on cover */}
              <div className="w-full text-center truncate z-10">
                <span
                  className="font-bold text-amber-300/80 truncate block leading-none"
                  style={{ fontSize: `${Math.max(7, Math.round(9 * scale))}px` }}
                >
                  {book.author.split(' ').slice(-1)[0]}
                </span>
              </div>
            </div>

            {/* 3. RIGHT SPINE STRIP (The colored ribbon spine strip matching sketch) */}
            <div
              className="relative w-[28%] h-full flex flex-col justify-between py-1 px-0.5 text-center border-t border-r border-b border-black/60 shadow-md"
              style={{
                background: `linear-gradient(180deg, ${book.spineAccent} 0%, rgba(20,20,28,0.95) 100%)`,
                borderLeft: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              {/* Top Spine Ribbon */}
              <div className="w-full h-0.5 bg-white/40 rounded-2xs mb-0.5" />

              {/* Spine Star Rating */}
              <div className="flex-1 flex items-center justify-center">
                <span
                  className="font-black text-amber-300 drop-shadow leading-none"
                  style={{ fontSize: `${starFontSize}px` }}
                >
                  ★
                </span>
              </div>

              {/* Bottom Score */}
              <div className="w-full pt-0.5 border-t border-white/20">
                <span
                  className="font-bold text-zinc-200 leading-none"
                  style={{ fontSize: `${Math.max(7, Math.round(8.5 * scale))}px` }}
                >
                  {book.overallRating}
                </span>
              </div>

              {/* 3D Spine Ridge Lighting */}
              <div className="absolute inset-y-0 left-0 w-0.5 bg-gradient-to-r from-black/50 to-transparent pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-0.5 bg-gradient-to-l from-black/60 to-transparent pointer-events-none" />
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
