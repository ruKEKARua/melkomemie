import React, { useState, useMemo } from 'react';
import type { PairCompatibility } from '../../utils/rewindStats';
import { getMovieImageUrl } from '../../api/tmdbImage';
import { declineParticipant } from '../../utils/nameGrammar';

interface HeadToHeadSectionProps {
  eligibleParticipants: string[];
  participantStats: Array<{ userName: string; watchedCount: number }>;
  compareTwoParticipants: (userA: string, userB: string) => PairCompatibility;
  compatibilityMatrix: PairCompatibility[];
}

export const HeadToHeadSection: React.FC<HeadToHeadSectionProps> = ({
  eligibleParticipants,
  participantStats,
  compareTwoParticipants,
}) => {
  // Extract candidates for comparison (exclude 'all')
  const candidates = useMemo(() => {
    const list = eligibleParticipants.filter((p) => p !== 'all');
    if (list.length >= 2) return list;

    // Fallback to any active participants if eligible count is under 2
    const active = participantStats
      .filter((p) => p.watchedCount > 0)
      .map((p) => p.userName);
    return active.length >= 2 ? active : list;
  }, [eligibleParticipants, participantStats]);

  const [selectedUserA, setSelectedUserA] = useState<string>('');
  const [selectedUserB, setSelectedUserB] = useState<string>('');

  const userA = candidates.includes(selectedUserA)
    ? selectedUserA
    : (candidates[0] ?? '');

  const userB =
    candidates.includes(selectedUserB) && selectedUserB !== userA
      ? selectedUserB
      : (candidates.find((c) => c !== userA) ?? candidates[1] ?? userA);

  // Comparison result for currently selected pair
  const comparison = useMemo(() => {
    if (!userA || !userB || userA === userB) {
      return {
        userA,
        userB,
        commonMoviesCount: 0,
        compatibilityScore: 0,
        avgDiff: 0,
        top5Closest: [],
        top5Disagreements: [],
      } as PairCompatibility;
    }
    return compareTwoParticipants(userA, userB);
  }, [userA, userB, compareTwoParticipants]);

  // Pre-calculate full matrix lookup for the heat map
  const matrixLookup = useMemo(() => {
    const map = new Map<string, PairCompatibility>();
    for (let i = 0; i < candidates.length; i++) {
      for (let j = 0; j < candidates.length; j++) {
        if (i === j) continue;
        const u1 = candidates[i];
        const u2 = candidates[j];
        const key = `${u1.toLowerCase()}__${u2.toLowerCase()}`;
        map.set(key, compareTwoParticipants(u1, u2));
      }
    }
    return map;
  }, [candidates, compareTwoParticipants]);

  const handleSwap = () => {
    setSelectedUserA(userB);
    setSelectedUserB(userA);
  };

  const handleMatrixCellClick = (u1: string, u2: string) => {
    if (u1 === u2) return;
    setSelectedUserA(u1);
    setSelectedUserB(u2);
  };

  // Compatibility score badge styling
  const getScoreColor = (score: number) => {
    if (score >= 75) {
      return {
        text: 'text-emerald-500 dark:text-emerald-400',
        bg: 'bg-emerald-500/15 dark:bg-emerald-500/20',
        border: 'border-emerald-500/40',
        glow: 'shadow-emerald-500/20',
        label: 'Кино-единомышленники',
      };
    }
    if (score >= 55) {
      return {
        text: 'text-amber-500 dark:text-amber-400',
        bg: 'bg-amber-500/15 dark:bg-amber-500/20',
        border: 'border-amber-500/40',
        glow: 'shadow-amber-500/20',
        label: 'Умеренное согласие',
      };
    }
    return {
      text: 'text-rose-500 dark:text-rose-400',
      bg: 'bg-rose-500/15 dark:bg-rose-500/20',
      border: 'border-rose-500/40',
      glow: 'shadow-rose-500/20',
      label: 'Полярные взгляды',
    };
  };

  const scoreMeta = getScoreColor(comparison.compatibilityScore);

  if (candidates.length < 2) {
    return (
      <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131620] p-6 sm:p-8 text-center">
        <div className="text-2xl mb-2">👥</div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
          Недостаточно данных для дуэлей
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
          Для построения матрицы совместимости нужно хотя бы 2 активных участника киноклуба с общими
          просмотрами за выбранный год.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131620] p-5 sm:p-7 md:p-8 shadow-sm transition-colors">
      {/* Section Header */}
      <div className="pb-6 border-b border-slate-100 dark:border-white/5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 mb-2">
          <span>⚔️</span>
          <span>Вкусовая совместимость</span>
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Дуэль киноманов 1 на 1 и матрица клуба
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
          Узнайте, с кем из соклубников ваши вкусы совпадают на все 100%, а с кем каждое обсуждение
          превращается в горячий спор.
        </p>
      </div>

      {/* Main 2-Column Grid: 1-on-1 Duel (Left) vs Heatmap Matrix (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pt-6 items-start">
        {/* LEFT COLUMN: 1 on 1 Matchup (7 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-5">
          {/* User Selectors Bar */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* User A Select */}
            <div className="w-full sm:flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                Зритель 1
              </label>
              <select
                value={userA}
                onChange={(e) => setSelectedUserA(e.target.value)}
                className="w-full rounded-lg bg-white dark:bg-[#181b28] border border-slate-300 dark:border-white/10 px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
              >
                {candidates.map((name) => (
                  <option key={`a-${name}`} value={name} disabled={name === userB}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <button
              type="button"
              onClick={handleSwap}
              title="Поменять участников местами"
              className="mt-4 sm:mt-4 p-2.5 rounded-xl bg-slate-200/80 dark:bg-white/10 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-zinc-300 transition-all cursor-pointer shrink-0"
            >
              <span className="text-sm">↔</span>
            </button>

            {/* User B Select */}
            <div className="w-full sm:flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                Зритель 2
              </label>
              <select
                value={userB}
                onChange={(e) => setSelectedUserB(e.target.value)}
                className="w-full rounded-lg bg-white dark:bg-[#181b28] border border-slate-300 dark:border-white/10 px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
              >
                {candidates.map((name) => (
                  <option key={`b-${name}`} value={name} disabled={name === userA}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Big Score Card */}
          <div className="p-5 sm:p-6 rounded-xl bg-gradient-to-b from-slate-50 to-white dark:from-[#181b28] dark:to-[#12141f] border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              {/* Compatibility Big Percentage Pill */}
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 shadow-lg ${scoreMeta.bg} ${scoreMeta.border} ${scoreMeta.text} ${scoreMeta.glow}`}
              >
                <span className="text-2xl sm:text-3xl font-black tabular-nums">
                  {comparison.commonMoviesCount > 0 ? `${comparison.compatibilityScore}%` : '—'}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-tight opacity-80">
                  Совпадение
                </span>
              </div>

              <div>
                <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  {comparison.commonMoviesCount > 0 ? scoreMeta.label : 'Нет общих просмотров'}
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Сравнение вкусов между{' '}
                  <span className="font-bold text-slate-800 dark:text-zinc-200">
                    {declineParticipant(userA, 'ins')}
                  </span>{' '}
                  и{' '}
                  <span className="font-bold text-slate-800 dark:text-zinc-200">
                    {declineParticipant(userB, 'ins')}
                  </span>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-around sm:justify-end border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-white/10 pt-3 sm:pt-0 sm:pl-5">
              <div className="text-center sm:text-right">
                <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500">
                  Общих фильмов
                </div>
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums">
                  {comparison.commonMoviesCount}
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500">
                  Ср. разница
                </div>
                <div className="text-base sm:text-lg font-black text-amber-500 tabular-nums">
                  Δ {comparison.avgDiff.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Subcolumns: Closest (+) vs Disagreements (-) */}
          {comparison.commonMoviesCount > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top 5 Closest */}
              <div className="rounded-xl p-4 bg-emerald-500/5 border border-emerald-500/25">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    <span>🎯</span>
                    <span>Ближайшие вкусы (+)</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
                    Мин. разница
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {comparison.top5Closest.map((item, idx) => (
                    <div
                      key={`close-${item.movieTitle}-${idx}`}
                      className="p-2 sm:p-2.5 rounded-lg bg-white dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/5 flex items-center gap-2.5 group"
                    >
                      <div className="w-8 aspect-[2/3] rounded overflow-hidden bg-slate-200 dark:bg-zinc-800 shrink-0">
                        {item.posterPath ? (
                          <img
                            src={getMovieImageUrl(item.posterPath, 'w92')}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px]">
                            🎬
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div
                          className="text-xs font-bold text-slate-900 dark:text-white truncate"
                          title={item.movieTitle}
                        >
                          {item.movieTitle}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                          {userA}: <strong className="text-slate-800 dark:text-zinc-200">★ {item.scoreA}</strong> |{' '}
                          {userB}: <strong className="text-slate-800 dark:text-zinc-200">★ {item.scoreB}</strong>
                        </div>
                      </div>

                      <div className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 tabular-nums shrink-0">
                        Δ {item.diff.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 5 Disagreements */}
              <div className="rounded-xl p-4 bg-rose-500/5 border border-rose-500/25">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                    <span>⚡</span>
                    <span>Разногласия (-)</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
                    Макс. разрыв
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {comparison.top5Disagreements.map((item, idx) => (
                    <div
                      key={`disagree-${item.movieTitle}-${idx}`}
                      className="p-2 sm:p-2.5 rounded-lg bg-white dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/5 flex items-center gap-2.5 group"
                    >
                      <div className="w-8 aspect-[2/3] rounded overflow-hidden bg-slate-200 dark:bg-zinc-800 shrink-0">
                        {item.posterPath ? (
                          <img
                            src={getMovieImageUrl(item.posterPath, 'w92')}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px]">
                            🎬
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div
                          className="text-xs font-bold text-slate-900 dark:text-white truncate"
                          title={item.movieTitle}
                        >
                          {item.movieTitle}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                          {userA}: <strong className="text-slate-800 dark:text-zinc-200">★ {item.scoreA}</strong> vs{' '}
                          {userB}: <strong className="text-slate-800 dark:text-zinc-200">★ {item.scoreB}</strong>
                        </div>
                      </div>

                      <div className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 tabular-nums shrink-0">
                        Δ {item.diff.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-dashed border-slate-300 dark:border-white/10">
              У выбранных зрителей нет совместных оценок в этом периоде.
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Compatibility Heatmap Matrix (5 cols) */}
        <div className="xl:col-span-5 flex flex-col rounded-xl p-4 sm:p-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Тепловая матрица совместимости
            </h3>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500">
              Клик для сравнения
            </span>
          </div>

          {/* Matrix Scrollable Container */}
          <div className="overflow-x-auto no-scrollbar max-w-full pb-2">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr>
                  <th className="p-1.5 text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase text-left">
                    Зритель
                  </th>
                  {candidates.map((name) => (
                    <th
                      key={`th-${name}`}
                      className="p-1.5 text-[10px] sm:text-[11px] font-extrabold text-slate-700 dark:text-zinc-300 max-w-[60px] truncate"
                      title={name}
                    >
                      {name.slice(0, 5)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {candidates.map((rowName) => (
                  <tr key={`row-${rowName}`}>
                    {/* Row Header */}
                    <td
                      className="p-1.5 text-left text-[11px] font-bold text-slate-800 dark:text-zinc-200 whitespace-nowrap max-w-[80px] truncate"
                      title={rowName}
                    >
                      {rowName.slice(0, 6)}
                    </td>

                    {/* Matrix Cells */}
                    {candidates.map((colName) => {
                      if (rowName === colName) {
                        return (
                          <td
                            key={`cell-${rowName}-${colName}`}
                            className="p-1 text-[11px] text-slate-300 dark:text-zinc-700 font-bold select-none"
                          >
                            —
                          </td>
                        );
                      }

                      const key = `${rowName.toLowerCase()}__${colName.toLowerCase()}`;
                      const pair = matrixLookup.get(key);
                      const score = pair?.compatibilityScore ?? 0;
                      const hasCommon = (pair?.commonMoviesCount ?? 0) > 0;

                      const isSelectedPair =
                        (userA.toLowerCase() === rowName.toLowerCase() &&
                          userB.toLowerCase() === colName.toLowerCase()) ||
                        (userA.toLowerCase() === colName.toLowerCase() &&
                          userB.toLowerCase() === rowName.toLowerCase());

                      // Heat color grading
                      let cellClass = 'bg-slate-200/50 dark:bg-white/5 text-slate-400 dark:text-zinc-500';
                      if (hasCommon) {
                        if (score >= 75) {
                          cellClass = 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30';
                        } else if (score >= 55) {
                          cellClass = 'bg-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-500/30';
                        } else {
                          cellClass = 'bg-rose-500/20 text-rose-700 dark:text-rose-300 hover:bg-rose-500/30';
                        }
                      }

                      return (
                        <td key={`cell-${rowName}-${colName}`} className="p-1">
                          <button
                            type="button"
                            onClick={() => handleMatrixCellClick(rowName, colName)}
                            title={`${rowName} + ${colName}: ${hasCommon ? `${score}% (${pair?.commonMoviesCount} общих фильмов)` : 'нет общих фильмов'}`}
                            className={`w-full h-8 sm:h-9 rounded-md text-[11px] font-extrabold flex items-center justify-center transition-all cursor-pointer select-none border ${cellClass} ${
                              isSelectedPair
                                ? '!border-amber-500 ring-2 ring-amber-400 font-black shadow-sm'
                                : 'border-transparent'
                            }`}
                          >
                            {hasCommon ? `${score}%` : '—'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Matrix Legend */}
          <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-slate-200/70 dark:border-white/5 text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40 border border-emerald-500/60" />
              <span>&ge; 75% Согласие</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/40 border border-amber-500/60" />
              <span>55–74% Нейтрал</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/40 border border-rose-500/60" />
              <span>&lt; 55% Разногласие</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeadToHeadSection;
