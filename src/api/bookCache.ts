import type { BookClubBook } from './bookClubData';
import { DEFAULT_BOOK_COVERS } from './bookCoversData';

const KEY_PREFIX = 'mm_book_';
const LIST_KEY = `${KEY_PREFIX}list`;
const DETAILS_PREFIX = `${KEY_PREFIX}details_`;
const COVER_PREFIX = `${KEY_PREFIX}cover_`;
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days TTL, matching movie cache

export type EnrichedBookDetails = {
  coverUrl?: string;
  publisher?: string;
  publishedYear?: string;
  description?: string;
  pageCount?: number;
  categories?: string[];
  language?: string;
  cachedAt?: number;
};

type CacheRecord<T> = {
  data: T;
  cachedAt: number;
};

export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    const testKey = '__mm_book_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes book title for fuzzy cache lookups
 */
export function normalizeBookKey(title: string): string {
  return title
    .toLocaleLowerCase('ru-RU')
    .replace(/[«»"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Purges old/expired book cache entries if localStorage quota is tight
 */
export function tryPurgeOldBookCache(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(KEY_PREFIX)) {
        try {
          const raw = window.localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw) as { cachedAt?: number };
            if (parsed.cachedAt && now - parsed.cachedAt > CACHE_TTL_MS) {
              keysToRemove.push(key);
            }
          }
        } catch {
          // If corrupted, mark for removal
          keysToRemove.push(key);
        }
      }
    }

    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn('[bookCache] Error during cache cleanup:', error);
  }
}

/**
 * Seeds and caches default base64 covers into localStorage.
 * Ensures instant 0ms offline availability on first load.
 */
export function initializeDefaultBookCovers(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    for (const [idStr, dataUrl] of Object.entries(DEFAULT_BOOK_COVERS)) {
      const id = Number(idStr);
      const coverKey = `${COVER_PREFIX}${id}`;
      // Only set if not already present or if we have high-quality embedded base64
      const existing = window.localStorage.getItem(coverKey);
      if (!existing && dataUrl) {
        window.localStorage.setItem(
          coverKey,
          JSON.stringify({
            data: dataUrl,
            cachedAt: Date.now(),
          }),
        );
      }
    }
  } catch (error) {
    console.warn('[bookCache] Failed to initialize default book covers:', error);
    tryPurgeOldBookCache();
  }
}

// Automatically seed on module load in browser
if (typeof window !== 'undefined') {
  initializeDefaultBookCovers();
}

/**
 * Retrieves the cached base64 or URL cover for a book.
 * Falls back to embedded base64 dictionary if not in localStorage.
 */
export function getCachedBookCover(id: number): string | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_BOOK_COVERS[id] || null;
  }

  const key = `${COVER_PREFIX}${id}`;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) {
      const record = JSON.parse(raw) as CacheRecord<string>;
      if (record?.data) {
        return record.data;
      }
    }
  } catch (error) {
    console.warn(`[bookCache] Error reading cover for book ${id}:`, error);
  }

  // Fallback to embedded default cover
  const embedded = DEFAULT_BOOK_COVERS[id];
  if (embedded) {
    // Save to localStorage for future instant sync
    setCachedBookCover(id, embedded);
    return embedded;
  }

  return null;
}

/**
 * Stores a cover (Data URL or clean URL) into localStorage
 */
export function setCachedBookCover(id: number, coverDataUrlOrUrl: string): void {
  if (typeof window === 'undefined' || !window.localStorage || !coverDataUrlOrUrl) return;

  const key = `${COVER_PREFIX}${id}`;
  try {
    const payload: CacheRecord<string> = {
      data: coverDataUrlOrUrl,
      cachedAt: Date.now(),
    };
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch (error) {
    console.warn(`[bookCache] Failed to save cover for book ${id}:`, error);
    tryPurgeOldBookCache();
  }
}

/**
 * Retrieves cached Book Club books list
 */
export function getCachedBookClubBooks(): BookClubBook[] | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;

  try {
    const raw = window.localStorage.getItem(LIST_KEY);
    if (!raw) return null;

    const record = JSON.parse(raw) as CacheRecord<BookClubBook[]>;
    if (!record || !Array.isArray(record.data) || record.data.length === 0) {
      return null;
    }

    if (Date.now() - (record.cachedAt ?? 0) > CACHE_TTL_MS) {
      return null;
    }

    // Attach cached covers if available
    return record.data.map((book) => {
      const cachedCover = getCachedBookCover(book.id);
      return cachedCover
        ? { ...book, coverUrl: cachedCover }
        : book;
    });
  } catch (error) {
    console.warn('[bookCache] Error reading book club list cache:', error);
    return null;
  }
}

