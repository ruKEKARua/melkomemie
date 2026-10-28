import { useEffect, useState } from "react";
import { getActiveMovieSource, onSourceChange, getPopularMoviesFromSource, type MovieSource } from "../api/movieSource";
import {
  getCachedPopularPosters,
  setCachedPopularPosters,
  type CompactPosterItem,
} from "../api/posterCache";

export type PopularMovieData = {
  id: number;
  backdrop_path: string;
  original_title: string;
  title: string;
  overview: string;
  poster_path: string;
};

function compactToPopularMovieData(items: CompactPosterItem[]): PopularMovieData[] {
  return items.map((item) => ({
    id: item.id,
    poster_path: item.poster_path,
    backdrop_path: '',
    original_title: '',
    title: '',
    overview: '',
  }));
}

// Module-level in-flight request cache: deduplicates network calls across components and React StrictMode remounts
const inFlightRequests = new Map<number, Promise<PopularMovieData[]>>();

function fetchPopularPage(page: number): Promise<PopularMovieData[]> {
  const existing = inFlightRequests.get(page);
  if (existing) {
    return existing;
  }

  const promise = getPopularMoviesFromSource(page)
    .then((res) => {
      const validMovies = res.filter((movie) => Boolean(movie.poster_path));

      // Save compact minimal representation into localStorage (strips overviews/titles to respect string limits)
      setCachedPopularPosters(page, validMovies);

      return validMovies.map((movie) => ({
        id: movie.id,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path || '',
        original_title: movie.original_title || '',
        title: movie.title || '',
        overview: movie.overview || '',
      }));
    })
    .finally(() => {
      inFlightRequests.delete(page);
    });

  inFlightRequests.set(page, promise);
  return promise;
}

const usePopularMovies = (page: number) => {
  const [currentSource, setCurrentSource] = useState<MovieSource>(() => getActiveMovieSource());
  const [fetchedData, setFetchedData] = useState<PopularMovieData[]>([]);

  // Listen for database source changes
  useEffect(() => {
    return onSourceChange((newSource) => {
      setCurrentSource(newSource);
    });
  }, []);

  const cached = getCachedPopularPosters(page, currentSource);
  const data = cached && cached.length > 0 ? compactToPopularMovieData(cached) : fetchedData;

  useEffect(() => {
    // 1. If valid cached data exists for this source in localStorage, do NOT fetch over network
    if (cached && cached.length > 0) {
      return;
    }

    // 2. Fetch page (deduplicated across StrictMode remounts via inFlightRequests)
    let isSubscribed = true;

    fetchPopularPage(page)
      .then((movies) => {
        if (isSubscribed) {
          setFetchedData(movies);
        }
      })
      .catch((err) => {
        console.error(`[usePopularMovies] Failed to load popular movies for page ${page}:`, err);
      });

    return () => {
      isSubscribed = false;
    };
  }, [page, currentSource, cached]);

  // Listen for storage events (e.g. if cache was cleared in another tab or programmatically)
  useEffect(() => {
    const onCacheCleared = () => {
      fetchPopularPage(page)
        .then((movies) => setFetchedData(movies))
        .catch(() => {});
    };

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith('mm_bg_posters_')) {
        const latest = getCachedPopularPosters(page, currentSource);
        if (latest && latest.length > 0) {
          setFetchedData(compactToPopularMovieData(latest));
        } else {
          onCacheCleared();
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('mm_posters_cache_cleared', onCacheCleared);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('mm_posters_cache_cleared', onCacheCleared);
    };
  }, [page, currentSource]);

  return data;
};

export default usePopularMovies;
