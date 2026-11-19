import React from 'react';

interface RewindHeaderControlsProps {
  availableYears: string[];
  selectedYear: string | 'all';
  onSelectYear: (year: string | 'all') => void;
  onBack: () => void;
}

export const RewindHeaderControls: React.FC<RewindHeaderControlsProps> = ({
  availableYears,
  selectedYear,
  onSelectYear,
  onBack,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
      {/* Back button */}
      <button
        onClick={onBack}
        type="button"
        className="inline-flex items-center gap-2 self-start rounded-xl bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white transition-all cursor-pointer border border-slate-300/80 dark:border-white/10 shadow-xs"
      >
        <span>← На главную</span>
      </button>

      {/* Year Selector Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-white/5 border border-slate-300/70 dark:border-white/10 overflow-x-auto no-scrollbar max-w-full">
        {availableYears.map((yr) => {
          const isSelected = selectedYear === yr;
          return (
            <button
              key={yr}
              type="button"
              onClick={() => onSelectYear(yr)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
              }`}
            >
              {yr}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onSelectYear('all')}
          className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap ${
            selectedYear === 'all'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
          }`}
        >
          Всё время
        </button>
      </div>
    </div>
  );
};

export default RewindHeaderControls;
