import { useState } from 'react';
import type { GoogleBookVolume } from '../api/googleBooks';

interface BookCardProps {
  book: GoogleBookVolume;
  overallRating?: string;
  onClick: () => void;
}

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
  return { bg: 'bg-[#78350f]/95 border-[#92400e]/70 shadow-amber-950/40', text: 'text-amber-100' };
};

export const BookCard = ({ book, overallRating, onClick }: BookCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const info = book.volumeInfo;
  const coverUrl =
    info.imageLinks?.medium ||
    info.imageLinks?.thumbnail ||
    info.imageLinks?.smallThumbnail ||
    'https://upload.wikimedia.org/wikipedia/commons/f/fb/Animal_Farm_-_1st_edition.jpg';

  const ratingStyle = getRatingStyle(overallRating);
  const author = info.authors?.join(', ') || 'Джордж Оруэлл';

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Открыть книгу: ${info.title}${overallRating ? `, оценка клуба: ${overallRating}` : ''}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className="group relative flex flex-col h-full w-full cursor-pointer select-none rounded-2xl bg-white dark:bg-[#131620] p-2.5 sm:p-3 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.03] shadow-[0_4px_16px_rgba(15,23,42,0.06)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_0_24px_rgba(245,158,11,0.22)] dark:shadow-none dark:hover:shadow-[0_18px_36px_rgba(0,0,0,0.85),0_0_24px_rgba(245,158,11,0.22)] focus-visible:outline-2 focus-visible:outline-amber-400 border border-slate-200/80 dark:border-white/10 hover:border-amber-500/50 hover:z-30"
    >
      {/* Book Cover Container (2/3 aspect ratio matching movie cards) */}
      <div className="relative w-full aspect-[2/3] shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-[#1a1e2b]">
        {coverUrl && !imageError ? (
          <>
            {!imageLoaded && <div className="absolute inset-0 animate-shimmer" />}
            <img
              src={coverUrl}
              alt={info.title}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-108 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center text-xs text-slate-500 dark:text-zinc-400 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-[#1c2130] dark:to-[#121520]">
            <span className="text-3xl mb-2">📚</span>
            <span className="font-medium line-clamp-2">{info.title || 'Обложка отсутствует'}</span>
          </div>
        )}

        {/* Ambient bottom gradient overlay for readability */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-40 transition-opacity duration-300 group-hover:opacity-60" />

        {/* Rating Badge */}
        {overallRating && ratingStyle && (
          <div
            className={`absolute top-2.5 right-2.5 flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-black shadow-lg backdrop-blur-md border ${ratingStyle.bg} ${ratingStyle.text}`}
            title={`Средняя оценка книжного клуба: ${overallRating}`}
          >
            <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{overallRating}</span>
          </div>
        )}

        {/* Book Indicator Badge on top-left */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold shadow-md backdrop-blur-md bg-black/60 text-white border border-white/20">
          <span>📚 Книга</span>
        </div>

        {/* Hover Action Pill */}
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center opacity-0 transition-all duration-300 translate-y-2 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="rounded-full bg-amber-500 px-3.5 py-1 text-[11px] font-bold text-slate-950 shadow-md backdrop-blur-sm">
            Подробнее
          </span>
        </div>
      </div>

      {/* Card Info Below Poster */}
      <div className="mt-2.5 px-1 flex flex-col text-left">
        <h3
          title={info.title}
          className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 line-clamp-1 leading-snug group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors"
        >
          {info.title}
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
          {author} {info.publishedDate ? `(${info.publishedDate})` : ''}
        </p>
      </div>
    </div>
  );
};

export default BookCard;
