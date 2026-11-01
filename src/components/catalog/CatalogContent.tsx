import { MovieSlider, type Media } from '../MovieSlider';
import type { MovieRatings } from '../../HooksExcelMovies/useGetMovies';
import type { MovieSheetEntry } from '../../api/googleSheets';
import type { SortOrder, ViewingMonthSectionItem } from '../../hooks/useCatalogMovies';

interface CatalogContentProps {
  sortOrder: SortOrder;
  isCatalogLoading: boolean;
  viewingMonthSections: ViewingMonthSectionItem[];
  displayedMovies: Media[];
  usersRating: MovieRatings[];
  participantNames: string[];
  updateMovie?: (entry: MovieSheetEntry) => Promise<void>;
  highlightMovieTitle: string | null;
}

export const CatalogContent = ({
  sortOrder,
  isCatalogLoading,
  viewingMonthSections,
  displayedMovies,
  usersRating,
  participantNames,
  updateMovie,
  highlightMovieTitle,
}: CatalogContentProps) => {
  return (
    <div className="max-w-7xl 2xl:max-w-[1600px] min-[1920px]:max-w-[1800px] min-[2560px]:max-w-[2200px] mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16">
      {sortOrder === 'viewing-month' && !isCatalogLoading ? (
        <div
          className="flex flex-col gap-8 mt-2"
          role="region"
          aria-label="Фильмы по месяцам просмотра"
          tabIndex={0}
        >
          {viewingMonthSections.map((section) => (
            <section key={section.key} className="flex flex-col gap-3">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-white/10 transition-colors">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {section.title}
                </h3>
                <span className="rounded-full bg-amber-500/15 dark:bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  {section.movies.length}
                </span>
              </div>
              <MovieSlider
                media={section.movies}
                ratings={usersRating}
                participantNames={participantNames}
                onUpdateMovie={updateMovie}
                highlightMovieTitle={highlightMovieTitle}
              />
            </section>
          ))}
          {viewingMonthSections.length === 0 && (
            <div className="py-20 text-center text-slate-500 dark:text-zinc-400">
              <p className="text-lg font-semibold text-slate-900 dark:text-white">Нет фильмов за выбранный период</p>
              <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">Попробуйте выбрать другой месяц или переключить на «Все месяцы»</p>
            </div>
          )}
        </div>
      ) : (
        <MovieSlider
          media={displayedMovies}
          ratings={usersRating}
          participantNames={participantNames}
          onUpdateMovie={updateMovie}
          isLoading={isCatalogLoading}
          highlightMovieTitle={highlightMovieTitle}
        />
      )}
    </div>
  );
};

export default CatalogContent;
