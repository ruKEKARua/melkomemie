import {
  fetchKinopoiskFilm,
  fetchKinopoiskPopular,
  fetchKinopoiskSearch,
  type KinopoiskFilm,
} from './kinopoisk';
import { checkTmdbHealth, fetchTmdb } from './tmdb';

export type MovieSource = 'tmdb' | 'kinopoisk';

export type NormalizedMovie = {
  id: number;
  media_type: 'movie';
  title: string;
  original_title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  source: MovieSource;
  excelTitle?: string;
  isExcelFallback?: boolean;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  genres?: { id: number; name: string }[];
};

export type MovieDetails = NormalizedMovie & {
  release_date: string;
  vote_average: number;
  vote_count: number;
  genres: { id: number; name: string }[];
};

export type MovieImage = { file_path: string };

const SESSION_SOURCE_KEY = 'melkomemie_active_source';

// Read initial source from session cache if available
function getInitialSource(): MovieSource {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const saved = window.sessionStorage.getItem(SESSION_SOURCE_KEY);
    if (saved === 'tmdb' || saved === 'kinopoisk') {
      return saved;
    }
  }
  return 'tmdb';
}

let activeSource: MovieSource = getInitialSource();
let detectionPromise: Promise<MovieSource> | null = null;
const sourceChangeListeners = new Set<(source: MovieSource) => void>();

function notifySourceChange(source: MovieSource) {
  for (const listener of sourceChangeListeners) {
    try {
      listener(source);
    } catch (e) {
      console.error('[MovieSource] Error in source change listener:', e);
    }
  }
}

export function getActiveMovieSource(): MovieSource {
  return activeSource;
}

export function setActiveMovieSource(source: MovieSource): void {
  if (activeSource !== source) {
    activeSource = source;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(SESSION_SOURCE_KEY, source);
    }
    console.info(`[MovieSource] Active database set to: ${source.toUpperCase()}`);
    notifySourceChange(source);
  }
}

function switchToFallback(reason?: unknown): void {
  console.warn('[MovieSource] TMDB is unavailable. Automatically switching database to Kinopoisk:', reason);
  setActiveMovieSource('kinopoisk');
}

export function onSourceChange(listener: (source: MovieSource) => void): () => void {
  sourceChangeListeners.add(listener);
  return () => {
    sourceChangeListeners.delete(listener);
  };
}

/**
 * Checks TMDB availability and selects the active database.
 * If TMDB is blocked (e.g. in Russia), smoothly switches to Kinopoisk.
 */
export async function detectMovieSource(forceRecheck = false): Promise<MovieSource> {
  // If already checked in this session and Kinopoisk was active, preserve it unless forced
  if (!forceRecheck && activeSource === 'kinopoisk') {
    return 'kinopoisk';
  }

  if (detectionPromise && !forceRecheck) {
    return detectionPromise;
  }

  detectionPromise = (async () => {
    const isTmdbHealthy = await checkTmdbHealth(2500);
    const source: MovieSource = isTmdbHealthy ? 'tmdb' : 'kinopoisk';
    setActiveMovieSource(source);
    return source;
  })();

  return detectionPromise;
}

export function normalizeKinopoiskFilm(film: KinopoiskFilm): NormalizedMovie {
  const filmId = film.filmId || film.kinopoiskId || 0;
  const rawYear = film.year ? String(film.year) : '';
  const yearMatch = rawYear.match(/\d{4}/)?.[0] ?? '';

  const rawRating = film.ratingKinopoisk ?? film.rating;
  const ratingNum = typeof rawRating === 'number' ? rawRating : parseFloat(String(rawRating ?? '0'));
  const voteAverage = Number.isFinite(ratingNum) ? ratingNum : 0;

  const voteCount = film.ratingKinopoiskVoteCount ?? film.ratingVoteCount ?? 0;
  const poster = film.posterUrl ?? film.posterUrlPreview ?? '';
  const backdrop = film.coverUrl ?? film.posterUrl ?? film.posterUrlPreview ?? '';
  const overview = film.description ?? film.shortDescription ?? '';

  const genres =
    film.genres
      ?.map((g, index) => ({ id: index, name: g.genre ?? '' }))
      .filter((g) => Boolean(g.name)) ?? [];

  return {
    id: filmId,
    media_type: 'movie',
    title: film.nameRu || film.nameEn || film.nameOriginal || '',
    original_title: film.nameEn || film.nameOriginal || film.nameRu || '',
    overview,
    poster_path: poster,
    backdrop_path: backdrop,
    source: 'kinopoisk',
    release_date: yearMatch ? `${yearMatch}-01-01` : '',
    vote_average: voteAverage,
    vote_count: voteCount,
    genres,
  };
}

