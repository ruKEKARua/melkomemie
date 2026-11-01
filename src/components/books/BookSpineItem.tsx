import React, { memo } from 'react';
import type { BookClubBook } from '../../api/bookClubData';
import { getCachedBookCover } from '../../api/bookCache';
import { parseSpineColors, formatRating } from '../../utils/bookShelfStyles';

interface BookSpineItemProps {
  book: BookClubBook;
  index: number;
  totalOnShelf: number;
  isHovered: boolean;
  isRowHovered?: boolean;
  scale: number;
  spineWidthPx: number;
  hingeWidthPx: number;
  coverWidthPx: number;
  totalExpandedWidthPx: number;
  gapPx: number;
  tiltAngle?: number;
  tiltOrigin?: 'bottom left' | 'bottom right' | 'bottom center';
  onHover: (id: number) => void;
  onSelect: (book: BookClubBook) => void;
}

const heightRatios = [0.93, 0.96, 0.90, 0.94, 0.92, 0.95];

export const BookSpineItem: React.FC<BookSpineItemProps> = memo(({
  book,
  index,
  totalOnShelf,
  isHovered,
  isRowHovered = false,
  scale,
  spineWidthPx,
  hingeWidthPx,
  coverWidthPx,
  totalExpandedWidthPx,
  gapPx,
  tiltAngle = 0,
  tiltOrigin = 'bottom center',
  onHover,
  onSelect,
}) => {
  const isLastOnShelf = index === totalOnShelf - 1;
  const heightRatio = heightRatios[index % heightRatios.length];
  // Leaning books that tilt onto a neighbor stay in front of the upright neighbor,
  // while the hovered book always ascends to zIndex 50
  const zIndex = isHovered ? 50 : tiltAngle !== 0 ? 15 + index : index + 1;

  const titleFontSize = Math.max(9, Math.round(10.5 * scale));
  const spineTitleFontSize = Math.max(9, Math.round(10 * scale));
  const { topColor, bottomColor, accent } = parseSpineColors(book);

  const slotWidth =
    (isHovered ? totalExpandedWidthPx : spineWidthPx) + (isLastOnShelf ? 0 : gapPx);

  return (
    <div
      className="relative select-none cursor-pointer flex flex-col justify-end shrink-0 opacity-100 box-border"
      style={{
        width: `${slotWidth}px`,
        height: '100%',
        paddingRight: isLastOnShelf ? 0 : `${gapPx}px`,
        zIndex,
        opacity: 1,
        transition: isHovered
          ? 'width 180ms cubic-bezier(0.2, 0, 0, 1), padding-right 180ms cubic-bezier(0.2, 0, 0, 1), z-index 0ms'
          : 'width 160ms cubic-bezier(0.25, 1, 0.5, 1), padding-right 160ms cubic-bezier(0.25, 1, 0.5, 1), z-index 0ms',
      }}
      onMouseEnter={() => onHover(book.id)}
      onClick={() => onSelect(book)}
    >
      {/* 
        TILT WRAPPER:
        - Leans the book naturally on the shelf (rotateZ) around tiltOrigin (bottom-left or bottom-right).
        - On hover: smoothly rotates to vertical (0deg) in 180ms simultaneously as the 3D volume opens.
      */}
      <div
        className="relative w-full flex flex-col justify-end select-none"
        style={{
          height: `calc(${heightRatio * 100}% - ${Math.max(8, Math.round(10 * scale))}px)`,
          transformOrigin: tiltOrigin,
          transform: (isHovered || isRowHovered) ? 'rotateZ(0deg)' : `rotateZ(${tiltAngle}deg)`,
          transition: (isHovered || isRowHovered)
            ? 'transform 180ms cubic-bezier(0.2, 0, 0, 1)'
            : 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
          transformStyle: 'preserve-3d',
        }}
      >
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
          className="relative w-full h-full select-none"
          style={{
            transformStyle: 'preserve-3d',
            transformOrigin: 'left center',
            transform: isHovered
              ? `rotateY(-5deg) translateZ(${14 * scale}px) scale(1.02)`
              : 'rotateY(0deg) translateZ(0px)',
            boxShadow: isHovered
              ? `-14px 12px 28px rgba(0, 0, 0, 0.95), -4px 4px 12px rgba(0, 0, 0, 0.7), 0 0 20px ${accent}44`
              : 'none',
            transition: isHovered
              ? 'transform 180ms cubic-bezier(0.2, 0, 0, 1), box-shadow 180ms ease'
              : 'transform 160ms cubic-bezier(0.25, 1, 0.5, 1), box-shadow 160ms ease',
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
              className="select-none font-sans font-bold text-white leading-none text-center"
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxHeight: '100%',
                fontSize: `${spineTitleFontSize}px`,
                letterSpacing: '0.05em',
                textShadow: '0 1px 2px rgba(0,0,0,0.95)',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                textRendering: 'geometricPrecision',
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

          {/* Снизу: чёткий контрастный бейдж с округлённым до 2 знаков рейтингом */}
          <div className="shrink-0 bg-black/90 border border-amber-400/80 rounded px-1.5 py-0.5 flex items-center justify-center gap-0.5 shadow-md mb-1 z-10">
            <span className="text-amber-400 text-[9.5px] font-black leading-none drop-shadow">★</span>
            <span className="text-amber-100 text-[10px] font-bold leading-none font-mono tracking-tight drop-shadow">
              {formatRating(book.overallRating)}
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

          {/* Authentic Book Cover Art background when hovered */}
          <div className="absolute inset-0 overflow-hidden rounded-r-[3px] rounded-l-[1px] pointer-events-none z-0">
            <img
              src={`${import.meta.env.BASE_URL}covers/book_${book.id}.jpg`}
              alt=""
              className="w-full h-full object-cover object-center"
              loading="eager"
              decoding="async"
              onError={(e) => {
                const fallback = getCachedBookCover(book.id);
                if (fallback && e.currentTarget.src !== fallback) {
                  e.currentTarget.src = fallback;
                } else {
                  e.currentTarget.style.display = 'none';
                }
              }}
            />
            {/* Shading overlay ensuring crisp contrast for embossed gold lettering */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/60" />
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

          {/* Top: Увеличенный чёткий бейдж с рейтингом при наведении */}
          <div className="relative z-20 w-full flex justify-end items-center">
            <div className="shrink-0 bg-black/90 px-1.5 py-0.5 rounded-md border border-amber-400/80 flex items-center gap-1 shadow-md">
              <span className="text-amber-400 text-[10.5px] font-black leading-none drop-shadow">★</span>
              <span className="text-amber-100 text-[11px] font-black leading-none font-mono tracking-tight drop-shadow">
                {formatRating(book.overallRating)}
              </span>
            </div>
          </div>

          {/* Center Area: Full Title centered vertically with more room and crystal clear rendering */}
          <div className="relative z-20 flex-1 flex flex-col justify-center items-center text-center my-auto px-1 py-0.5">
            <h3
              className="font-sans font-bold text-white text-center leading-[1.22] select-none break-words line-clamp-7"
              style={{
                fontSize: `${titleFontSize}px`,
                letterSpacing: '0.01em',
                textShadow: '0 1px 2px rgba(0,0,0,0.95)',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                textRendering: 'geometricPrecision',
              }}
            >
              {book.title}
            </h3>
          </div>

          {/* Bottom: Элегантный декоративный золотой разделитель (год убран для чистоты дизайна) */}
          <div className="relative z-20 w-full flex items-center justify-center pt-1 mt-0.5 border-t border-amber-400/35">
            <div className="w-full flex items-center justify-center gap-1.5 opacity-60">
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-amber-400/70" />
              <span className="text-[9px] text-amber-300 select-none">❖</span>
              <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-amber-400/70" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
});

BookSpineItem.displayName = 'BookSpineItem';
