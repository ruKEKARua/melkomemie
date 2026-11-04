import type { MovieSource } from '../../api/movieSource';
import type { SortOrder, ViewingFilterMode } from '../../hooks/useCatalogMovies';
import type { ViewingMonth } from '../../utils/dateFormat';
import ViewingMonthFilterBar from './ViewingMonthFilterBar';

interface CatalogToolbarProps {
  searchBarValue: string;
  sortOrder: SortOrder;
  onSetSortOrder: (order: SortOrder) => void;
  displayedMoviesCount: number;
  movieDatabaseSource: MovieSource;
  areMoviesLoaded: boolean;
  loadedCount: number;
  totalCount: number;
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

export const CatalogToolbar = ({
  searchBarValue,
  sortOrder,
  onSetSortOrder,
  displayedMoviesCount,
  movieDatabaseSource,
  areMoviesLoaded,
  loadedCount,
  totalCount,
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
}: CatalogToolbarProps) => {
  return (
    <div className="max-w-7xl 2xl:max-w-[1600px] min-[1920px]:max-w-[1800px] min-[2560px]:max-w-[2200px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-2">
      <div className="flex flex-col gap-3">
        {/* Row 1: Section Header & Count (Left) + Source Status (Right, Kinopoisk only) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {searchBarValue.trim()
                ? 'Результаты поиска'
                : sortOrder === 'viewing-month'
                ? 'Архив просмотров по месяцам'
                : 'Каталог фильмов'}
            </h2>
            <span className="rounded-full bg-slate-200/80 dark:bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-zinc-400">
              {displayedMoviesCount}
            </span>
          </div>

          {/* Warning for Kinopoisk only; completely omitted for TMDB */}
          {movieDatabaseSource === 'kinopoisk' && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-xl border border-amber-500/50 dark:border-amber-500/60 bg-amber-500/10 dark:bg-[#16120b] px-3.5 py-1.5 text-xs text-amber-800 dark:text-amber-300 shadow-sm"
            >
              <span className="text-sm shrink-0" aria-hidden="true">⚠️</span>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5">
                <span className="font-bold text-amber-900 dark:text-amber-200">Источник: Кинопоиск.</span>
                <span className="text-amber-800/90 dark:text-amber-300/85">
                  {!areMoviesLoaded && totalCount > 0
                    ? `Загрузка фильмов может занять некоторое время (${loadedCount} из ${totalCount})...`
                    : 'Загрузка с Кинопоиска медленнее из-за лимитов сервиса. Фильмы кэшируются.'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Row 2: Sort Label & Buttons */}
        <div className="flex flex-col gap-2 mt-1">
          <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">
            Сортировка:
          </span>
          <div className="flex flex-wrap gap-1 bg-slate-200/70 dark:bg-[#131520] p-1 rounded-xl border border-slate-300/60 dark:border-white/10 shadow-inner w-fit">
            <button
              onClick={() => onSetSortOrder('added')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                sortOrder === 'added'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              По добавлению
            </button>
            <button
              onClick={() => onSetSortOrder('reverse')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                sortOrder === 'reverse'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              С конца
            </button>
            <button
              onClick={() => onSetSortOrder('top-rated')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                sortOrder === 'top-rated'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ★ Топ рейтинга
            </button>
            <button
              onClick={() => onSetSortOrder('low-rated')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                sortOrder === 'low-rated'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Сначала худшие
            </button>
            <button
              onClick={() => {
                if (sortOrder === 'alphabetical') {
                  onSetSortOrder('alphabetical-reverse');
                } else {
                  onSetSortOrder('alphabetical');
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                sortOrder === 'alphabetical' || sortOrder === 'alphabetical-reverse'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={
                sortOrder === 'alphabetical'
                  ? 'Сортировка А-Я активна. Нажмите для Я-А'
                  : sortOrder === 'alphabetical-reverse'
                  ? 'Сортировка Я-А активна. Нажмите для А-Я'
                  : 'Сортировка по алфавиту (А-Я)'
              }
            >
              <span>{sortOrder === 'alphabetical-reverse' ? 'Я-А' : 'А-Я'}</span>
              {sortOrder === 'alphabetical' ? (
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              ) : sortOrder === 'alphabetical-reverse' ? (
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg
                  className="w-3.5 h-3.5 shrink-0 opacity-80"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              )}
            </button>
            
            <button
              onClick={() => onSetSortOrder('viewing-month')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                sortOrder === 'viewing-month'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              По месяцам
            </button>
          </div>
        </div>
      </div>

      {/* Month Filtering Sub-toolbar */}
      {sortOrder === 'viewing-month' && (
        <ViewingMonthFilterBar
          availableViewingMonths={availableViewingMonths}
          viewingFilterMode={viewingFilterMode}
          onSetViewingFilterMode={onSetViewingFilterMode}
          activeViewingMonthKey={activeViewingMonthKey}
          onSelectViewingMonth={onSelectViewingMonth}
          activeRangeStart={activeRangeStart}
          onSetViewingRangeStart={onSetViewingRangeStart}
          activeRangeEnd={activeRangeEnd}
          onSetViewingRangeEnd={onSetViewingRangeEnd}
          rangeStartMonth={rangeStartMonth}
          rangeEndMonth={rangeEndMonth}
        />
      )}
    </div>
  );
};

export default CatalogToolbar;
