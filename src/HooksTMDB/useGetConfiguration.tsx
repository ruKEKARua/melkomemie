import { useEffect, useState } from 'react';
import { detectMovieSource } from '../api/movieSource';
import { fetchTmdb } from '../api/tmdb';

type ConfigAPI = {
  change_keys: string[];
  images: ImagesConfig;
};

type ImagesConfig = {
  base_url: string;
  secure_base_url: string;
  backdrop_sizes: string[];
  logo_sizes: string[];
  poster_sizes: string[];
  profile_sizes: string[];
  still_sizes: string[];
};

const DEFAULT_FALLBACK_CONFIG: ConfigAPI = {
  change_keys: [],
  images: {
    base_url: 'https://image.tmdb.org/t/p/',
    secure_base_url: 'https://image.tmdb.org/t/p/',
    backdrop_sizes: ['w300', 'w780', 'w1280', 'original'],
    logo_sizes: ['w45', 'w92', 'w154', 'w185', 'w300', 'w500', 'original'],
    poster_sizes: ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'],
    profile_sizes: ['w45', 'w185', 'h632', 'original'],
    still_sizes: ['w92', 'w185', 'w300', 'original'],
  },
};

const useGetConfiguration = (enabled = true) => {
  const [data, setData] = useState<ConfigAPI | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let isMounted = true;

    detectMovieSource()
      .then((source) => {
        if (source === 'kinopoisk') {
          return DEFAULT_FALLBACK_CONFIG;
        }
        return fetchTmdb<ConfigAPI>('/configuration').catch((err) => {
          console.warn('[useGetConfiguration] Failed to fetch TMDB config, using fallback:', err);
          return DEFAULT_FALLBACK_CONFIG;
        });
      })
      .then((res) => {
        if (isMounted) {
          setData(res);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(err);
          setData(DEFAULT_FALLBACK_CONFIG);
          setError(err instanceof Error ? err : new Error('Не удалось загрузить конфигурацию'));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [enabled]);

  return { data, error };
};

export default useGetConfiguration;
