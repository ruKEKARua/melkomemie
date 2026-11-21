import React from 'react';
import type { RewindClubSummary, RewindMovieSummary } from '../../utils/rewindStats';
import { getMovieImageUrl } from '../../api/tmdbImage';
import { getRatingBadgeColor } from '../../utils/ratings';

interface RewindClubSummarySectionProps {
  clubSummary: RewindClubSummary;
  activeParticipantsCount: number;
}

const MovieRankCard: React.FC<{
  movie: RewindMovieSummary;
  rank: number;
  type: 'best' | 'worst';
}> = ({ movie, rank, type }) => {
  const rankColors =
    type === 'best'
      ? rank === 1
        ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
        : rank === 2
          ? 'bg-slate-300 text-slate-900 ring-2 ring-slate-200'
          : 'bg-amber-700 text-amber-100 ring-2 ring-amber-600'
      : rank === 1
        ? 'bg-rose-600 text-white ring-2 ring-rose-400'
        : rank === 2
          ? 'bg-rose-700 text-white ring-2 ring-rose-500'
          : 'bg-rose-800 text-rose-100 ring-2 ring-rose-600';

  const badgeColorClass = getRatingBadgeColor(movie.rating);
  const posterUrl = movie.posterPath ? getMovieImageUrl(movie.posterPath, 'w185') : '';

  return (
    <div className="flex items-center gap-3.5 p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/5 hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-all group">
      {/* Rank Indicator */}
      <div
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-black shrink-0 ${rankColors}`}
      >
        #{rank}
      </div>

      {/* Poster Thumbnail */}
      <div className="w-12 sm:w-14 aspect-[2/3] rounded-lg overflow-hidden bg-slate-200 dark:bg-zinc-800 shrink-0 border border-black/10 dark:border-white/10 shadow-xs group-hover:scale-105 transition-transform">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.movieTitle}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 dark:text-zinc-500">
            🎬
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4
          className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors"
          title={movie.movieTitle}
        >
          {movie.movieTitle}
        </h4>

        {/* Genres */}
        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
          {movie.genres.slice(0, 2).map((genre) => (
            <span
              key={genre}
              className="text-[10px] text-slate-500 dark:text-zinc-400 bg-slate-200/70 dark:bg-white/5 px-1.5 py-0.5 rounded font-medium truncate max-w-[110px]"
            >
              {genre}
            </span>
          ))}
          {movie.date && (
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 hidden sm:inline">
              • {movie.date}
            </span>
          )}
        </div>
      </div>

      {/* Rating Pill */}
      <div
        className={`px-2.5 py-1 rounded-lg text-xs sm:text-sm font-extrabold border shrink-0 tabular-nums ${badgeColorClass}`}
      >
        ★ {movie.rating > 0 ? movie.rating.toFixed(1) : '—'}
      </div>
    </div>
  );
};

export const RewindClubSummarySection: React.FC<RewindClubSummarySectionProps> = ({
  clubSummary,
  activeParticipantsCount,
}) => {
  const { totalMovies, avgRating, top3Best, top3Worst } = clubSummary;

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131620] p-5 sm:p-7 md:p-8 shadow-sm transition-colors">
      {/* Header & Mini Metrics Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-white/5">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Итоги киноклуба
          </h2>
        </div>

        {/* 3 Mini Metrics */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-center">
            <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-zinc-400">
              Фильмов
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {totalMovies}
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-center">
            <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-zinc-400">
              Средний балл
            </div>
            <div className="text-base sm:text-lg font-black text-amber-500">
              ★ {avgRating > 0 ? avgRating.toFixed(2) : '—'}
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-center">
            <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-zinc-400">
              Зрителей
            </div>
            <div className="text-base sm:text-lg font-black text-indigo-500">
              {activeParticipantsCount}
            </div>
          </div>
        </div>
      </div>

      {/* Two Columns: Best 3 vs Worst 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
        {/* Top 3 Best */}
        <div className="rounded-xl p-4 sm:p-5 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <h3 className="text-sm sm:text-base font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                Топ-3 фильма года
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              Золотой фонд
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {top3Best.length > 0 ? (
              top3Best.map((movie, idx) => (
                <MovieRankCard
                  key={`best-${movie.movieTitle}-${idx}`}
                  movie={movie}
                  rank={idx + 1}
                  type="best"
                />
              ))
            ) : (
              <div className="py-8 text-center text-xs sm:text-sm text-slate-400 dark:text-zinc-500">
                Пока нет фильмов с оценками
              </div>
            )}
          </div>
        </div>

        {/* Top 3 Worst */}
        <div className="rounded-xl p-4 sm:p-5 bg-gradient-to-b from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/30">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">💩</span>
              <h3 className="text-sm sm:text-base font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                Топ-3 худших фильма
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              Мы живём в обществе...
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {top3Worst.length > 0 ? (
              top3Worst.map((movie, idx) => (
                <MovieRankCard
                  key={`worst-${movie.movieTitle}-${idx}`}
                  movie={movie}
                  rank={idx + 1}
                  type="worst"
                />
              ))
            ) : (
              <div className="py-8 text-center text-xs sm:text-sm text-slate-400 dark:text-zinc-500">
                Пока нет фильмов с оценками
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RewindClubSummarySection;
