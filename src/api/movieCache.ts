import { getActiveMovieSource, type MovieSource, type NormalizedMovie } from './movieSource';

const KEY_PREFIX = 'mm_film_';
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

type CacheRecord = {
  movie: NormalizedMovie;
  cachedAt: number;
};

export function normalizeCacheKey(title: string): string {
  return title
    .toLocaleLowerCase('ru-RU')
    .replace(/[«»"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSourceStorageKey(title: string, source: MovieSource): string {
  return `${KEY_PREFIX}${source}_${normalizeCacheKey(title)}`;
}

function getLegacyStorageKey(title: string): string {
  return `${KEY_PREFIX}${normalizeCacheKey(title)}`;
}

// Migrate any legacy mega-key and delete it to prevent quota issues
function migrateLegacyStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const raw = window.localStorage.getItem('melkomemie_movie_cache_v2');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          for (const [key, val] of Object.entries(parsed)) {
            const record = val as { movie?: NormalizedMovie };
            if (record?.movie && !record.movie.isExcelFallback) {
              setCachedMovie(key, record.movie);
            }
          }
        }
      } catch {
        // If JSON was cut off/truncated, extract valid movie blocks via regex
        const matches = raw.matchAll(/"([^"]+)":\s*\{"movie":(\{[^}]+\}),"cachedAt":(\d+)\}/g);
        for (const m of matches) {
          try {
            const key = m[1];
            const movie = JSON.parse(m[2]);
            if (movie && movie.id) {
              setCachedMovie(key, movie);
            }
          } catch {
            // Ignore corrupted fragment
          }
        }
      }
      window.localStorage.removeItem('melkomemie_movie_cache_v2');
    }
    window.localStorage.removeItem('melkomemie_movie_cache_v1');
  } catch (error) {
    console.warn('[movieCache] Failed to migrate legacy cache:', error);
  }
}

// Run migration once on import
if (typeof window !== 'undefined') {
  migrateLegacyStorage();
}

export function isValidMovieForSource(movie: NormalizedMovie, targetSource: MovieSource): boolean {
  if (!movie || movie.isExcelFallback || !movie.poster_path) {
    return false;
  }

  const poster = movie.poster_path.trim();
  if (!poster) return false;

  if (targetSource === 'kinopoisk') {
    // Kinopoisk poster MUST be a full http://, https://, or // URL
    return (
      (movie.source === 'kinopoisk' || poster.startsWith('http://') || poster.startsWith('https://') || poster.startsWith('//')) &&
      (poster.startsWith('http://') || poster.startsWith('https://') || poster.startsWith('//'))
    );
  }

  // TMDB poster MUST be a relative path like /abc.jpg
  return (movie.source === 'tmdb' || !poster.startsWith('http')) && !poster.startsWith('http');
}

export function getCachedMovie(title: string, preferredSource?: MovieSource): NormalizedMovie | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;

  const targetSource = preferredSource ?? getActiveMovieSource();
  const sourceKey = getSourceStorageKey(title, targetSource);

  // 1. Try source-specific storage key first (e.g. mm_film_kinopoisk_xxx)
  try {
    const raw = window.localStorage.getItem(sourceKey);
    if (raw) {
      const record = JSON.parse(raw) as CacheRecord;
      if (record?.movie && Date.now() - (record.cachedAt ?? 0) <= CACHE_TTL_MS) {
        if (isValidMovieForSource(record.movie, targetSource)) {
          return record.movie;
        } else {
          // Stale or incompatible record saved under this key - purge it
          window.localStorage.removeItem(sourceKey);
        }
      }
    }
  } catch (error) {
    console.warn(`[movieCache] Error reading ${sourceKey}:`, error);
  }

  // 2. Check legacy storage key (mm_film_xxx)
  const legacyKey = getLegacyStorageKey(title);
  try {
    const raw = window.localStorage.getItem(legacyKey);
    if (raw) {
      const record = JSON.parse(raw) as CacheRecord;
      if (record?.movie && Date.now() - (record.cachedAt ?? 0) <= CACHE_TTL_MS) {
        if (isValidMovieForSource(record.movie, targetSource)) {
          return record.movie;
        }
      }
    }
  } catch (error) {
    console.warn(`[movieCache] Error reading ${legacyKey}:`, error);
  }

  return null;
}

export function setCachedMovie(title: string, movie: NormalizedMovie): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (!title || movie.isExcelFallback || !movie.poster_path) {
    return;
  }

  const source = movie.source || getActiveMovieSource();
  if (!isValidMovieForSource(movie, source)) {
    return;
  }

  const sourceKey = getSourceStorageKey(title, source);
  const legacyKey = getLegacyStorageKey(title);

  try {
    const record: CacheRecord = {
      movie: {
        ...movie,
        source,
      },
      cachedAt: Date.now(),
    };
    const payload = JSON.stringify(record);
    window.localStorage.setItem(sourceKey, payload);
    window.localStorage.setItem(legacyKey, payload);
  } catch (error) {
    console.warn(`[movieCache] Failed to write cache for ${title}:`, error);
  }
}

export function getCachedMoviesBatch(titles: string[], source?: MovieSource): {
  cached: Map<string, NormalizedMovie>;
  missing: string[];
} {
  const targetSource = source ?? getActiveMovieSource();
  const cached = new Map<string, NormalizedMovie>();
  const missing: string[] = [];

  for (const title of titles) {
    const normKey = normalizeCacheKey(title);
    if (!normKey) continue;

    const movie = getCachedMovie(title, targetSource);
    if (movie) {
      cached.set(normKey, movie);
    } else {
      missing.push(title);
    }
  }

  return { cached, missing };
}

export function clearMovieCache(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn('[movieCache] Failed to clear cache:', error);
  }
}
