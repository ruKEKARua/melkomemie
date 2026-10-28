import { useLayoutEffect, useRef, useState } from 'react';

type MovieCardProps = {
  id: number;
  title: string;
  posterPath: string;
  overallRating?: string;
  func: (id: number) => void;
};

const getRatingStyle = (ratingStr?: string) => {
  if (!ratingStr) return null;
  const num = parseFloat(ratingStr.replace(',', '.'));
  if (isNaN(num)) return { bg: 'bg-zinc-700/90 border-zinc-600', text: 'text-zinc-200' };

  if (num >= 7.5) {
    return { bg: 'bg-emerald-500/95 border-emerald-400/50 shadow-emerald-950/40', text: 'text-white' };
  }
  if (num >= 6.0) {
    return { bg: 'bg-amber-500/95 border-amber-400/50 shadow-amber-950/40', text: 'text-slate-950' };
  }
  // < 6.0: Brown badge
  return { bg: 'bg-[#78350f]/95 border-[#92400e]/70 shadow-amber-950/40', text: 'text-amber-100' };
};

const MovieCard = ({ id = 0, title = '', posterPath = '', overallRating, func }: MovieCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const ratingStyle = getRatingStyle(overallRating);

  useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) return;

    const checkTruncation = () => {
      setIsTruncated(el.scrollHeight > el.clientHeight + 1);
    };

    checkTruncation();

    if ('fonts' in document) {
      document.fonts.ready.then(checkTruncation);
    }

    const observer = new ResizeObserver(checkTruncation);
    observer.observe(el);
    return () => observer.disconnect();
  }, [title]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Открыть фильм: ${title}${overallRating ? `, оценка киноклуба: ${overallRating}` : ''}`}
      onClick={() => func(id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          func(id);
        }
      }}
      className="group movie-card relative flex flex-col h-full w-full cursor-pointer select-none rounded-2xl bg-white dark:bg-[#131620] p-2 sm:p-2.5 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.03] shadow-[0_4px_16px_rgba(15,23,42,0.06)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_0_24px_rgba(245,158,11,0.22)] dark:shadow-none dark:hover:shadow-[0_18px_36px_rgba(0,0,0,0.85),0_0_24px_rgba(245,158,11,0.22)] focus-visible:outline-2 focus-visible:outline-amber-400 border border-slate-200/80 dark:border-white/10 hover:border-amber-500/50 hover:z-30"
    >
      {/* Poster Container (2 / 3 aspect ratio) */}
      <div className="relative w-full aspect-[2/3] shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-[#1a1e2b]">
        {posterPath && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 animate-shimmer" />
            )}
            <img
              src={posterPath}
              alt={title}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-108 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center text-xs text-slate-500 dark:text-zinc-400 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-[#1c2130] dark:to-[#121520]">
            <svg className="w-8 h-8 mb-2 text-slate-400 dark:text-zinc-500 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <span className="font-medium line-clamp-2">{title || 'Постер отсутствует'}</span>
          </div>
        )}

        {/* Ambient bottom gradient overlay for readability */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-40 transition-opacity duration-300 group-hover:opacity-60" />

        {/* Kinopoisk-style Rating Badge */}
        {overallRating && ratingStyle && (
          <div
            className={`absolute top-2.5 right-2.5 flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-black shadow-lg backdrop-blur-md border ${ratingStyle.bg} ${ratingStyle.text}`}
            title={`Средняя оценка киноклуба: ${overallRating}`}
          >
            <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{overallRating}</span>
          </div>
        )}

        {/* Hover Action Pill */}
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center opacity-0 transition-all duration-300 translate-y-2 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="rounded-full bg-amber-500 px-3.5 py-1 text-[11px] font-bold text-slate-950 shadow-md backdrop-blur-sm">
            Подробнее
          </span>
        </div>
      </div>

      {/* Card Info Below Poster - Fixed height ensures identical card size across the project */}
      <div className="relative mt-2.5 px-1 w-full h-10 sm:h-11 shrink-0 flex items-center justify-center text-center">
        <h3
          ref={titleRef}
          title={title}
          className="w-full text-center text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-100 line-clamp-2 leading-snug group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors"
        >
          {title}
        </h3>

        {/* Full title popover displayed ONLY on hover if truncated, anchored at top-0 to expand downwards and never obscure the "Подробнее" button or poster */}
        {isTruncated && (
          <div className="pointer-events-none absolute inset-x-[-0.5rem] top-0 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex justify-center">
            <div className="w-full rounded-xl bg-white/95 dark:bg-[#0a0c16]/98 px-2.5 py-2 text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 text-center shadow-[0_12px_36px_rgba(15,23,42,0.15),0_0_16px_rgba(245,158,11,0.25)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.95),0_0_16px_rgba(245,158,11,0.25)] border border-amber-500/50 backdrop-blur-xl leading-snug break-words">
              {title}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieCard;
