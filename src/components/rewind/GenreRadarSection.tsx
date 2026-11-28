import React, { useState } from 'react';
import type { GenreRadarStructure, ParticipantStats, RewindMovieSummary } from '../../utils/rewindStats';
import { GenreRadarChart, type RadarMode } from './GenreRadarChart';
import { getMovieImageUrl } from '../../api/tmdbImage';
import { getRatingBadgeColor } from '../../utils/ratings';

interface GenreRadarSectionProps {
  genreRadar: GenreRadarStructure;
  eligibleParticipants: string[];
  participantStats: ParticipantStats[];
}

const RadarMovieItem: React.FC<{
  movie: RewindMovieSummary;
  rank: number;
  type: 'best' | 'worst';
  isParticipant: boolean;
}> = ({ movie, rank, type, isParticipant }) => {
  const badgeColorClass = getRatingBadgeColor(movie.rating);
  const posterUrl = movie.posterPath ? getMovieImageUrl(movie.posterPath, 'w185') : '';

  const rankBadgeBg =
    type === 'best'
      ? rank === 1
        ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300'
        : rank === 2
          ? 'bg-slate-300 text-slate-900 font-bold ring-2 ring-slate-200'
          : rank === 3
            ? 'bg-amber-700 text-amber-100 font-bold ring-2 ring-amber-600'
            : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-zinc-300 font-bold'
      : rank === 1
        ? 'bg-rose-600 text-white font-black ring-2 ring-rose-400'
        : 'bg-rose-800 text-rose-100 font-bold';

  return (
    <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/5 hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-all group">
      {/* Rank indicator */}
      <div
        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${rankBadgeBg}`}
      >
        #{rank}
      </div>

      {/* Poster */}
      <div className="w-10 sm:w-11 aspect-[2/3] rounded-md overflow-hidden bg-slate-200 dark:bg-zinc-800 shrink-0 border border-black/10 dark:border-white/10 group-hover:scale-105 transition-transform">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.movieTitle}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 dark:text-zinc-500">
            🎬
          </div>
        )}
      </div>

      {/* Title & Genres */}
      <div className="flex-1 min-w-0">
        <h5
          className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors"
          title={movie.movieTitle}
        >
          {movie.movieTitle}
        </h5>
        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
          {movie.genres.slice(0, 2).map((genre) => (
            <span
              key={genre}
              className="text-[10px] text-slate-500 dark:text-zinc-400 bg-slate-200/60 dark:bg-white/5 px-1.5 py-0.2 rounded font-medium truncate max-w-[100px]"
            >
              {genre}
            </span>
          ))}
        </div>
      </div>

      {/* Score Pair Display */}
      {isParticipant ? (
        <div className="flex flex-col items-end shrink-0 pl-1">
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">
              Я:
            </span>
            <span className={`px-2 py-0.5 rounded-md text-xs font-black border tabular-nums ${badgeColorClass}`}>
              ★ {movie.rating.toFixed(1)}
            </span>
          </div>

          {movie.clubRating !== undefined && (
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium tabular-nums mt-0.5">
              клуб: {movie.clubRating.toFixed(1)}
            </span>
          )}
        </div>
      ) : (
        <div className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border shrink-0 tabular-nums ${badgeColorClass}`}>
          ★ {movie.rating > 0 ? movie.rating.toFixed(1) : '—'}
        </div>
      )}
    </div>
  );
};

