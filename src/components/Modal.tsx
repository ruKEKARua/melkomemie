import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import { closeModal } from '../store/openModal';
import useGetMovieInfo from '../HooksTMDB/useGetMovieInfo';
import type { MovieRatings } from '../HooksExcelMovies/useGetMovies';
import { useEditMovie } from '../HooksExcelMovies/useEditMovie';
import type { MovieSheetEntry } from '../api/googleSheets';
import { getMovieImageUrl } from '../api/tmdbImage';
import type { MovieSource } from '../api/movieSource';

type ModalProps = {
  isHidden?: string;
  movie_ID: number;
  source?: MovieSource;
  ratings: MovieRatings[];
  excelMovieTitle?: string;
  fallbackTitle?: string;
  participantNames?: string[];
  onUpdateMovie?: (entry: MovieSheetEntry) => Promise<void>;
  onClose?: () => void;
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month) return dateStr;

  const months = [
    'января', 'февраля', 'марта', 'апреля',
    'мая', 'июня', 'июля', 'августа',
    'сентября', 'октября', 'ноября', 'декабря',
  ];

  const monthIdx = Number(month) - 1;
  const monthName = months[monthIdx] ?? month;
  return day ? `${Number(day)} ${monthName} ${year}` : `${monthName} ${year}`;
}

function formatDateFromExcel(date: string): string {
  const normalizedDate = date.trim();
  const match = normalizedDate.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/)
    || normalizedDate.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);

  if (!match) {
    return normalizedDate;
  }

  const [, first, second, third] = match;
  const day = Number(first.length === 4 ? third : first);
  const month = Number(first.length === 4 ? second : second);
  const year = Number(first.length === 4 ? first : third);

  const months = [
    'января', 'февраля', 'марта', 'апреля',
    'мая', 'июня', 'июля', 'августа',
    'сентября', 'октября', 'ноября', 'декабря',
  ];

  return `${day} ${months[month - 1] ?? month} ${year}`;
}

function getRatingBadgeColor(scoreStr?: string | number) {
  if (scoreStr === undefined || scoreStr === null || scoreStr === '') {
    return 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-300 dark:border-zinc-700';
  }
  const num = typeof scoreStr === 'number' ? scoreStr : parseFloat(String(scoreStr).replace(',', '.'));
  if (isNaN(num)) {
    return 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-300 dark:border-zinc-700';
  }

  if (num >= 7.5) {
    return 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-500/40';
  }
  if (num >= 6.0) {
    return 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30 dark:border-amber-500/40';
  }
  return 'bg-[#78350f]/15 dark:bg-[#78350f]/30 text-[#78350f] dark:text-amber-200 border-[#92400e]/30 dark:border-[#92400e]/40';
}

interface ParticipantRatingItemProps {
  rating: {
    userName: string;
    scores: (string | number)[];
  };
  index: number;
}

