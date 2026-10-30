import React, { useState } from 'react';
import type { BookClubBook } from '../../api/bookClubData';

interface BookShelfProps {
  books: BookClubBook[];
  onSelectBook: (book: BookClubBook) => void;
  onOpenCatalog: () => void;
}

export const BookShelf: React.FC<BookShelfProps> = ({ books, onSelectBook, onOpenCatalog }) => {
  const [hoveredBookId, setHoveredBookId] = useState<number | null>(null);

  // Divide 15 books across 3 shelves:
  // Shelf 1 (top): books 0 to 5 (6 books)
  // Shelf 2 (middle): books 6 to 10 (5 books)
  // Shelf 3 (bottom): books 11 to 14 (4 books) + archive plaque
  const shelf1 = books.slice(0, 6);
  const shelf2 = books.slice(6, 11);
  const shelf3 = books.slice(11, 15);

  const renderBookSpine = (book: BookClubBook, index: number) => {
    const isHovered = hoveredBookId === book.id;
    // Slight height variations for realistic library shelf feel
    const heights = ['h-36 sm:h-40', 'h-38 sm:h-44', 'h-35 sm:h-39', 'h-37 sm:h-42', 'h-39 sm:h-43'];
    const heightClass = heights[index % heights.length];
    const widths = ['w-7 sm:w-8.5', 'w-8 sm:w-9.5', 'w-7.5 sm:w-9', 'w-8.5 sm:w-10'];
    const widthClass = widths[index % widths.length];

    return (
      <div
        key={book.id}
        className="relative group select-none cursor-pointer flex flex-col justify-end items-center"
        onMouseEnter={() => setHoveredBookId(book.id)}
        onMouseLeave={() => setHoveredBookId(null)}
        onClick={() => onSelectBook(book)}
      >
        {/* Floating Tooltip above book on hover */}
        {isHovered && (
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-950/95 border border-amber-500/60 text-white text-xs shadow-2xl backdrop-blur-md flex flex-col items-center animate-fade-in ring-1 ring-amber-400/30">
            <span className="font-bold text-amber-300 drop-shadow">{book.title}</span>
            <div className="flex items-center gap-2 text-[10px] text-zinc-300">
              <span>{book.author}</span>
              <span className="text-amber-400 font-bold">★ {book.overallRating}</span>
            </div>
            {/* Tooltip beak */}
            <div className="w-2 h-2 rotate-45 bg-slate-950 border-r border-b border-amber-500/60 absolute -bottom-1" />
          </div>
        )}

        {/* Upright Book Spine */}
        <div
          className={`relative ${widthClass} ${heightClass} rounded-t-sm rounded-b-xs shadow-lg transition-all duration-200 ease-out flex flex-col justify-between py-2 px-1 text-center border-l border-t border-white/20 border-r border-black/40 ${
            isHovered
              ? '-translate-y-3.5 scale-105 shadow-[0_15px_30px_rgba(0,0,0,0.95)] ring-2 ring-amber-400/90 z-20'
              : 'hover:-translate-y-1'
          }`}
          style={{
            background: `linear-gradient(135deg, ${book.spineAccent} 0%, rgba(20,20,25,0.95) 75%)`,
          }}
        >
          {/* Top Decorative Spine Ribbon / Line */}
          <div className="w-full h-1 bg-white/30 rounded-xs mb-1" />

          {/* Vertical Book Title (bottom-to-top text) */}
          <div className="flex-1 flex items-center justify-center overflow-hidden py-1">
            <span
              className="text-[10px] sm:text-[11px] font-black tracking-tight leading-none truncate max-h-[110px]"
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                color: book.spineTextColor || '#ffffff',
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              }}
            >
              {book.title}
            </span>
          </div>

          {/* Bottom Star Rating Marker */}
          <div className="w-full flex items-center justify-center pt-1 border-t border-white/20">
            <span className="text-[9px] font-bold text-amber-400 leading-none">★</span>
          </div>

          {/* Realistic 3D Book Spine Ridge Shadow */}
          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-r from-black/50 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-l from-black/60 to-transparent pointer-events-none" />
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-[420px] sm:max-w-[460px] md:max-w-[490px] mx-auto select-none">
      {/* Top of Bookcase Plants & Catalog Button */}
      <div className="flex items-end justify-between px-6 pb-1">
        {/* Potted Plants 🪴 */}
        <div className="flex items-end gap-1 text-2xl filter drop-shadow-md">
          <span className="hover:scale-110 transition-transform cursor-pointer" title="Цветок на полке">
            🪴
          </span>
          <span className="hover:scale-110 transition-transform cursor-pointer text-xl" title="Суккулент">
            🌱
          </span>
        </div>

        {/* "+ Добавить на полку / Каталог" */}
        <button
          onClick={onOpenCatalog}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 text-xs font-bold transition shadow-sm cursor-pointer hover:scale-105"
        >
          <span>+</span>
          <span>Добавить на полку</span>
        </button>
      </div>

      {/* Main Wooden Bookcase Body matching Screenshot 1 */}
      <div className="relative rounded-2xl bg-gradient-to-b from-[#24140e] via-[#1c0f0a] to-[#140b07] border-[7px] border-[#381e14] shadow-[0_25px_60px_rgba(0,0,0,0.95),inset_0_2px_10px_rgba(255,200,150,0.1)] p-4 flex flex-col gap-4">
        {/* SHELF 1 (Top) */}
        <div className="relative flex flex-col justify-end pt-3">
          <div className="flex items-end justify-start gap-1.5 sm:gap-2 px-3 pb-0 min-h-[145px] sm:min-h-[160px]">
            {shelf1.map(renderBookSpine)}
          </div>
          {/* Wooden Shelf Ledge */}
          <div className="w-full h-3.5 bg-gradient-to-r from-[#422417] via-[#542e1d] to-[#422417] border-t border-amber-400/25 border-b border-black/70 shadow-[0_4px_10px_rgba(0,0,0,0.8)] rounded-xs" />
        </div>

        {/* SHELF 2 (Middle) */}
        <div className="relative flex flex-col justify-end pt-2">
          <div className="flex items-end justify-start gap-1.5 sm:gap-2 px-3 pb-0 min-h-[145px] sm:min-h-[160px]">
            {shelf2.map(renderBookSpine)}
          </div>
          {/* Wooden Shelf Ledge */}
          <div className="w-full h-3.5 bg-gradient-to-r from-[#422417] via-[#542e1d] to-[#422417] border-t border-amber-400/25 border-b border-black/70 shadow-[0_4px_10px_rgba(0,0,0,0.8)] rounded-xs" />
        </div>

        {/* SHELF 3 (Bottom) */}
        <div className="relative flex flex-col justify-end pt-2">
          <div className="flex items-end justify-between px-3 pb-0 min-h-[145px] sm:min-h-[160px]">
            {/* Books on the left */}
            <div className="flex items-end gap-1.5 sm:gap-2">
              {shelf3.map(renderBookSpine)}
            </div>

            {/* Right side of bottom shelf: plaques matching Screenshot 1 */}
            <div className="flex flex-col gap-2 items-end pb-1 pr-1">
              <div
                onClick={onOpenCatalog}
                className="px-3 py-1 rounded-md bg-[#3a1d12] hover:bg-[#4a2618] border border-amber-500/40 text-[10px] font-bold text-amber-300 shadow-sm transition hover:scale-105 cursor-pointer flex items-center gap-1.5"
              >
                <span>🏆</span>
                <span>Архив турниров 2026</span>
              </div>
              <div
                onClick={onOpenCatalog}
                className="px-3 py-1 rounded-md bg-[#162136] hover:bg-[#20304e] border border-sky-500/40 text-[10px] font-bold text-sky-200 shadow-sm transition hover:scale-105 cursor-pointer flex items-center gap-1.5"
              >
                <span>📖</span>
                <span>Энциклопедия Мелкомемья</span>
              </div>
            </div>
          </div>
          {/* Bottom Shelf Ledge */}
          <div className="w-full h-4 bg-gradient-to-r from-[#422417] via-[#542e1d] to-[#422417] border-t border-amber-400/30 border-b border-black/90 shadow-[0_6px_14px_rgba(0,0,0,0.9)] rounded-b-sm" />
        </div>
      </div>
    </div>
  );
};

export default BookShelf;
