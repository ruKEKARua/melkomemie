import type { NormalizedMovie } from './movieSource';

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

function getStorageKey(title: string): string {
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

export function getCachedMovie(title: string): NormalizedMovie | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;

  const key = getStorageKey(title);
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const record = JSON.parse(raw) as CacheRecord;
    if (!record || !record.movie) return null;

    // Check TTL
    if (Date.now() - (record.cachedAt ?? 0) > CACHE_TTL_MS) {
      window.localStorage.removeItem(key);
      return null;
    }

    return record.movie;
  } catch (error) {
    console.warn(`[movieCache] Error reading ${key}:`, error);
    return null;
  }
}

export function setCachedMovie(title: string, movie: NormalizedMovie): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (!title || movie.isExcelFallback) {
    return;
  }

  const key = getStorageKey(title);
  try {
    const record: CacheRecord = {
      movie,
      cachedAt: Date.now(),
    };
    window.localStorage.setItem(key, JSON.stringify(record));
  } catch (error) {
    console.warn(`[movieCache] Failed to write ${key}:`, error);
  }
}

export function getCachedMoviesBatch(titles: string[]): {
  cached: Map<string, NormalizedMovie>;
  missing: string[];
} {
  const cached = new Map<string, NormalizedMovie>();
  const missing: string[] = [];

  for (const title of titles) {
    const normKey = normalizeCacheKey(title);
    if (!normKey) continue;

    const movie = getCachedMovie(title);
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
