import React, { memo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { openModal } from '../../store/openModal';
import Modal from '../Modal';
import type { RootState } from '../../store/store';
import type { Media } from '../MovieSlider';
import type { MovieRatings, MovieRating } from '../../HooksExcelMovies/useGetMovies';
import type { MovieSheetEntry } from '../../api/googleSheets';
import type { SortOrder } from '../../hooks/useCatalogMovies';
import { getActiveMovieSource, type MovieSource } from '../../api/movieSource';
import { getMovieImageUrl } from '../../api/tmdbImage';
import { roundRating } from '../../utils/ratings';
import { formatTableDate } from '../../utils/dateFormat';

export interface MovieTableViewProps {
  media: Media[];
  ratings: MovieRatings[];
  participantNames?: string[];
  onUpdateMovie?: (entry: MovieSheetEntry) => Promise<void>;
  isLoading?: boolean;
  highlightMovieTitle?: string | null;
  sortOrder?: SortOrder;
  movieNumberMap?: Map<string, number>;
}

// Nuance 1 (Screenshot 5): Movie 60 "Нападение на Рио Браво" - Артемка, Гоша, Наташа highlighted black
const isBlackParticipantCell = (movieTitle: string, participantName: string, movieNum?: number): boolean => {
  const normMovie = movieTitle.trim().toLowerCase();
  const isTarget = normMovie.includes('нападение на рио браво') || movieNum === 60;
  if (!isTarget) return false;
  const normP = participantName.trim().toLowerCase();
  return ['артемка', 'гоша', 'наташа'].some((target) => normP.includes(target));
};

// Nuance 2 (Screenshot 6): Movie 3 "Комната" - main cells highlighted black
const isBlackMovieHeader = (movieTitle: string, movieNum?: number): boolean => {
  const normMovie = movieTitle.trim().toLowerCase();
  return normMovie === 'комната' || movieNum === 3;
};

// Tooltip cell for participants with asterisk (yellow, 1.5s delay, visible borders in dark theme)
interface ParticipantCellProps {
  name: string;
  score: string;
  hasAsterisk: boolean;
  isBlack: boolean;
}

const ParticipantCells = ({ name, score, hasAsterisk, isBlack }: ParticipantCellProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeBelow: boolean } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cellRef = useRef<HTMLTableCellElement>(null);

  const handleMouseEnter = () => {
    if (!hasAsterisk) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const rect = cellRef.current?.getBoundingClientRect();
      if (rect) {
        const placeBelow = rect.top < 80;
        setCoords({
          top: placeBelow ? rect.bottom + 8 : rect.top - 8,
          left: rect.left + rect.width / 2,
          placeBelow,
        });
        setShowTooltip(true);
      }
    }, 1500); // 1.5s delay as requested
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
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  let nameClasses = 'text-slate-800 dark:text-zinc-200 border-slate-300 dark:border-white/10';
  let scoreClasses = 'text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-white/10';
  let bgClasses = 'bg-white dark:bg-[#131620]';

  if (isBlack) {
    bgClasses = '!bg-black';
    nameClasses = '!text-white font-bold !border-zinc-700';
    scoreClasses = '!text-white font-bold !border-zinc-700';
  } else if (hasAsterisk) {
    bgClasses = '!bg-[#facc15] dark:!bg-[#eab308]';
    nameClasses = '!text-black font-bold !border-black/40 dark:!border-black/70';
    scoreClasses = '!text-black font-bold !border-black/40 dark:!border-black/70';
  }

  return (
    <>
      <td
        ref={cellRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`px-2 sm:px-3 min-[1001px]:px-4 py-2 text-xs sm:text-sm border transition-colors w-[120px] sm:w-[140px] min-[1001px]:w-[180px] max-w-[200px] shrink-0 ${bgClasses} ${nameClasses}`}
      >
        <span className="truncate block">{name}</span>
      </td>
      <td
        className={`px-2 sm:px-3 min-[1001px]:px-4 py-2 text-xs sm:text-sm text-right pr-3 sm:pr-4 min-[1001px]:pr-6 font-semibold border tabular-nums w-14 sm:w-16 min-[1001px]:w-24 shrink-0 ${bgClasses} ${scoreClasses}`}
      >
        {score || '—'}
      </td>

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
            <span className="leading-snug">Просмотр был незадолго до или после просмотра киноклубом</span>
          </div>,
          document.body
        )}
    </>
  );
};