/**
 * Saves Book Club books list to localStorage
 */
export function setCachedBookClubBooks(books: BookClubBook[]): void {
  if (typeof window === 'undefined' || !window.localStorage || !books || books.length === 0) return;

  try {
    const record: CacheRecord<BookClubBook[]> = {
      data: books,
      cachedAt: Date.now(),
    };
    window.localStorage.setItem(LIST_KEY, JSON.stringify(record));

    // Also populate individual book entries and covers
    for (const book of books) {
      if (book.coverUrl && !book.coverUrl.startsWith('data:')) {
        // If not already base64, save whatever cover URL we have
        const existingCover = getCachedBookCover(book.id);
        if (!existingCover) {
          setCachedBookCover(book.id, book.coverUrl);
        }
      }
    }
  } catch (error) {
    console.warn('[bookCache] Failed to save book club list cache:', error);
    tryPurgeOldBookCache();
  }
}

/**
 * Retrieves cached enriched book metadata (Google Books details)
 */
export function getCachedBookDetails(bookId: number | string): EnrichedBookDetails | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;

  const key = `${DETAILS_PREFIX}${bookId}`;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const record = JSON.parse(raw) as CacheRecord<EnrichedBookDetails>;
    if (!record || !record.data) return null;

    if (Date.now() - (record.cachedAt ?? 0) > CACHE_TTL_MS) {
      window.localStorage.removeItem(key);
      return null;
    }

    return record.data;
  } catch (error) {
    console.warn(`[bookCache] Error reading details for book ${bookId}:`, error);
    return null;
  }
}

/**
 * Saves enriched book metadata into localStorage
 */
export function setCachedBookDetails(bookId: number | string, details: EnrichedBookDetails): void {
  if (typeof window === 'undefined' || !window.localStorage || !details) return;

  const key = `${DETAILS_PREFIX}${bookId}`;
  try {
    const record: CacheRecord<EnrichedBookDetails> = {
      data: details,
      cachedAt: Date.now(),
    };
    window.localStorage.setItem(key, JSON.stringify(record));
  } catch (error) {
    console.warn(`[bookCache] Failed to save details for book ${bookId}:`, error);
    tryPurgeOldBookCache();
  }
}

/**
 * Converts an external image URL to base64 Data URL and saves to localStorage.
 * Non-blocking, fails gracefully on CORS.
 */
export async function convertAndCacheBookCover(id: number, url: string): Promise<string | null> {
  const existing = getCachedBookCover(id);
  if (existing && existing.startsWith('data:')) {
    return existing;
  }

  if (!url || typeof window === 'undefined') return null;

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;

    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (base64 && base64.startsWith('data:')) {
          setCachedBookCover(id, base64);
          resolve(base64);
        } else {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    // CORS or network failure: silently keep existing URL
    return null;
  }
}

/**
 * Asynchronously preloads and caches covers for all books in background
 */
export async function preloadAndCacheBookCovers(books: BookClubBook[]): Promise<void> {
  for (const book of books) {
    const currentCover = getCachedBookCover(book.id);
    if (!currentCover && book.coverUrl) {
      await convertAndCacheBookCover(book.id, book.coverUrl);
    }
  }
}

/**
 * Clears all Book Club related data from localStorage
 */
export function clearBookCache(): void {
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

    window.dispatchEvent(new CustomEvent('mm_books_cache_cleared'));
  } catch (error) {
    console.warn('[bookCache] Failed to clear book cache:', error);
  }
}
