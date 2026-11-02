import { useGoogleLogin } from '@react-oauth/google';
import { useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setExcelMovies } from '../store/excelMovies';
import type { MovieSheetEntry } from '../api/googleSheets';
import {
  normalizeMovieData,
  type MovieRatings,
  type MovieRating,
  type LoadedMovieData,
} from '../utils/movieDataNormalizer';

export type { MovieRatings, MovieRating, LoadedMovieData };

const GAS_URL =
  import.meta.env.VITE_GAS_URL ||
  'https://script.google.com/macros/s/AKfycbw03ghdeItJPUEUAx53oZLFdoDfJ35R0HcLmOgN-7-KbRTHZnx8sosLq5wEXBabofmA/exec';
const LOCAL_STORAGE_USER_KEY = 'melkomemie_google_user';

type GasMoviesResponse = {
  movies?: string[];
  movieComments?: string[];
  ratings?: string[][];
  participants?: string[];
  error?: string;
};

const loadMoviesFromGas = async (gasUrl: string): Promise<LoadedMovieData> => {
  const url = `${gasUrl}${gasUrl.includes('?') ? '&' : '?'}action=movies`;
  const response = await fetch(url, { redirect: 'follow' });

  if (!response.ok) {
    throw new Error(`Google Apps Script error HTTP ${response.status}`);
  }

  const data = (await response.json()) as GasMoviesResponse;
  if (data.error) {
    throw new Error(data.error);
  }

  return normalizeMovieData(
    data.movies ?? [],
    data.movieComments ?? [],
    data.ratings ?? [],
    data.participants ?? [],
  );
};

const useGetMovies = () => {
  const dispatch = useDispatch();
  const [data, setData] = useState<string[]>([]);
  const [movieComments, setMovieComments] = useState<string[]>([]);
  const [usersRating, setUsersRating] = useState<MovieRatings[]>([]);
  const [participantNames, setParticipantNames] = useState<string[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userPicture, setUserPicture] = useState('');
  const [authError, setAuthError] = useState('');

  const applyNormalizedData = useCallback((loaded: LoadedMovieData) => {
    setData(loaded.movies);
    setMovieComments(loaded.movieComments);
    setUsersRating(loaded.usersRating);
    setParticipantNames(loaded.participantNames);
  }, []);

  // Restore authorized user session from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (stored) {
        const user = JSON.parse(stored) as { name?: string; picture?: string };
        if (user && (user.name || user.picture)) {
          setUserName(user.name || 'Пользователь');
          setUserPicture(user.picture || '');
          setIsAuthorized(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Load movies from Google Apps Script on mount
  const fetchAllMovies = useCallback(async () => {
    if (!GAS_URL) {
      console.warn('[useGetMovies] VITE_GAS_URL is not set. Please configure VITE_GAS_URL.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const loaded = await loadMoviesFromGas(GAS_URL);
      applyNormalizedData(loaded);
    } catch (error) {
      console.error('[useGetMovies] Failed to load data from GAS:', error);
    } finally {
      setIsLoading(false);
    }
  }, [applyNormalizedData]);

  useEffect(() => {
    void fetchAllMovies();
  }, [fetchAllMovies]);

  // Google Login via @react-oauth/google
  const browserLogin = useGoogleLogin({
    scope: 'openid profile email',
    onSuccess: async ({ access_token }) => {
      try {
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${access_token}` },
        });

        if (userResponse.ok) {
          const user = (await userResponse.json()) as { name?: string; email?: string; picture?: string };
          const resolvedName = user.name || user.email || 'Пользователь';
          const resolvedPic = user.picture || '';

          setUserName(resolvedName);
          setUserPicture(resolvedPic);
          setIsAuthorized(true);

          localStorage.setItem(
            LOCAL_STORAGE_USER_KEY,
            JSON.stringify({ name: resolvedName, picture: resolvedPic }),
          );
        }
      } catch (error) {
        console.error('[useGetMovies] Error fetching user profile:', error);
      }
    },
    onError: (error) => {
      console.error('[useGetMovies] Google Login failed:', error);
      setAuthError('Не удалось войти через Google');
    },
  });

  const login = () => {
    setAuthError('');
    browserLogin();
  };

  const logout = () => {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    setIsAuthorized(false);
    setUserName('');
    setUserPicture('');
  };

  // Save movie to Google Sheets through Google Apps Script
  const saveMovie = async (entry: MovieSheetEntry) => {
    if (!GAS_URL) {
      throw new Error('VITE_GAS_URL не настроен');
    }

    const response = await fetch(GAS_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'save-movie',
        entry,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ошибка сервера Google Apps Script HTTP ${response.status}`);
    }

    const result = (await response.json()) as { ok?: boolean; error?: string };
    if (result.error) {
      throw new Error(result.error);
    }

    await fetchAllMovies();
  };

  // Update movie in Google Sheets through Google Apps Script
  const updateMovie = async (entry: MovieSheetEntry) => {
    if (!GAS_URL) {
      throw new Error('VITE_GAS_URL не настроен');
    }

    const response = await fetch(GAS_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'update-movie',
        entry,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ошибка сервера Google Apps Script HTTP ${response.status}`);
    }

    const result = (await response.json()) as { ok?: boolean; error?: string };
    if (result.error) {
      throw new Error(result.error);
    }

    await fetchAllMovies();
  };

  useEffect(() => {
    dispatch(setExcelMovies(data));
  }, [data, dispatch]);

  return {
    data,
    movieComments,
    usersRating,
    participantNames,
    login,
    logout,
    isAuthorized,
    isLoading,
    userName,
    userPicture,
    authError,
    saveMovie,
    updateMovie,
  };
};

export default useGetMovies;