const ParticipantRatingItem = ({ rating, index }: ParticipantRatingItemProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeBelow: boolean } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const rawName = rating.userName ?? '';
  const hasAsterisk = rawName.includes('*');
  const userInitial = rawName.trim() ? rawName.trim()[0].toUpperCase() : '?';

  const handleMouseEnter = () => {
    if (!hasAsterisk) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const rect = rowRef.current?.getBoundingClientRect();
      if (rect) {
        const placeBelow = rect.top < 80;
        setCoords({
          top: placeBelow ? rect.bottom + 8 : rect.top - 8,
          left: rect.left + rect.width / 2,
          placeBelow,
        });
        setShowTooltip(true);
      }
    }, 2500);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowTooltip(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showTooltip) return;
    const handleScroll = () => {
      setShowTooltip(false);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showTooltip]);

  const rowClasses = hasAsterisk
    ? 'bg-amber-100 hover:bg-amber-200/80 border-amber-300 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:border-amber-500/40 shadow-xs'
    : 'bg-white dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.07] border-slate-200/60 dark:border-transparent';

  const nameClasses = hasAsterisk
    ? 'text-amber-950 dark:text-amber-100 font-bold'
    : 'text-slate-800 dark:text-zinc-200 font-medium';

  const avatarClasses = hasAsterisk
    ? 'bg-amber-400/40 text-amber-950 dark:bg-amber-400/25 dark:text-amber-200 border-amber-400/70 dark:border-amber-400/40 font-black'
    : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold';

  const tooltipText = 'Просмотр был незадолго до или после просмотра киноклубом';

  return (
    <div
      ref={rowRef}
      key={`${rating.userName}-${index}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 ${rowClasses}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs border ${avatarClasses}`}>
          {userInitial}
        </div>
        <span className={`text-sm truncate ${nameClasses}`}>
          {rating.userName}
        </span>
      </div>
      <span
        className={`px-2.5 py-0.5 rounded-md text-xs font-black border ${
          hasAsterisk ? 'bg-white/85 dark:bg-black/40 shadow-xs ' : ''
        }${getRatingBadgeColor(rating.scores[0])}`}
      >
        {rating.scores[0] ?? '—'}
      </span>

      {showTooltip &&
        coords &&
        createPortal(
          <div
            style={{
              top: coords.top,
              left: coords.left,
              transform: coords.placeBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            }}
            className="fixed z-[9999] pointer-events-none px-3.5 py-2 rounded-xl bg-slate-900/95 dark:bg-[#141824]/95 text-amber-100 dark:text-amber-200 text-xs font-medium shadow-2xl border border-amber-500/50 backdrop-blur-md max-w-xs text-center animate-fade-in flex items-center gap-2"
          >
            <span className="text-amber-400 text-sm shrink-0">ℹ️</span>
            <span className="leading-snug">{tooltipText}</span>
          </div>,
          document.body,
        )}
    </div>
  );
};

