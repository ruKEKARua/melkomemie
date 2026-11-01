import { useState, useEffect, useRef, useCallback } from 'react';
import { getPopularMoviesFromSource, type NormalizedMovie } from '../api/movieSource';
import { searchMoviesWithTmdbFallback } from '../api/searchMoviesWithTmdbFallback';

const FALLBACK_TITLES = ['Дурак', 'Операция «С Новым годом»', 'Территория', 'Вызов', 'Лето'];

export function useMovieEntrySearch() {
  const [results, setResults] = useState<NormalizedMovie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<NormalizedMovie | null>(null);
  const [placeholder, setPlaceholder] = useState('Например: Дурак');
  const requestIdRef = useRef(0);
  const searchTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const randomPage = Math.floor(Math.random() * 5) + 1;

    getPopularMoviesFromSource(randomPage)
      .then((items) => {
        const slice = items.slice(0, 5);
        if (slice.length === 0) return;

        const randomIndex = Math.floor(Math.random() * slice.length);
        const sample = slice[randomIndex];
        const title = sample.title || sample.original_title || 'Дурак';

        setPlaceholder(`Например: ${title}`);
      })
      .catch(() => {
        setPlaceholder(
          `Например: ${FALLBACK_TITLES[Math.floor(Math.random() * FALLBACK_TITLES.length)]}`
        );
      });

    return () => {
      if (searchTimeoutRef.current !== undefined) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const searchMovies = useCallback((value: string) => {
    const trimmedValue = value.trim();
    const currentRequestId = ++requestIdRef.current;

    if (!trimmedValue) {
      if (searchTimeoutRef.current !== undefined) {
        window.clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = undefined;
      }
      setResults([]);
      setSelectedMovie(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    if (searchTimeoutRef.current !== undefined) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      searchMoviesWithTmdbFallback(trimmedValue)
        .then((movies) => {
          if (currentRequestId !== requestIdRef.current) return;
          setResults(movies);
          setSelectedMovie((current) => current ?? movies[0] ?? null);
        })
        .catch((error) => {
          console.error('Ошибка поиска фильма:', error);
          if (currentRequestId === requestIdRef.current) {
            setResults([]);
            setSelectedMovie(null);
          }
        })
        .finally(() => {
          if (currentRequestId === requestIdRef.current) setIsSearching(false);
          searchTimeoutRef.current = undefined;
        });
    }, 450);
  }, []);

  const clearSearch = useCallback(() => {
    if (searchTimeoutRef.current !== undefined) {
      window.clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = undefined;
    }
    setResults([]);
    setSelectedMovie(null);
    setIsSearching(false);
  }, []);

  return {
    results,
    setResults,
    isSearching,
    selectedMovie,
    setSelectedMovie,
    placeholder,
    searchMovies,
    clearSearch,
  };
}
