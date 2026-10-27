import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { openModal } from '../store/openModal';
import Modal from './Modal';
import type { RootState } from '../store/store';
import MovieCard from './MovieCard';
import type { MovieRatings } from '../HooksExcelMovies/useGetMovies';
import type { MovieSheetEntry } from '../api/googleSheets';
import { getMovieImageUrl, getTmdbImageUrl } from '../api/tmdbImage';
import type { MovieSource } from '../api/movieSource';

type Movie = {
  media_type: 'movie' | 'tv';
  id: number;
  backdrop_path: string;
  original_title: string;
  title: string;
  overview: string;
  poster_path: string | null;
  excelTitle?: string;
  isExcelFallback?: boolean;
};

type Person = {
  media_type: 'person';
  id: number;
  gender: number;
  name: string;
  original_name: string;
  known_for: Array<{ id: number }>;
  profile_path: string | null;
  known_for_department: string;
};

type Media = Movie | Person;

type MovieSliderProps = {
  media: Media[];
  ratings: MovieRatings[];
  participantNames?: string[];
  onUpdateMovie?: (entry: MovieSheetEntry) => Promise<void>;
  isLoading?: boolean;
  highlightMovieTitle?: string | null;
};

export function MovieSlider({
  media,
  ratings,
  participantNames = [],
  onUpdateMovie,
  isLoading = false,
  highlightMovieTitle,
}: MovieSliderProps) {
  const dispatch = useDispatch();
  const sliderRef = useRef<HTMLDivElement>(null);
  const isModalOpen = useSelector((state: RootState) => state.openModal.value);

  const [movie_ID, setMovie_ID] = useState<number | null>(null);
  const [excelMovieTitle, setExcelMovieTitle] = useState<string | undefined>();
  const [movieSource, setMovieSource] = useState<MovieSource>('tmdb');
  const [fallbackMovieTitle, setFallbackMovieTitle] = useState<string | undefined>();

  const posterSize = 'w780';

  const openDescription = (
    movieID: number,
    sourceTitle?: string,
    source: MovieSource = 'tmdb',
    fallbackTitle?: string,
  ) => {
    setMovie_ID(movieID);
    setExcelMovieTitle(sourceTitle);
    setMovieSource(source);
    setFallbackMovieTitle(fallbackTitle);
    dispatch(openModal());
  };

  useEffect(() => {
    if (!highlightMovieTitle || isLoading) {
      return;
    }

    const targetSlide = Array.from(
      sliderRef.current?.querySelectorAll<HTMLElement>('.movie-slide[data-excel-title]') ?? [],
    ).find((slide) => slide.dataset.excelTitle === highlightMovieTitle);

    targetSlide?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightMovieTitle, isLoading, media]);

  // Loading Skeleton State (Netflix-style shimmering cards)
  if (isLoading) {
    return (
      <div className="w-full py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5 md:gap-6 items-stretch">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="flex flex-col h-full rounded-2xl bg-[#131620] p-2 sm:p-2.5 border border-white/5">
              <div className="w-full aspect-[2/3] shrink-0 rounded-xl animate-shimmer" />
              <div className="mt-2.5 w-full h-10 sm:h-11 shrink-0 flex flex-col justify-center gap-1.5 px-1">
                <div className="h-3.5 w-3/4 mx-auto rounded animate-shimmer" />
                <div className="h-3 w-1/2 mx-auto rounded animate-shimmer opacity-60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty State
  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 border border-white/10 text-amber-500 mb-4 shadow-xl">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Фильмы не найдены</h3>
        <p className="text-sm text-zinc-400 max-w-md">
          По вашему запросу ничего не нашлось. Попробуйте изменить поисковую фразу или проверьте фильтр «Вся база».
        </p>
      </div>
    );
  }

  return (
    <div ref={sliderRef} className="movie-slider-frame relative w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5 md:gap-6 items-stretch">
        {media.map((item, key) => {
          if (item.media_type !== 'person') {
            const movieVariables: Movie = {
              media_type: item.media_type,
              poster_path: getMovieImageUrl(item.poster_path, posterSize),
              title: item.title,
              original_title: item.original_title,
              overview: item.overview,
              id: item.id,
              backdrop_path: item.backdrop_path,
            };

            const title = movieVariables.title || movieVariables.original_title;
            const id = movieVariables.id;
            const posterPath = movieVariables.poster_path ?? '';
            const overallRating = item.excelTitle
              ? ratings.find(
                  (movie) => movie.movie.trim().toLowerCase() === item.excelTitle?.trim().toLowerCase(),
                )?.ratings[0]?.scores[1]
              : undefined;

            return (
              <div
                key={key}
                className={`movie-slide h-full flex flex-col transition-all ${
                  item.excelTitle === highlightMovieTitle ? 'movie-slide-highlight' : ''
                }`}
                data-excel-title={item.excelTitle}
              >
                <MovieCard
                  id={id}
                  title={title}
                  posterPath={posterPath}
                  overallRating={overallRating}
                  func={(movieID) =>
                    openDescription(
                      movieID,
                      item.excelTitle,
                      'source' in item && (item.source === 'tmdb' || item.source === 'kinopoisk')
                        ? item.source
                        : 'tmdb',
                      item.isExcelFallback ? title : undefined,
                    )
                  }
                />
              </div>
            );
          }

          // Person Card
          const russianName = item.name;
          const originalName = item.original_name;
          const image = getTmdbImageUrl(posterSize, item.profile_path);
          const movieId = item.known_for[0]?.id;
          const placeholderImage = `https://placehold.co/780x1170?text=${encodeURIComponent(russianName || 'Person')}`;

          return (
            <div key={key} className="movie-slide h-full flex flex-col">
              <div
                role={movieId !== undefined ? 'button' : undefined}
                tabIndex={movieId !== undefined ? 0 : undefined}
                onClick={() => movieId !== undefined && openDescription(movieId)}
                className="group movie-card relative flex flex-col h-full w-full cursor-pointer select-none rounded-2xl bg-[#131620] p-2 sm:p-2.5 border border-white/10 hover:border-amber-500/50 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.03] hover:shadow-[0_18px_36px_rgba(0,0,0,0.85),0_0_24px_rgba(245,158,11,0.22)] focus-visible:outline-2 focus-visible:outline-amber-400 hover:z-30"
              >
                <div className="relative w-full aspect-[2/3] shrink-0 overflow-hidden rounded-xl bg-[#1a1e2b]">
                  <img
                    src={image || placeholderImage}
                    alt={russianName || originalName}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-108"
                  />
                  <div className="absolute top-2.5 left-2.5 rounded bg-black/70 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-white/10 backdrop-blur-sm">
                    Персона
                  </div>
                </div>
                <div className="mt-2.5 px-1 w-full h-10 sm:h-11 shrink-0 text-center flex flex-col items-center justify-center">
                  <h3 className="text-xs sm:text-sm font-semibold text-zinc-100 line-clamp-1 text-center">
                    {russianName || originalName}
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5 text-center line-clamp-1">
                    {item.known_for_department || 'Деятель кино'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Movie Details Modal */}
      {isModalOpen && movie_ID !== null && (
        <Modal
          key={movie_ID}
          isHidden=""
          movie_ID={movie_ID}
          source={movieSource}
          ratings={ratings}
          excelMovieTitle={excelMovieTitle}
          fallbackTitle={fallbackMovieTitle}
          participantNames={participantNames}
          onUpdateMovie={onUpdateMovie}
        />
      )}
    </div>
  );
}

export default MovieSlider;