const Modal = ({
  isHidden = 'hidden',
  movie_ID,
  source = 'tmdb',
  ratings,
  excelMovieTitle,
  fallbackTitle,
  participantNames = [],
  onUpdateMovie,
  onClose,
}: ModalProps) => {
  const dispatch = useDispatch();

  const isFallback = fallbackTitle !== undefined && movie_ID <= 0;
  const movieTitle = excelMovieTitle || fallbackTitle;
  const { data: movieInfo, error: movieError } = useGetMovieInfo(
    movie_ID,
    source,
    !isFallback,
    movieTitle,
  );
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const isLoading = !isFallback && !movieInfo && !movieError;

  const isOpen = isHidden !== 'hidden';

  // Lock background page scroll and prevent background interaction
  useEffect(() => {
    if (!isOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Prevent layout shift when scrollbar disappears
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  const closeModalHandler = useCallback(() => {
    dispatch(closeModal());
    onClose?.();
  }, [dispatch, onClose]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModalHandler();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeModalHandler]);

  useEffect(() => {
    if (!isLoading) return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isLoading]);

  const hasError = isLoading && (!isOnline || Boolean(movieError));

  const excelMovie = excelMovieTitle
    ? ratings.find((movie) => movie.movie.trim().toLowerCase() === excelMovieTitle.trim().toLowerCase())
    : undefined;
  const excelRatings = excelMovie?.ratings ?? [];
  const overallRating = excelRatings[0]?.scores[1];
  const watchDate = excelMovie?.date ? formatDateFromExcel(excelMovie.date) : '';

  const editMovie = useEditMovie({
    movie: excelMovie,
    participantNames,
    onSave: onUpdateMovie,
  });

  if (!isOpen) return null;

  // Fallback modal (movie not found in TMDB / offline fallback)
  if (isFallback) {
    return createPortal(
      <div
        id="modalWrapper"
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md overflow-y-auto overscroll-contain animate-fade-in"
        onClick={(event) => {
          if (event.target === event.currentTarget) closeModalHandler();
        }}
      >
        <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#131622] p-6 text-slate-900 dark:text-white shadow-2xl border border-slate-200 dark:border-white/10 animate-modal-enter">
          <button
            onClick={closeModalHandler}
            aria-label="Закрыть модальное окно"
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-zinc-300 transition hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white"
          >
            ✕
          </button>
          <div className="flex items-center gap-3 mb-4">
            <span className="rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30">
              Киноклуб Мелкомемья
            </span>
            {watchDate && (
              <span className="text-xs text-slate-500 dark:text-zinc-400">Просмотрен: {watchDate}</span>
            )}
          </div>
          <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">{fallbackTitle}</h2>

          {/* Club Ratings Panel */}
          <div className="rounded-xl bg-slate-50 dark:bg-[#1a1e2d] p-4 border border-slate-200 dark:border-white/5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">Оценки участников</h4>
              {overallRating && (
                <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-2.5 py-1 text-sm font-bold text-amber-800 dark:text-amber-300 border border-amber-500/30">
                  <span className="text-amber-600 dark:text-amber-400">★</span>
                  <span>{overallRating} / 10</span>
                </div>
              )}
            </div>
            {excelRatings.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                {excelRatings.map((rating, idx) => (
                  <ParticipantRatingItem
                    key={`${rating.userName}-${idx}`}
                    rating={rating}
                    index={idx}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-zinc-400">Оценки не указаны</p>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={closeModalHandler}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  // Loading state
  if (isLoading) {
    return createPortal(
      <div
        id="modalWrapper"
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md overflow-y-auto overscroll-contain animate-fade-in"
        onClick={(event) => {
          if (event.target === event.currentTarget) closeModalHandler();
        }}
      >
        <div className="relative flex w-full max-w-md flex-col items-center justify-center gap-5 rounded-2xl bg-white dark:bg-[#131622] p-8 text-center text-slate-900 dark:text-white shadow-2xl border border-slate-200 dark:border-white/10 animate-modal-enter">
          <button
            onClick={closeModalHandler}
            aria-label="Закрыть"
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-zinc-400 transition hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white"
          >
            ✕
          </button>
          {hasError ? (
            <div className="flex flex-col items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <p className="text-sm text-slate-600 dark:text-zinc-300">
                {isOnline
                  ? 'Не удалось загрузить данные фильма. Проверьте соединение или повторите позже.'
                  : 'Нет подключения к сети. Проверьте подключение к интернету.'}
              </p>
              <button
                onClick={closeModalHandler}
                className="mt-2 rounded-xl bg-slate-100 dark:bg-white/10 px-4 py-2 text-sm font-medium text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20"
              >
                Закрыть
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
              <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">Загрузка информации о фильме...</p>
            </div>
          )}
        </div>
      </div>,
      document.body,
    );
  }

  const title = movieInfo?.title || excelMovieTitle || 'Фильм';
  const originalTitle = 'original_title' in (movieInfo ?? {}) ? movieInfo?.original_title : '';
  const description = movieInfo?.overview || 'Описание фильма временно отсутствует.';
  const voteAverage = movieInfo?.vote_average;
  const releaseYear = movieInfo?.release_date ? movieInfo.release_date.slice(0, 4) : '';
  const releaseDateFormatted = movieInfo?.release_date ? formatDate(movieInfo.release_date) : '';

  const backdropUrl = movieInfo?.backdrop_path
    ? getMovieImageUrl(movieInfo.backdrop_path, 'w1280')
    : movieInfo?.poster_path
      ? getMovieImageUrl(movieInfo.poster_path, 'w780')
      : null;

  const posterUrl = movieInfo?.poster_path
    ? getMovieImageUrl(movieInfo.poster_path, 'w780')
    : null;

  return createPortal(
    <div
      id="modalWrapper"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/60 dark:bg-black/85 backdrop-blur-md overflow-y-auto overscroll-contain animate-fade-in"
      onClick={(event) => {
        if (event.target === event.currentTarget) closeModalHandler();
      }}
    >
      <div
        className="relative w-full max-w-4xl my-auto rounded-3xl bg-white dark:bg-[#12141e] border border-slate-200 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden animate-modal-enter flex flex-col text-slate-900 dark:text-zinc-100 max-h-[92vh]"
      >
        {/* Close Button */}
        <button
          onClick={closeModalHandler}
          aria-label="Закрыть модальное окно"
          className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 dark:bg-black/60 text-slate-800 dark:text-white backdrop-blur-md transition-all duration-200 hover:bg-white dark:hover:bg-black/90 hover:scale-105 border border-slate-200 dark:border-white/15"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto overflow-x-hidden">
          {/* Hero Banner Header */}
          <div className="relative min-h-[16rem] md:min-h-[22rem] w-full flex items-end p-5 md:p-8 bg-slate-100 dark:bg-[#181b28]">
            {backdropUrl && (
              <img
                src={backdropUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-top opacity-55"
              />
            )}
            {/* Cinematic Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 dark:from-[#12141e] dark:via-[#12141e]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/50 dark:from-[#12141e] dark:via-[#12141e]/50 to-transparent" />

            {/* Header Content */}
            <div className="relative z-10 flex flex-col sm:flex-row gap-5 items-start sm:items-end w-full">
              {posterUrl && (
                <img
                  src={posterUrl}
                  alt={title}
                  className="hidden sm:block w-28 md:w-36 aspect-[2/3] object-cover rounded-xl shadow-2xl border border-slate-200 dark:border-white/15 shrink-0"
                />
              )}
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Киноклуб Мелкомемья
                  </span>
                  {releaseYear && (
                    <span className="rounded-md bg-slate-900/10 dark:bg-white/10 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-zinc-300">
                      {releaseYear}
                    </span>
                  )}
                  {watchDate && (
                    <span className="rounded-md bg-sky-500/15 px-2 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-300 border border-sky-500/20">
                      Просмотр: {watchDate}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  {title}
                </h2>

                {originalTitle && originalTitle !== title && (
                  <p className="text-sm md:text-base text-slate-600 dark:text-zinc-400 italic">
                    {originalTitle}
                  </p>
                )}

                {/* Genre chips */}
                {movieInfo?.genres && movieInfo.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {movieInfo.genres.map((g) => (
                      <span
                        key={g.id}
                        className="rounded-full bg-slate-900/10 dark:bg-white/10 px-2.5 py-0.5 text-xs text-slate-700 dark:text-zinc-300 backdrop-blur-sm"
                      >
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Body Content Grid (2 Columns) */}
          <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-6 md:gap-8 items-start">
            {/* Left Column: Synopsis & Ratings Summary */}
            <div className="flex flex-col gap-6">
              {/* Score Badges Comparison */}
              <div className="grid grid-cols-2 gap-3">
                {/* Club Score */}
                <div className="flex flex-col justify-between p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 to-transparent border border-amber-500/30 shadow-lg shadow-amber-950/20">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>Оценка клуба</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl md:text-4xl font-black text-amber-600 dark:text-amber-300">
                      {overallRating || '—'}
                    </span>
                    <span className="text-xs text-amber-600/70 dark:text-amber-400/70 font-semibold">/ 10</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                    {excelRatings.length > 0 ? `Оценок: ${excelRatings.length}` : 'Пока нет оценок'}
                  </p>
                </div>

                {/* TMDB / Kinopoisk Score */}
                <div className="flex flex-col justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-lg">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
                    <span>{source === 'kinopoisk' ? 'Кинопоиск' : 'Рейтинг TMDB'}</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl md:text-4xl font-black text-slate-900 dark:text-zinc-100">
                      {voteAverage !== undefined ? voteAverage.toFixed(1) : '—'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-zinc-500 font-semibold">/ 10</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                    {movieInfo?.vote_count ? `${movieInfo.vote_count.toLocaleString('ru-RU')} голосов` : 'Данные сервиса'}
                  </p>
                </div>
              </div>

              {/* Synopsis Section */}
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  О фильме
                </h3>
                <p className="text-sm md:text-base text-slate-700 dark:text-zinc-200 leading-relaxed font-normal">
                  {description}
                </p>
              </div>

              {/* Metadata details */}
              <div className="flex flex-col gap-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] p-4 border border-slate-200 dark:border-white/5 text-xs text-slate-700 dark:text-zinc-300">
                {releaseDateFormatted && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-white/5">
                    <span className="text-slate-500 dark:text-zinc-400">Премьера</span>
                    <span className="font-medium text-slate-900 dark:text-white">{releaseDateFormatted}</span>
                  </div>
                )}
                {watchDate && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-white/5">
                    <span className="text-slate-500 dark:text-zinc-400">Показ в киноклубе</span>
                    <span className="font-medium text-amber-600 dark:text-amber-400">{watchDate}</span>
                  </div>
                )}
                {'runtime' in (movieInfo ?? {}) && Boolean((movieInfo as { runtime?: number })?.runtime) && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 dark:text-zinc-400">Длительность</span>
                    <span className="font-medium text-slate-900 dark:text-white">{(movieInfo as { runtime?: number }).runtime} мин.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Club Member Scores & Inline Editor */}
            <div className="flex flex-col rounded-2xl bg-slate-50 dark:bg-[#171a27] p-5 border border-slate-200 dark:border-white/10 shadow-xl">
              <div className="flex items-center justify-between gap-2 pb-4 mb-3 border-b border-slate-200 dark:border-white/10">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Оценки киноклуба
                </h3>
                {editMovie.canEdit && !editMovie.isEditing && (
                  <button
                    onClick={editMovie.startEditing}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-200 dark:bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span>Изменить</span>
                  </button>
                )}
              </div>

              {/* Normal Display Mode */}
              {!editMovie.isEditing ? (
                <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
                  {excelRatings.length > 0 ? (
                    excelRatings.map((rating, index) => (
                      <ParticipantRatingItem
                        key={`${rating.userName}-${index}`}
                        rating={rating}
                        index={index}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-sm text-slate-500 dark:text-zinc-400">
                      Оценки участников для этого фильма пока не добавлены.
                    </div>
                  )}
                </div>
              ) : (
                /* Edit Mode */
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
                    {editMovie.participants.map((participant, index) => {
                      const selectedNames = new Set(
                        editMovie.participants.map((item) => item.name).filter(Boolean),
                      );

                      return (
                        <div key={index} className="grid grid-cols-[1fr_4.5rem_2rem] gap-2 items-center">
                          <select
                            aria-label={`Участник ${index + 1}`}
                            value={participant.name}
                            onChange={(event) => editMovie.updateParticipant(index, 'name', event.target.value)}
                            className="w-full rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#10121a] px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                          >
                            <option value="">Выберите участника</option>
                            {participantNames
                              .filter((name) => name === participant.name || !selectedNames.has(name))
                              .map((name) => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                          </select>
                          <input
                            aria-label={`Оценка участника ${index + 1}`}
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={participant.score}
                            onChange={(event) => editMovie.updateParticipant(index, 'score', event.target.value)}
                            placeholder="0-10"
                            className="w-full rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#10121a] px-2.5 py-2 text-xs text-slate-900 dark:text-white text-center font-bold focus:outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            disabled={editMovie.participants.length === 1}
                            onClick={() => editMovie.removeParticipant(index)}
                            aria-label={`Удалить участника ${index + 1}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/30 text-rose-500 dark:text-rose-400 hover:bg-rose-500/15 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={editMovie.addParticipant}
                    className="self-start text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 transition-colors py-1"
                  >
                    + Добавить участника
                  </button>

                  {editMovie.error && (
                    <p role="alert" className="text-xs text-rose-500 dark:text-rose-400">
                      {editMovie.error}
                    </p>
                  )}

                  <div className="mt-3 flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                    <button
                      type="button"
                      onClick={editMovie.cancelEditing}
                      className="rounded-lg bg-slate-200 dark:bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-white/20"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={editMovie.requestConfirmation}
                      className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Confirmation Modal for Edit Save */}
        {editMovie.isConfirmationOpen && excelMovie && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 dark:bg-black/75 p-4 animate-fade-in">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-movie-confirm-title"
              className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#161925] p-6 text-center text-slate-900 dark:text-white shadow-2xl border border-slate-200 dark:border-white/15 animate-modal-enter"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-500 mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 id="edit-movie-confirm-title" className="text-lg font-bold">
                Сохранить изменения?
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                Оценки участников для фильма «{excelMovie.movie}» будут обновлены в базе киноклуба.
              </p>
              {editMovie.error && (
                <p role="alert" className="mt-3 text-xs text-rose-500 dark:text-rose-400">
                  {editMovie.error}
                </p>
              )}
              <div className="mt-5 flex justify-center gap-3">
                <button
                  type="button"
                  disabled={editMovie.isSaving}
                  onClick={() => editMovie.cancelEditing()}
                  className="rounded-xl bg-slate-100 dark:bg-white/10 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-white/20 disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  disabled={editMovie.isSaving}
                  onClick={() => void editMovie.confirmSave()}
                  className="rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 flex items-center gap-2"
                >
                  {editMovie.isSaving ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                      <span>Сохранение...</span>
                    </>
                  ) : (
                    'Подтвердить'
                  )}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
