const TMDB_PROXY_BASE = 'https://movies-tmdb-proxy.kekar.workers.dev/image';

/**
 * Universal movie image resolver.
 * Handles both Kinopoisk absolute URLs (https://...) and TMDB paths (/xxx.jpg).
 */
export function getMovieImageUrl(
  path: string | null | undefined,
  size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original' | string = 'w780',
): string {
  if (!path) {
    return '';
  }

  // Kinopoisk and already resolved external URLs
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  if (path.startsWith('//')) {
    return `https:${path}`;
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${TMDB_PROXY_BASE}/${size}${cleanPath}`;
}

/**
 * Backward-compatible alias for existing components.
 */
export function getTmdbImageUrl(size: string, path: string | null | undefined): string {
  return getMovieImageUrl(path, size);
}
