import React from 'react';
import { aboutClubPlaceholders } from './rewindPlaceholders';

interface RewindAboutSectionProps {
  totalClubMovies: number;
  totalParticipants: number;
  year?: string | 'all';
}

export const RewindAboutSection: React.FC<RewindAboutSectionProps> = ({
  totalClubMovies,
  totalParticipants,
  year = 'all',
}) => {
  const moviesLabel =
    year === 'all'
      ? 'Фильмов в каталоге'
      : `Фильмов за ${year} год`;

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131620] p-4 sm:p-5 shadow-sm transition-colors">
      {/* Stats Counter Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 flex flex-col items-center text-center">
          <span className="text-xl sm:text-2xl font-black text-amber-500 mb-0.5">
            {totalClubMovies}
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400">
            {moviesLabel}
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 flex flex-col items-center text-center">
          <span className="text-xl sm:text-2xl font-black text-indigo-500 mb-0.5">
            {totalParticipants > 0 ? totalParticipants : '20+'}
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400">
            Участников клуба
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 flex flex-col items-center text-center">
          <span className="text-xl sm:text-2xl font-black text-emerald-500 mb-0.5">
            {aboutClubPlaceholders.stats[1]?.value ?? '500+ ч.'}
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400">
            Киночасов в эфире
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 flex flex-col items-center text-center">
          <span className="text-xl sm:text-2xl font-black text-purple-500 mb-0.5">
            {aboutClubPlaceholders.stats[2]?.value ?? '1000+'}
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400">
            Сломанных копий в спорах
          </span>
        </div>
      </div>
    </section>
  );
};

export default RewindAboutSection;