export const MovieTableView = memo(function MovieTableView({
  media,
  ratings,
  participantNames = [],
  onUpdateMovie,
  isLoading = false,
  highlightMovieTitle,
  sortOrder = 'added',
  movieNumberMap,
}: MovieTableViewProps) {
  const dispatch = useDispatch();
  const isModalOpen = useSelector((state: RootState) => state.openModal.value);

  const [movie_ID, setMovie_ID] = useState<number | null>(null);
  const [excelMovieTitle, setExcelMovieTitle] = useState<string | undefined>();
  const [movieSource, setMovieSource] = useState<MovieSource>('tmdb');
  const [fallbackMovieTitle, setFallbackMovieTitle] = useState<string | undefined>();

  const openDescription = (
    movieID: number,
    sourceTitle?: string,
    source: MovieSource = 'tmdb',
    fallbackTitle?: string
  ) => {
    setMovie_ID(movieID);
    setExcelMovieTitle(sourceTitle);
    setMovieSource(source);
    setFallbackMovieTitle(fallbackTitle);
    dispatch(openModal());
  };

  const activeMovieId = isModalOpen ? movie_ID : null;

  if (isLoading) {
    return (
      <div className="w-full py-6">
        <div className="w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131620] shadow-sm animate-pulse">
          <div className="h-12 bg-slate-200 dark:bg-white/10 border-b border-slate-200 dark:border-white/10" />
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="h-16 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]" />
          ))}
        </div>
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="w-full py-16 text-center text-slate-500 dark:text-zinc-400">
        <p className="text-base font-semibold">Фильмы не найдены</p>
      </div>
    );
  }

  return (
    <div className="w-full py-4">
      {/* Table Container styled like original table from Screenshot 4 */}
      <div className="w-full overflow-x-auto rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#131620] shadow-xl">
        <table className="w-full border-collapse text-left select-text">
          <thead>
            <tr className="bg-slate-100 dark:bg-[#181b29] text-slate-800 dark:text-zinc-200 text-xs sm:text-sm font-bold border-b border-slate-300 dark:border-white/10">
              <th className="py-3 px-1.5 sm:px-2 text-center border border-slate-300 dark:border-white/10 w-10 sm:w-12 min-[1001px]:w-14 shrink-0">
                №
              </th>
              <th className="py-3 px-2 sm:px-3 min-[1001px]:px-4 text-center border border-slate-300 dark:border-white/10 w-24 sm:w-28 min-[1001px]:w-32 shrink-0">
                Дата
              </th>
              {/* Separate section between Date and Title for Poster (no right border, widened) */}
              <th
                style={{ borderRight: 'none' }}
                className="p-0 border border-slate-300 dark:border-white/10 !border-r-0 w-28 sm:w-32 min-[1001px]:w-40 shrink-0"
              />
              {/* Title column (no left border) */}
              <th
                style={{ borderLeft: 'none' }}
                className="py-3 px-2.5 sm:px-3 min-[1001px]:px-4 border border-slate-300 dark:border-white/10 !border-l-0 min-w-[120px] sm:min-w-[140px] min-[1001px]:min-w-[200px]"
              >
                Название
              </th>
              <th className="py-3 px-2 sm:px-3 min-[1001px]:px-4 border border-slate-300 dark:border-white/10 w-[120px] sm:w-[140px] min-[1001px]:w-[180px] max-w-[200px] shrink-0">
                Участники
              </th>
              <th className="py-3 px-2 sm:px-3 min-[1001px]:px-4 text-right pr-3 sm:pr-4 min-[1001px]:pr-6 border border-slate-300 dark:border-white/10 w-14 sm:w-16 min-[1001px]:w-24 shrink-0">
                Оценка
              </th>
              <th className="py-3 px-2 sm:px-3 min-[1001px]:px-4 text-center border border-slate-300 dark:border-white/10 w-20 sm:w-24 min-[1001px]:w-28 shrink-0 text-xs sm:text-sm">
                Среднее значение
              </th>
            </tr>
          </thead>
          <tbody>
            {media.map((item, index) => {
              if (item.media_type === 'person') return null;

              const title = item.title || item.original_title;
              const titleKey = (item.excelTitle ?? title ?? '').trim().toLowerCase();
              const canonicalNum = movieNumberMap?.get(titleKey);
              const movieNumber =
                sortOrder === 'top-rated' || sortOrder === 'low-rated'
                  ? index + 1
                  : (canonicalNum ?? index + 1);

              const matchingRating = item.excelTitle
                ? ratings.find(
                    (rating) =>
                      rating.movie.trim().toLocaleLowerCase('ru-RU') ===
                      item.excelTitle?.trim().toLocaleLowerCase('ru-RU')
                  )
                : undefined;

              const rawOverall = matchingRating?.ratings[0]?.scores[1];
              const overallRating = rawOverall !== undefined ? roundRating(rawOverall) : '—';
              const dateStr = formatTableDate(matchingRating?.date);

              const participantRatings: MovieRating[] = matchingRating?.ratings ?? [];
              const rowCount = Math.max(participantRatings.length, 1);

              const isDimaPresent = participantRatings.some((p) =>
                p.userName.trim().toLowerCase().includes('дима')
              );

              const isBlackHeader = isBlackMovieHeader(title, movieNumber);
              const isHighlighted = item.excelTitle === highlightMovieTitle;

              const headerCellClasses = isBlackHeader
                ? '!bg-black !text-white font-bold'
                : 'bg-white dark:bg-[#131620] text-slate-800 dark:text-zinc-100';

              const posterUrl = item.poster_path ? getMovieImageUrl(item.poster_path, 'w342') : null;

              return (
                <React.Fragment key={`${item.id}-${index}`}>
                  {/* Dark Separator Bar (#434343 from Screenshot 4 & Code.gs) */}
                  {index > 0 && (
                    <tr className="h-2.5 sm:h-3 bg-[#434343] dark:bg-[#343847]">
                      <td colSpan={7} className="p-0 border-x border-[#434343] dark:border-[#343847]" />
                    </tr>
                  )}

                  {/* Movie Rows */}
                  {Array.from({ length: rowCount }).map((_, rIdx) => {
                    const participant = participantRatings[rIdx];
                    const pName = participant?.userName ?? '';
                    const pScore = participant?.scores[0] ? roundRating(participant.scores[0]) : '';
                    const hasAsterisk = pName.includes('*');
                    const isPartBlack = isBlackParticipantCell(title, pName, movieNumber);

                    return (
                      <tr
                        key={rIdx}
                        className={`transition-colors ${
                          isHighlighted ? 'bg-amber-500/10' : ''
                        }`}
                      >
                        {/* Column 1: № (merged across participant rows, compact width) */}
                        {rIdx === 0 && (
                          <td
                            rowSpan={rowCount}
                            className={`px-1.5 sm:px-2 py-2.5 text-center text-xs sm:text-sm font-bold border border-slate-300 dark:border-white/10 align-middle tabular-nums w-10 sm:w-12 min-[1001px]:w-14 shrink-0 ${headerCellClasses}`}
                          >
                            {movieNumber}
                          </td>
                        )}

                        {/* Column 2: Дата (merged across participant rows) */}
                        {rIdx === 0 && (
                          <td
                            rowSpan={rowCount}
                            className={`px-2 sm:px-3 min-[1001px]:px-4 py-2.5 text-center text-xs sm:text-sm font-medium border border-slate-300 dark:border-white/10 align-middle tabular-nums w-24 sm:w-28 min-[1001px]:w-32 shrink-0 ${headerCellClasses}`}
                          >
                            {dateStr}
                          </td>
                        )}

                        {/* Column 3: Постер (отдельная секция между датой и названием, отступ слева, ширина увеличена, размер x1.5, без границы справа) */}
                        {rIdx === 0 && (
                          <td
                            rowSpan={rowCount}
                            onClick={() =>
                              openDescription(
                                item.id,
                                item.excelTitle,
                                'source' in item && (item.source === 'tmdb' || item.source === 'kinopoisk')
                                  ? item.source
                                  : getActiveMovieSource(),
                                item.excelTitle || title
                              )
                            }
                            style={{ borderRight: 'none' }}
                            className={`py-2 pl-2 sm:pl-3 min-[1001px]:pl-4 pr-1 border border-slate-300 dark:border-white/10 !border-r-0 align-middle cursor-pointer overflow-hidden w-28 sm:w-32 min-[1001px]:w-40 shrink-0 ${headerCellClasses}`}
                            title={`Постер фильма: ${title}`}
                          >
                            <div className="w-[88px] sm:w-[104px] min-[1001px]:w-[144px] aspect-[2/3] shrink-0 rounded-lg overflow-hidden bg-slate-200 dark:bg-[#1a1e2b] border border-slate-300/80 dark:border-white/10 shadow-md flex items-center justify-center my-auto transition-all duration-300 hover:shadow-lg group">
                              {posterUrl ? (
                                <img
                                  src={posterUrl}
                                  alt={title}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-cover block transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg
                                    className="w-7 h-7 text-slate-400 dark:text-zinc-500 opacity-60"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1.5}
                                      d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </td>
                        )}

                        {/* Column 4: Название (merged across participant rows, no left border) */}
                        {rIdx === 0 && (
                          <td
                            rowSpan={rowCount}
                            onClick={() =>
                              openDescription(
                                item.id,
                                item.excelTitle,
                                'source' in item && (item.source === 'tmdb' || item.source === 'kinopoisk')
                                  ? item.source
                                  : getActiveMovieSource(),
                                item.excelTitle || title
                              )
                            }
                            style={{ borderLeft: 'none' }}
                            className={`px-2.5 sm:px-3 min-[1001px]:px-4 py-2 text-xs sm:text-sm font-semibold border border-slate-300 dark:border-white/10 !border-l-0 align-middle cursor-pointer hover:underline hover:text-amber-500 transition-colors min-w-[120px] sm:min-w-[140px] min-[1001px]:min-w-[200px] ${headerCellClasses}`}
                            title={`Открыть информацию о фильме: ${title}`}
                          >
                            <span className="font-semibold text-xs sm:text-sm min-[1001px]:text-base leading-snug line-clamp-3">
                              {title}
                            </span>
                          </td>
                        )}

                        {/* Column 4: Участники & Column 5: Оценка */}
                        {participant ? (
                          <ParticipantCells
                            name={pName}
                            score={pScore}
                            hasAsterisk={hasAsterisk}
                            isBlack={isPartBlack}
                          />
                        ) : (
                          <>
                            <td className="px-2 sm:px-3 min-[1001px]:px-4 py-2 text-xs sm:text-sm text-slate-400 dark:text-zinc-500 italic border border-slate-300 dark:border-white/10 bg-white dark:bg-[#131620] w-[120px] sm:w-[140px] min-[1001px]:w-[180px] max-w-[200px] shrink-0">
                              —
                            </td>
                            <td className="px-2 sm:px-3 min-[1001px]:px-4 py-2 text-xs sm:text-sm text-right pr-3 sm:pr-4 min-[1001px]:pr-6 text-slate-400 dark:text-zinc-500 italic border border-slate-300 dark:border-white/10 bg-white dark:bg-[#131620] w-14 sm:w-16 min-[1001px]:w-24 shrink-0">
                              —
                            </td>
                          </>
                        )}

                        {/* Column 6: Среднее значение (merged across participant rows) */}
                        {rIdx === 0 && (
                          <td
                            rowSpan={rowCount}
                            className={`px-2 sm:px-3 min-[1001px]:px-4 py-2.5 text-center text-xs sm:text-sm font-bold border border-slate-300 dark:border-white/10 align-middle tabular-nums w-20 sm:w-24 min-[1001px]:w-28 shrink-0 ${headerCellClasses}`}
                          >
                            {overallRating}
                          </td>
                        )}
                      </tr>
                    );
                  })}

                  {/* Dedicated full-width row for movies Dima didn't watch (as on user's screenshot) */}
                  {!isDimaPresent && (
                    <tr className="border-t border-slate-300 dark:border-white/10">
                      <td
                        colSpan={7}
                        className="px-6 py-2.5 sm:py-3.5 text-center border border-slate-300 dark:border-white/10 select-none whitespace-nowrap overflow-hidden bg-slate-50/70 dark:bg-[#0e111a]"
                        style={{
                          fontFamily: "'Pacifico', cursive",
                          fontStyle: 'italic',
                          fontWeight: 'bold',
                        }}
                      >
                        <span className="text-xl sm:text-2xl tracking-wide text-slate-400 dark:text-zinc-500/50 opacity-80 block truncate text-center">
                          ДИМА НЕ СМОТРЕЛ :(((((((((((((((((((((((((((((((((((((
                        </span>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Movie Details Modal */}
      {activeMovieId !== null && (
        <Modal
          isHidden=""
          movie_ID={activeMovieId}
          ratings={ratings}
          excelMovieTitle={excelMovieTitle}
          source={movieSource}
          fallbackTitle={fallbackMovieTitle}
          participantNames={participantNames}
          onUpdateMovie={onUpdateMovie}
          onClose={() => setMovie_ID(null)}
        />
      )}
    </div>
  );
});

export default MovieTableView;