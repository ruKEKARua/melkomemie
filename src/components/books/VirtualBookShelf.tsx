import React, { useState } from 'react';
import type { BookClubBook } from '../../api/bookClubData';

interface VirtualBookShelfProps {
  books: BookClubBook[];
  onSelectBook: (book: BookClubBook) => void;
  onOpenCatalog: () => void;
  scale: number;
}

export const VirtualBookShelf: React.FC<VirtualBookShelfProps> = ({
  books,
  onSelectBook,
  onOpenCatalog,
  scale,
}) => {
  const [hoveredBookId, setHoveredBookId] = useState<number | null>(null);

  // 15 books across 4 shelves:
  // Shelf 1 (Top): books 0..3 (4 books)
  // Shelf 2: books 4..7 (4 books)
  // Shelf 3: books 8..11 (4 books)
  // Shelf 4 (Bottom): books 12..14 (3 books) + catalog plaque
  const shelf1 = books.slice(0, 4);
  const shelf2 = books.slice(4, 8);
  const shelf3 = books.slice(8, 12);
  const shelf4 = books.slice(12, 15);

  const renderBook = (book: BookClubBook, index: number, totalOnShelf: number) => {
    const isHovered = hoveredBookId === book.id;

    // Organic height and width variations like real library books
    const heightRatios = [0.86, 0.92, 0.84, 0.89];
    const heightRatio = heightRatios[index % heightRatios.length];
    const cavityHeight = 170 * scale;
    const bookHeight = cavityHeight * heightRatio;

    // Width: ~38px to 44px scaled
    const baseWidth = totalOnShelf === 3 ? 46 : 41;
    const bookWidth = (baseWidth + (index % 2 === 0 ? 2 : -2)) * scale;

    return (
      <div
        key={book.id}
        className="relative group select-none cursor-pointer flex flex-col justify-end items-center"
        style={{ width: `${bookWidth}px`, height: `${bookHeight}px` }}
        onMouseEnter={() => setHoveredBookId(book.id)}
        onMouseLeave={() => setHoveredBookId(null)}
        onClick={() => onSelectBook(book)}
      >
        {/* Floating Tooltip above book on hover */}
        {isHovered && (
          <div
            className="absolute -top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-950/95 border border-amber-500/70 text-white text-xs shadow-2xl backdrop-blur-md flex flex-col items-center animate-fade-in ring-1 ring-amber-400/40"
          >
            <span className="font-bold text-amber-300 drop-shadow">{book.title}</span>
            <div className="flex items-center gap-2 text-[10px] text-zinc-300">
              <span>{book.author}</span>
              <span className="text-amber-400 font-bold">★ {book.overallRating}</span>
            </div>
            {/* Tooltip beak */}
            <div className="w-2 h-2 rotate-45 bg-slate-950 border-r border-b border-amber-500/70 absolute -bottom-1" />
          </div>
        )}

        {/* Upright Book Spine sitting directly on the video's wooden shelf */}
        <div
          className={`w-full h-full rounded-t-xs rounded-b-2xs shadow-md transition-all duration-200 ease-out flex flex-col justify-between py-1.5 px-0.5 text-center border-l border-t border-white/25 border-r border-black/50 ${
            isHovered
              ? '-translate-y-3 scale-105 shadow-[0_12px_24px_rgba(0,0,0,0.95)] ring-2 ring-amber-400 z-30'
              : 'hover:-translate-y-1'
          }`}
          style={{
            background: `linear-gradient(135deg, ${book.spineAccent} 0%, rgba(18,18,24,0.96) 80%)`,
          }}
        >
          {/* Top Decorative Spine Ribbon */}
          <div className="w-full h-0.5 bg-white/35 rounded-2xs mb-0.5" />

          {/* Vertical Book Title (bottom-to-top text) */}
          <div className="flex-1 flex items-center justify-center overflow-hidden py-0.5">
            <span
              className="font-black tracking-tight leading-none truncate"
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                color: book.spineTextColor || '#ffffff',
                textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                fontSize: `${Math.max(9, Math.round(11 * scale))}px`,
                maxHeight: `${bookHeight - 32 * scale}px`,
              }}
            >
              {book.title}
            </span>
          </div>

          {/* Bottom Star Rating Marker */}
          <div className="w-full flex items-center justify-center pt-0.5 border-t border-white/20">
            <span
              className="font-bold text-amber-400 leading-none"
              style={{ fontSize: `${Math.max(8, Math.round(9 * scale))}px` }}
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

  const shelfRowHeight = 170 * scale;
  const dividerHeight = 15 * scale;

  return (
    <div
      className="w-full h-full flex flex-col justify-between select-none"
      style={{
        // 3D perspective to match the angled camera view of the bookcase in the video
        transform: 'perspective(1000px) rotateY(3.5deg)',
        transformOrigin: 'left center',
      }}
    >
      {/* SHELF 1 (Top Cavity: y = 119 to 290) */}
      <div
        className="w-full flex items-end justify-between px-1.5"
        style={{ height: `${shelfRowHeight}px` }}
      >
        {shelf1.map((b, i) => renderBook(b, i, shelf1.length))}
      </div>

      {/* Spacing for shelf divider 1 */}
      <div style={{ height: `${dividerHeight}px` }} />

      {/* SHELF 2 (Second Cavity: y = 306 to 476) */}
      <div
        className="w-full flex items-end justify-between px-1.5"
        style={{ height: `${shelfRowHeight}px` }}
      >
        {shelf2.map((b, i) => renderBook(b, i, shelf2.length))}
      </div>

      {/* Spacing for shelf divider 2 */}
      <div style={{ height: `${dividerHeight}px` }} />

      {/* SHELF 3 (Third Cavity: y = 492 to 662) */}
      <div
        className="w-full flex items-end justify-between px-1.5"
        style={{ height: `${shelfRowHeight}px` }}
      >
        {shelf3.map((b, i) => renderBook(b, i, shelf3.length))}
      </div>

      {/* Spacing for shelf divider 3 */}
      <div style={{ height: `${dividerHeight}px` }} />

      {/* SHELF 4 (Bottom Cavity: y = 678 to 848) */}
      <div
        className="w-full flex items-end justify-between px-1.5"
        style={{ height: `${shelfRowHeight}px` }}
      >
        {/* 3 Books */}
        {shelf4.map((b, i) => renderBook(b, i, 4))}

        {/* Small Elegant Catalog Plaque beside book 15 */}
        <div
          onClick={onOpenCatalog}
          title="Открыть каталог всех 15 книг"
          className="cursor-pointer group flex flex-col items-center justify-center rounded-xs bg-[#3a1d12]/90 hover:bg-[#522919] border border-amber-500/50 hover:border-amber-400 shadow-md transition-all hover:scale-105"
          style={{
            width: `${38 * scale}px`,
            height: `${70 * scale}px`,
            marginBottom: `${4 * scale}px`,
          }}
        >
          <span style={{ fontSize: `${Math.max(12, Math.round(15 * scale))}px` }}>📖</span>
          <span
            className="text-amber-300 font-bold tracking-tighter uppercase leading-tight text-center"
            style={{ fontSize: `${Math.max(7, Math.round(8 * scale))}px` }}
          >
            Все
            <br />
            книги
          </span>
        </div>
      </div>
    </div>
  );
};

export default VirtualBookShelf;
