import React from 'react';
import type { RewindAchievement } from '../../utils/rewindStats';
import { achievementPlaceholdersMeta } from './rewindPlaceholders';

interface RewindAchievementsSectionProps {
  achievements: RewindAchievement[];
  year: string | 'all';
}

export const RewindAchievementsSection: React.FC<RewindAchievementsSectionProps> = ({
  achievements,
  year,
}) => {
  const yearText = year === 'all' ? 'за всё время' : `в ${year} году`;

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131620] p-5 sm:p-7 md:p-8 shadow-sm transition-colors">
      {/* Section Header */}
      <div className="pb-6 border-b border-slate-100 dark:border-white/5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 mb-2">
          <span>🎮</span>
          <span>Steam Achievements</span>
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Зал славы (и позора) киноклуба
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1 max-w-2xl">
          Автовычисляемые трофеи и редкие достижения, разблокированные участниками нашего киноклуба {yearText}.
        </p>
      </div>

      {/* Achievements 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 pt-6">
        {achievements.map((ach) => {
          const meta = achievementPlaceholdersMeta[ach.id];
          const badgeIcon = ach.badge || meta?.badge || '🏆';
          const rarity = meta?.rarity || 'Особое';
          const rarityColor = meta?.rarityColor || 'text-amber-400 border-amber-500/40 bg-amber-500/10';
          const flavorText = meta?.flavorText || '';

          return (
            <div
              key={ach.id}
              className="relative rounded-xl p-4 sm:p-5 bg-slate-50 dark:bg-[#181b28] border border-slate-200 dark:border-white/10 hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:shadow-lg transition-all flex flex-col justify-between group overflow-hidden"
            >
              {/* Top ambient glow */}
              <div
                aria-hidden="true"
                className="absolute -top-12 -right-12 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none"
              />

              <div>
                {/* Header: Badge Icon & Steam Rarity Pill */}
                <div className="flex items-start justify-between gap-3 mb-3.5">
                  {/* Achievement Icon Box */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-900 dark:bg-[#0c0e15] border-2 border-amber-500/40 flex items-center justify-center text-2xl sm:text-3xl shadow-inner shrink-0 group-hover:scale-105 group-hover:border-amber-400 transition-all">
                    {badgeIcon}
                  </div>

                  {/* Steam Rarity Tag */}
                  <span
                    className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-md border ${rarityColor} shrink-0`}
                  >
                    {rarity}
                  </span>
                </div>

                {/* Achievement Title */}
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight mb-1 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                  {ach.title}
                </h3>

                {/* Flavor Joke Text */}
                {flavorText && (
                  <p className="text-xs italic text-slate-500 dark:text-zinc-400 mb-3 leading-relaxed">
                    «{flavorText}»
                  </p>
                )}

                {/* Nominee & Value Micro-Fact */}
                <div className="p-2.5 rounded-lg bg-white/70 dark:bg-black/20 border border-slate-200/80 dark:border-white/5 text-xs text-slate-700 dark:text-zinc-300 leading-snug mb-3">
                  <div className="font-semibold text-slate-900 dark:text-white mb-0.5">
                    {ach.description}
                  </div>
                </div>
              </div>

              {/* Steam Unlock Status Footer */}
              <div className="pt-2 border-t border-slate-200/70 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>✓</span>
                  <span>Разблокировано</span>
                </span>
                <span className="tabular-nums font-bold text-slate-700 dark:text-zinc-300">
                  {ach.value !== '—' ? ach.value : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default RewindAchievementsSection;