function normalizeTmdbMovie(movie: Omit<NormalizedMovie, 'source'>): NormalizedMovie {
  return { ...movie, source: 'tmdb' };
}

async function searchTmdbMovies(query: string): Promise<NormalizedMovie[]> {
  const response = await fetchTmdb<{ results: Omit<NormalizedMovie, 'source'>[] }>(
    `/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=ru-RU&page=1`,
  );
  return response.results.map(normalizeTmdbMovie);
}

async function searchKinopoiskMovies(query: string): Promise<NormalizedMovie[]> {
  const films = await fetchKinopoiskSearch(query);
  return films.map(normalizeKinopoiskFilm);
}

/**
 * Searches movies using the currently active source.
 * If TMDB is active and fails, automatically falls back to Kinopoisk and updates active source.
 */
export async function searchMoviesFromSource(query: string): Promise<NormalizedMovie[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return [];
  }

  if (activeSource === 'tmdb') {
    try {
      return await searchTmdbMovies(cleanQuery);
    } catch (error) {
      switchToFallback(error);
      return await searchKinopoiskMovies(cleanQuery);
    }
  }

  return await searchKinopoiskMovies(cleanQuery);
}

/**
 * Fetches popular movies using the active source with automatic fallback.
 */
export async function getPopularMoviesFromSource(page: number): Promise<NormalizedMovie[]> {
  if (activeSource === 'tmdb') {
    try {
      const response = await fetchTmdb<{ results: Omit<NormalizedMovie, 'source'>[] }>(
        `/movie/popular?language=ru-RU&page=${page}`,
      );
      return response.results.map(normalizeTmdbMovie);
    } catch (error) {
      switchToFallback(error);
    }
  }

  const films = await fetchKinopoiskPopular(page);
  return films.map(normalizeKinopoiskFilm);
}

/**
 * Fetches movie details by ID and source.
 */
export async function getMovieDetailsFromSource(
  movieId: number,
  source?: MovieSource,
): Promise<MovieDetails> {
  const targetSource = source ?? activeSource;

  if (targetSource === 'tmdb') {
    try {
      const tmdbData = await fetchTmdb<MovieDetails>(`/movie/${movieId}?language=ru-RU`);
      return { ...tmdbData, source: 'tmdb' };
    } catch (error) {
      if (!source) {
        // Source wasn't explicitly pinned, so try fallback
        switchToFallback(error);
      } else {
        throw error;
      }
    }
  }

  const film = await fetchKinopoiskFilm(movieId);
  return normalizeKinopoiskFilm(film) as MovieDetails;
}

/**
 * Fetches movie images (posters, backdrops).
 */
export async function getMovieImagesFromSource(movieId: number, source?: MovieSource) {
  const targetSource = source ?? activeSource;

  if (targetSource === 'tmdb') {
    try {
      return await fetchTmdb<Record<'posters' | 'backdrops' | 'logos', MovieImage[]>>(
        `/movie/${movieId}/images`,
      );
    } catch (error) {
      if (!source) {
        switchToFallback(error);
      } else {
        throw error;
      }
    }
  }

  const details = await getMovieDetailsFromSource(movieId, 'kinopoisk');
  const posters: MovieImage[] = details.poster_path ? [{ file_path: details.poster_path }] : [];
  const backdrops: MovieImage[] = details.backdrop_path ? [{ file_path: details.backdrop_path }] : [];

  return { posters, backdrops, logos: [] };
}
