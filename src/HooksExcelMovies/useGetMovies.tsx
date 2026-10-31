import { useGoogleLogin } from '@react-oauth/google';
import { useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { spreadsheetId } from '../../shared/googleSheets';
import { setExcelMovies } from '../store/excelMovies';
import { appendMovieToSheet, updateMovieInSheet, type MovieSheetEntry } from '../api/googleSheets';
import {
  normalizeMovieData,
  type MovieRatings,
  type MovieRating,
  type LoadedMovieData,
  type CloudflareSessionResponse,
  type GoogleSheetsResponse,
  type GoogleSheetsNotesResponse,
  type GoogleUserResponse,
} from '../utils/movieDataNormalizer';

export type { MovieRatings, MovieRating, LoadedMovieData };

const isServerAuthEnabled = typeof window !== 'undefined'
  && window.location.protocol === 'https:'
  && !['localhost', '127.0.0.1'].includes(window.location.hostname);

const loadGoogleSheets = async (accessToken: string): Promise<LoadedMovieData> => {
  const fetchRange = async (
    range: string,
    majorDimension: 'ROWS' | 'COLUMNS' = 'COLUMNS',
  ): Promise<GoogleSheetsResponse> => {
    const encodedRange = encodeURIComponent(range);
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?majorDimension=${majorDimension.toLowerCase()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) {
      throw new Error('Не удалось загрузить данные Google Sheets');
    }

    return response.json() as Promise<GoogleSheetsResponse>;
  };

  const fetchMovieComments = async (): Promise<string[]> => {
    const query = new URLSearchParams({
      includeGridData: 'true',
      ranges: 'Киноклуб!C5:C',
      fields: 'sheets(data(rowData(values(note))))',
    });
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?${query}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) {
      throw new Error('Не удалось загрузить комментарии Google Sheets');
    }

    const spreadsheet = await response.json() as GoogleSheetsNotesResponse;
    return spreadsheet.sheets?.[0]?.data?.[0]?.rowData?.map(
      (row) => row.values?.[0]?.note ?? '',
    ) ?? [];
  };

  const [moviesResponse, movieComments, ratingsResponse, participantsResponse] = await Promise.all([
    fetchRange('Киноклуб!C5:C'),
    fetchMovieComments(),
    fetchRange('Киноклуб!B5:F', 'ROWS'),
    fetchRange('Сводная киноклуба!B3:B50'),
  ]);

  return normalizeMovieData(
    moviesResponse.values?.[0] ?? [],
    movieComments,
    ratingsResponse.values ?? [],
    participantsResponse.values?.[0] ?? [],
  );
};

const loadCloudflareSession = async (): Promise<CloudflareSessionResponse | null> => {
  const response = await fetch('/api/session', { credentials: 'same-origin' });
  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Не удалось восстановить сессию Google');
  }

  return response.json() as Promise<CloudflareSessionResponse>;
};

const useGetMovies = () => {
  const dispatch = useDispatch();
  const [data, setData] = useState<string[]>([]);
  const [movieComments, setMovieComments] = useState<string[]>([]);
  const [usersRating, setUsersRating] = useState<MovieRatings[]>([]);
  const [participantNames, setParticipantNames] = useState<string[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(isServerAuthEnabled);
  const [userName, setUserName] = useState('');
  const [userPicture, setUserPicture] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [authError, setAuthError] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    const error = new URLSearchParams(window.location.search).get('auth_error');
    return error
      ? `Не удалось войти в Google (${error}). Проверьте настройки OAuth и попробуйте снова.`
      : '';
  });

  const applyNormalizedData = useCallback((loaded: LoadedMovieData) => {
    setData(loaded.movies);
    setMovieComments(loaded.movieComments);
    setUsersRating(loaded.usersRating);
    setParticipantNames(loaded.participantNames);
  }, []);

  const browserLogin = useGoogleLogin({
    scope: 'openid profile email https://www.googleapis.com/auth/spreadsheets',
    onSuccess: async ({ access_token }) => {
      setAccessToken(access_token);
      setIsAuthorized(true);
      setIsLoading(true);

      try {
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        if (userResponse.ok) {
          const user = await userResponse.json() as GoogleUserResponse;
          setUserName(user.name ?? user.email ?? 'Пользователь Google');
          setUserPicture(user.picture ?? '');
        }
      } catch (error) {
        console.error('Не удалось получить данные пользователя Google:', error);
      }

      try {
        const loaded = await loadGoogleSheets(access_token);
        applyNormalizedData(loaded);
      } catch (error) {
        console.error('Ошибка загрузки данных Google Sheets:', error);
      } finally {
        setIsLoading(false);
      }
    },
  });

  const login = () => {
    setAuthError('');
    if (isServerAuthEnabled) {
      window.location.assign('/api/auth/google');
      return;
    }

    browserLogin();
  };

  const logout = async () => {
    if (isServerAuthEnabled) {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    }

    setAccessToken('');
    setIsAuthorized(false);
    setUserName('');
    setUserPicture('');
    setData([]);
    setMovieComments([]);
    setUsersRating([]);
    setParticipantNames([]);
    dispatch(setExcelMovies([]));
  };

  useEffect(() => {
    if (!isServerAuthEnabled) {
      return;
    }

    let isActive = true;

    loadCloudflareSession()
      .then((session) => {
        if (!isActive || !session) {
          return;
        }

        const loaded = normalizeMovieData(
          session.movies,
          session.movieComments ?? [],
          session.ratings,
          session.participants,
        );
        setIsAuthorized(true);
        setUserName(session.userName);
        setUserPicture(session.userPicture);
        applyNormalizedData(loaded);
      })
      .catch((error) => {
        console.error('Не удалось восстановить сессию Google:', error);
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [applyNormalizedData]);

  const saveMovie = async (entry: MovieSheetEntry) => {
    if (isServerAuthEnabled) {
      const response = await fetch('/api/save-movie', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error(response.status === 401
          ? 'Сессия Google истекла. Войдите снова'
          : 'Не удалось сохранить запись в Google Sheets');
      }

      const session = await loadCloudflareSession();
      if (!session) {
        throw new Error('Сессия Google истекла. Войдите снова');
      }

      const loaded = normalizeMovieData(
        session.movies,
        session.movieComments ?? [],
        session.ratings,
        session.participants,
      );
      setUserName(session.userName);
      setUserPicture(session.userPicture);
      applyNormalizedData(loaded);
      return;
    }

    if (!accessToken) {
      throw new Error('Необходимо авторизоваться в Google');
    }

    await appendMovieToSheet(accessToken, entry);
    const loaded = await loadGoogleSheets(accessToken);
    applyNormalizedData(loaded);
  };

  const updateMovie = async (entry: MovieSheetEntry) => {
    if (isServerAuthEnabled) {
      const response = await fetch('/api/update-movie', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error(response.status === 401
          ? 'Сессия Google истекла. Войдите снова'
          : 'Не удалось обновить запись в Google Sheets');
      }

      const session = await loadCloudflareSession();
      if (!session) {
        throw new Error('Сессия Google истекла. Войдите снова');
      }

      const loaded = normalizeMovieData(
        session.movies,
        session.movieComments ?? [],
        session.ratings,
        session.participants,
      );
      setUserName(session.userName);
      setUserPicture(session.userPicture);
      applyNormalizedData(loaded);
      return;
    }

    if (!accessToken) {
      throw new Error('Необходимо авторизоваться в Google');
    }

    await updateMovieInSheet(accessToken, entry);
    const loaded = await loadGoogleSheets(accessToken);
    applyNormalizedData(loaded);
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
