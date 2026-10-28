import { useEffect, useState } from "react";
import { getPopularMoviesFromSource } from "../api/movieSource";
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
  // Synchronous initialization from localStorage for instantaneous first render (no fetch, no delay)
  const [data, setData] = useState<PopularMovieData[]>(() => {
    const cached = getCachedPopularPosters(page);
    return cached && cached.length > 0 ? compactToPopularMovieData(cached) : [];
  });

  useEffect(() => {
    // 1. If valid cached data exists in localStorage, do NOT fetch over network
    const cached = getCachedPopularPosters(page);
    if (cached && cached.length > 0) {
      return;
    }

    // 2. Fetch page (deduplicated across StrictMode remounts via inFlightRequests)
    let isSubscribed = true;

    fetchPopularPage(page)
      .then((movies) => {
        if (isSubscribed) {
          setData(movies);
        }
      })
      .catch((err) => {
        console.error(`[usePopularMovies] Failed to load popular movies for page ${page}:`, err);
      });

    return () => {
      isSubscribed = false;
    };
  }, [page]);

  // Listen for storage events (e.g. if cache was cleared in another tab or programmatically)
  useEffect(() => {
    const onCacheCleared = () => {
      fetchPopularPage(page)
        .then((movies) => setData(movies))
        .catch(() => {});
    };

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith('mm_bg_posters_p_')) {
        const cached = getCachedPopularPosters(page);
        if (cached && cached.length > 0) {
          setData(compactToPopularMovieData(cached));
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
  }, [page]);

  return data;
};

export default usePopularMovies;
