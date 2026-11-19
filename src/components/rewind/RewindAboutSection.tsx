import React from 'react';
import { aboutClubPlaceholders } from './rewindPlaceholders';

interface RewindAboutSectionProps {
  totalClubMovies: number;
  totalParticipants: number;
}

export const RewindAboutSection: React.FC<RewindAboutSectionProps> = ({
  totalClubMovies,
  totalParticipants,
}) => {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131620] p-5 sm:p-7 md:p-8 shadow-sm transition-colors">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-white/5">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 mb-3">
            <span>🛡️</span>
            <span>{aboutClubPlaceholders.badge}</span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2.5">
            {aboutClubPlaceholders.title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
            {aboutClubPlaceholders.description}
          </p>
        </div>

        {/* Founded Date Pill */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 shrink-0">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center text-xl shrink-0">
            📅
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
              Дата основания
            </div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
              {aboutClubPlaceholders.foundedDate}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-6">
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 flex flex-col items-center text-center">
          <span className="text-xl sm:text-2xl font-black text-amber-500 mb-0.5">
            {totalClubMovies}
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400">
            Фильмов в каталоге
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
