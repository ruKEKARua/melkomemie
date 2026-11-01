/**
 * LocalStorage cache for background posters on the authorization landing page.
 * 
 * Optimized for minimal string length and quota efficiency:
 * - Only stores essential fields (`id` and `poster_path`), stripping huge overviews/metadata.
 * - Stores each page in a separate key (`mm_bg_posters_p_<page>`) so each entry is ~800-1200 bytes.
 * - Enforces safe payload size limits and handles quota exceeded errors gracefully.
 * - Supports TTL expiration (14 days).
 */

import { getActiveMovieSource, type MovieSource } from './movieSource';
import {
  isLocalStorageAvailable,
  purgeExpiredStorageRecords,
  clearStorageByPrefix,
} from '../utils/storageCache';

export { isLocalStorageAvailable };

export type CompactPosterItem = {
  id: number;
  poster_path: string;
};

type CachedPageRecord = {
  cachedAt: number;
  posters: CompactPosterItem[];
};

const KEY_PREFIX = 'mm_bg_posters_';
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const MAX_POSTERS_PER_PAGE = 20; // 20 posters per row is sufficient to cover the background width
const MAX_STRING_LENGTH = 4096; // 4 KB safety limit per entry to strictly respect string length limits

function getStorageKey(page: number, source?: MovieSource): string {
  const currentSource = source ?? getActiveMovieSource();
  return `${KEY_PREFIX}${currentSource}_p_${page}`;
}

/**
 * Reads cached posters for a specific page from localStorage synchronously.
 * Returns null if not cached, expired, or invalid.
 */
export function getCachedPopularPosters(page: number, source?: MovieSource): CompactPosterItem[] | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;

  const currentSource = source ?? getActiveMovieSource();
  const key = getStorageKey(page, currentSource);
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const record = JSON.parse(raw) as CachedPageRecord;
    if (!record || !Array.isArray(record.posters) || record.posters.length === 0) {
      return null;
    }

    // Check TTL
    if (Date.now() - (record.cachedAt ?? 0) > CACHE_TTL_MS) {
      window.localStorage.removeItem(key);
      return null;
    }

    // Validate format compatibility with the target source
    const isKinopoisk = currentSource === 'kinopoisk';
    const isCompatible = isKinopoisk
      ? record.posters.every((p) => p.poster_path.startsWith('http://') || p.poster_path.startsWith('https://'))
      : record.posters.every((p) => !p.poster_path.startsWith('http'));

    if (!isCompatible) {
      window.localStorage.removeItem(key);
      return null;
    }

    return record.posters;
  } catch (error) {
    console.warn(`[posterCache] Error reading cache for page ${page}:`, error);
    return null;
  }
}

/**
 * Saves a page of popular posters to localStorage.
 * Filters out items without posters, strips all heavy metadata (overviews, titles, etc.),
 * and limits string length to prevent localStorage quota issues.
 */
export function setCachedPopularPosters(
  page: number,
  movies: Array<{ id?: number; poster_path?: string | null }>,
  source?: MovieSource,
): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (!movies || movies.length === 0) return;

  const currentSource = source ?? getActiveMovieSource();
  const key = getStorageKey(page, currentSource);

  try {
    // Extract only essential fields to minimize storage footprint
    const compactPosters: CompactPosterItem[] = [];

    for (const movie of movies) {
      if (compactPosters.length >= MAX_POSTERS_PER_PAGE) break;
      const posterPath = movie?.poster_path?.trim();
      if (posterPath) {
        compactPosters.push({
          id: movie.id ?? 0,
          poster_path: posterPath,
        });
      }
    }

    if (compactPosters.length === 0) return;

    const record: CachedPageRecord = {
      cachedAt: Date.now(),
      posters: compactPosters,
    };

    let serialized = JSON.stringify(record);

    // Safeguard: Ensure string length doesn't exceed safety limit
    if (serialized.length > MAX_STRING_LENGTH) {
      record.posters = compactPosters.slice(0, 10);
      serialized = JSON.stringify(record);
    }

    window.localStorage.setItem(key, serialized);
  } catch (error) {
    console.warn(`[posterCache] Failed to save posters for page ${page}:`, error);
    tryPurgeOldPosterCache();
  }
}

/**
 * Removes any expired poster cache entries to free up localStorage space.
 */
export function tryPurgeOldPosterCache(): void {
  purgeExpiredStorageRecords(KEY_PREFIX, CACHE_TTL_MS);
}

/**
 * Clears all background posters cache.
 */
export function clearPosterCache(): void {
  clearStorageByPrefix(KEY_PREFIX);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mm_posters_cache_cleared'));
  }
}