export const GenreRadarSection: React.FC<GenreRadarSectionProps> = ({
  genreRadar,
  eligibleParticipants,
  participantStats,
}) => {
  const [selectedContext, setSelectedContext] = useState<string>('all');
  const [radarMode, setRadarMode] = useState<RadarMode>('frequency');

  const { topGenres, getProfile, profiles } = genreRadar;
  const clubProfile = profiles['all'] ?? getProfile('all');
  const activeProfile = profiles[selectedContext] ?? getProfile(selectedContext);

  const isParticipantSelected = selectedContext !== 'all';

  // Stats map for quick watched count lookup
  const statsMap = new Map(participantStats.map((p) => [p.userName, p]));

  // Eligible participants excluding 'all'
  const eligibleMembers = eligibleParticipants.filter((p) => p !== 'all');

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131620] p-5 sm:p-7 md:p-8 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex flex-col gap-4 pb-6 border-b border-slate-100 dark:border-white/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Паутина вкусов и личные топы
            </h2>
          </div>

          {/* Active Context Badge */}
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-500 dark:text-zinc-400">Профиль:</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              {isParticipantSelected ? selectedContext : 'Весь клуб'}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
              ({activeProfile.watchedCount} фильмов)
            </span>
          </div>
        </div>

        {/* Context Selector: Club + Eligible Participants Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 py-1">
          {/* Entire Club Button */}
          <button
            type="button"
            onClick={() => setSelectedContext('all')}
            className={`w-full min-w-0 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all cursor-pointer flex items-center justify-start gap-2 ${
              selectedContext === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 ring-2 ring-amber-400/50'
                : 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/5'
            }`}
          >
            <span className="shrink-0">👥</span>
            <span className="truncate">Весь клуб</span>
          </button>

          {/* Individual Eligible Participants */}
          {eligibleMembers.map((userName) => {
            const isSelected = selectedContext === userName;
            const watchedCount = statsMap.get(userName)?.watchedCount ?? 0;
            return (
              <button
                key={userName}
                type="button"
                title={userName}
                onClick={() => setSelectedContext(userName)}
                className={`w-full min-w-0 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 ring-2 ring-amber-400/50'
                    : 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/5'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0">👤</span>
                  <span className="truncate">{userName}</span>
                </span>
                <span className={`shrink-0 text-[10px] font-extrabold px-1.5 py-0.5 rounded tabular-nums ${
                  isSelected
                    ? 'bg-slate-950/20 text-slate-950'
                    : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-zinc-400'
                }`}>
                  {watchedCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Few Eligible Members Hint */}
        {eligibleMembers.length < 2 && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 rounded-xl">
            <span>ℹ️</span>
            <span>
              В список личных профилей попадают участники с <strong>10+ просмотренными фильмами</strong> за выбранный период.
            </span>
          </div>
        )}
      </div>

      {/* Main Grid: Left Column (Radar Chart) & Right Column (Movie Lists) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 items-start">
        {/* Left Column: Radar Chart & Genre Chips (5/12 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center rounded-xl p-4 sm:p-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5">
          {/* Radar Mode Switcher */}
          <div className="w-full flex items-center justify-between gap-2 mb-3 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Режим радара:
            </span>
            <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-white/5 p-1 rounded-xl border border-slate-300/50 dark:border-white/5">
              <button
                type="button"
                onClick={() => setRadarMode('frequency')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  radarMode === 'frequency'
                    ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-400'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Сортировка и масштаб по взвешенной частоте жанров"
              >
                Чаще смотрят
              </button>
              <button
                type="button"
                onClick={() => setRadarMode('rating')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  radarMode === 'rating'
                    ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-400'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Масштаб по среднему баллу жанра (до 10)"
              >
                Выше оценивают
              </button>
            </div>
          </div>

          <GenreRadarChart
            topGenres={topGenres}
            activeRadar={activeProfile.radar}
            clubRadar={clubProfile.radar}
            isParticipantSelected={isParticipantSelected}
            participantName={selectedContext}
            mode={radarMode}
          />

          {/* Quick Genre Breakdown Chips */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-200/70 dark:border-white/5">
            {activeProfile.radar.map((item) => (
              <div
                key={item.genre}
                className="p-2 rounded-lg bg-white dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/5 flex flex-col text-left transition-colors hover:border-amber-500/40"
                title={`${item.genre}: ${item.count} фильмов (вес ${item.weightedCount.toFixed(1)}) • ср. ${item.avgRating > 0 ? item.avgRating.toFixed(1) : '—'}`}
              >
                <div className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 truncate">
                  {item.genre}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                  {item.count} ф. (вес {item.weightedCount.toFixed(1)}) • ср. {item.avgRating > 0 ? item.avgRating.toFixed(1) : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Top 5 Best & Top 3 Worst (7/12 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Top 5 Best */}
          <div className="rounded-xl p-4 sm:p-5 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30">
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏆</span>
                <h4 className="text-xs sm:text-sm font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                  {isParticipantSelected ? `Топ-5 ${selectedContext}` : 'Топ-5 киноклуба'}
                </h4>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                {isParticipantSelected ? 'Личные фавориты' : 'Лучшее кино'}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {activeProfile.top5Best.length > 0 ? (
                activeProfile.top5Best.map((movie, idx) => (
                  <RadarMovieItem
                    key={`radar-best-${movie.movieTitle}-${idx}`}
                    movie={movie}
                    rank={idx + 1}
                    type="best"
                    isParticipant={isParticipantSelected}
                  />
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-zinc-500">
                  Пока нет оценённых фильмов
                </div>
              )}
            </div>
          </div>

          {/* Top 3 Worst */}
          <div className="rounded-xl p-4 sm:p-5 bg-gradient-to-b from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/30">
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">💩</span>
                <h4 className="text-xs sm:text-sm font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                  {isParticipantSelected ? `Топ-3 худших (${selectedContext})` : 'Топ-3 худших киноклуба'}
                </h4>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                {isParticipantSelected ? 'Личный провал' : 'Клуб не оценил'}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {activeProfile.top3Worst.length > 0 ? (
                activeProfile.top3Worst.map((movie, idx) => (
                  <RadarMovieItem
                    key={`radar-worst-${movie.movieTitle}-${idx}`}
                    movie={movie}
                    rank={idx + 1}
                    type="worst"
                    isParticipant={isParticipantSelected}
                  />
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-zinc-500">
                  Пока нет оценённых фильмов
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GenreRadarSection;
