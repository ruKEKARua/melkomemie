import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { getCachedMoviesBatch, normalizeCacheKey } from '../api/movieCache';
import { getActiveMovieSource, type MovieSource, type NormalizedMovie } from '../api/movieSource';
import { setFoundMovies } from '../store/foundMovies';
import findMovieBySearchTitle from './useGetMovieBySearchName';

export type UseSearchedMoviesResult = {
  isLoaded: boolean;
  loadedCount: number;
  totalCount: number;
};

/**
 * Calculates responsive batch size matching MovieSlider's Tailwind grid columns:
 * grid-cols-2 (default, mobile)
 * sm:grid-cols-3 (>= 640px)
 * md:grid-cols-3 (>= 768px)
 * lg:grid-cols-4 (>= 1024px)
 * xl:grid-cols-5 (>= 1280px)
 * 2xl:grid-cols-6 (>= 1536px)
 */
export const getResponsiveBatchSize = (): number => {
  if (typeof window === 'undefined') return 6;
  const width = window.innerWidth;
  if (width >= 1536) return 6; // 2xl
  if (width >= 1280) return 5; // xl
  if (width >= 1024) return 4; // lg
  if (width >= 640) return 3;  // sm / md
  return 2;                    // mobile
};

const useSetArrayOfSearchedMovies = (titles: string[], source?: MovieSource): UseSearchedMoviesResult => {
  const dispatch = useDispatch();
  const [isLoaded, setIsLoaded] = useState(titles.length === 0);
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadMovies() {
      if (titles.length === 0) {
        dispatch(setFoundMovies([]));
        setLoadedCount(0);
        setIsLoaded(true);
        return;
      }

      setIsLoaded(false);

      // 1. Instant cache lookup across all individual movie keys for current source
      const currentSource = source ?? getActiveMovieSource();
      const { cached, missing } = getCachedMoviesBatch(titles, currentSource);
      setLoadedCount(cached.size);

      // Build initial list so cards can be displayed immediately
      const movies: NormalizedMovie[] = titles.map((title, index) => {
        const cachedMovie = cached.get(normalizeCacheKey(title));
        if (cachedMovie) {
          return {
            ...cachedMovie,
            excelTitle: title,
          };
        }

        return {
          id: -(index + 1),
          media_type: 'movie',
          title,
          original_title: title,
          overview: '',
          poster_path: '',
          backdrop_path: '',
          source: currentSource,
          excelTitle: title,
          isExcelFallback: true,
        };
      });

      // Dispatch immediately so the user doesn't wait on a blank screen
      dispatch(setFoundMovies([...movies]));

      // If everything was already in cache, complete in 0ms!
      if (missing.length === 0) {
        setLoadedCount(titles.length);
        setIsLoaded(true);
        return;
      }

      // If a large majority is already cached, catalog is readily browsable
      if (cached.size >= titles.length) {
        setIsLoaded(true);
      }

      // 2. Load missing movies in sequence (Kinopoisk queue respects 250ms spacing)
      let currentLoaded = cached.size;
      let updateCounter = 0;

      for (let i = 0; i < titles.length; i++) {
        if (cancelled) break;

        const title = titles[i];
        if (!missing.includes(title)) {
          continue;
        }

        try {
          const resolved = await findMovieBySearchTitle(title, currentSource);
          if (cancelled) break;

          if (resolved) {
            movies[i] = {
              ...resolved,
              excelTitle: title,
              poster_path: resolved.poster_path ?? '',
              backdrop_path: resolved.backdrop_path ?? '',
            };
            currentLoaded++;
            setLoadedCount(currentLoaded);
          }
        } catch (error) {
          console.error(`[useSetArrayOfSearchedMovies] Error loading "${title}":`, error);
        }

        if (cancelled) break;

        updateCounter++;
        const batchSize = getResponsiveBatchSize();
        // Progressive update: update Redux state row-by-row matching grid column count or on final
        if (updateCounter % batchSize === 0 || i === titles.length - 1) {
          dispatch(setFoundMovies([...movies]));
        }
      }

      if (!cancelled) {
        dispatch(setFoundMovies([...movies]));
        setLoadedCount(titles.length);
        setIsLoaded(true);
      }
    }

    loadMovies();

    return () => {
      cancelled = true;
    };
  }, [titles, source, dispatch]);

  return {
    isLoaded,
    loadedCount,
    totalCount: titles.length,
  };
};

export default useSetArrayOfSearchedMovies;
