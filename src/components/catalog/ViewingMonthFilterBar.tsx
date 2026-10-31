import { formatViewingMonth, type ViewingMonth } from '../../utils/dateFormat';
import type { ViewingFilterMode } from '../../hooks/useCatalogMovies';

interface ViewingMonthFilterBarProps {
  availableViewingMonths: ViewingMonth[];
  viewingFilterMode: ViewingFilterMode;
  onSetViewingFilterMode: (mode: ViewingFilterMode) => void;
  activeViewingMonthKey: string;
  onSelectViewingMonth: (key: string) => void;
  activeRangeStart: string;
  onSetViewingRangeStart: (key: string) => void;
  activeRangeEnd: string;
  onSetViewingRangeEnd: (key: string) => void;
  rangeStartMonth?: ViewingMonth;
  rangeEndMonth?: ViewingMonth;
}

export const ViewingMonthFilterBar = ({
  availableViewingMonths,
  viewingFilterMode,
  onSetViewingFilterMode,
  activeViewingMonthKey,
  onSelectViewingMonth,
  activeRangeStart,
  onSetViewingRangeStart,
  activeRangeEnd,
  onSetViewingRangeEnd,
  rangeStartMonth,
  rangeEndMonth,
}: ViewingMonthFilterBarProps) => {
  return (
    <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-[#141724] border border-slate-200 dark:border-amber-500/20 shadow-sm flex flex-wrap items-center justify-between gap-4 animate-fade-in transition-colors">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          Период:
        </span>
        <div className="flex gap-1 bg-slate-100 dark:bg-[#0d0f17] p-1 rounded-xl border border-slate-200 dark:border-white/10">
          <button
            onClick={() => onSetViewingFilterMode('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewingFilterMode === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Все месяцы
          </button>
          <button
            disabled={availableViewingMonths.length === 0}
            onClick={() => onSetViewingFilterMode('month')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewingFilterMode === 'month'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-40'
            }`}
          >
            Один месяц
          </button>
          <button
            disabled={availableViewingMonths.length === 0}
            onClick={() => onSetViewingFilterMode('range')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewingFilterMode === 'range'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-40'
            }`}
          >
            Диапазон
          </button>
        </div>
      </div>

      {/* Dropdowns */}
      {viewingFilterMode === 'month' && (
        <div className="flex items-center gap-2">
          <label htmlFor="viewing-month-select" className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
            Выбрать месяц:
          </label>
          <select
            id="viewing-month-select"
            value={activeViewingMonthKey}
            onChange={(event) => onSelectViewingMonth(event.target.value)}
            className="rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0d0f17] px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-amber-400 shadow-sm"
          >
            {availableViewingMonths.map((m) => (
              <option key={m.key} value={m.key}>
                {formatViewingMonth(m, 'nominative')}
              </option>
            ))}
          </select>
        </div>
      )}

      {viewingFilterMode === 'range' && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium">С:</span>
            <select
              value={activeRangeStart}
              onChange={(e) => {
                const nextStart = e.target.value;
                onSetViewingRangeStart(nextStart);
                if (nextStart > activeRangeEnd) onSetViewingRangeEnd(nextStart);
              }}
              className="rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0d0f17] px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-amber-400 shadow-sm"
            >
              {availableViewingMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {formatViewingMonth(m, 'nominative')}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium">По:</span>
            <select
              value={activeRangeEnd}
              onChange={(e) => {
                const nextEnd = e.target.value;
                onSetViewingRangeEnd(nextEnd);
                if (nextEnd < activeRangeStart) onSetViewingRangeStart(nextEnd);
              }}
              className="rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0d0f17] px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-amber-400 shadow-sm"
            >
              {availableViewingMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {formatViewingMonth(m, 'nominative')}
                </option>
              ))}
            </select>
          </div>
          {rangeStartMonth && rangeEndMonth && (
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/15 dark:bg-amber-500/10 px-2.5 py-1 rounded-lg">
              {formatViewingMonth(rangeStartMonth, 'nominative')} — {formatViewingMonth(rangeEndMonth, 'nominative')}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ViewingMonthFilterBar;
