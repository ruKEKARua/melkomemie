const rawProxyUrl = import.meta.env.VITE_TMDB_PROXY_URL;
const tmdbProxyUrl = rawProxyUrl ? rawProxyUrl.replace(/\/+$/, '') : '';
const DEFAULT_TIMEOUT_MS = 5000;

export type FetchTmdbOptions = {
  timeoutMs?: number;
  signal?: AbortSignal;
};

export async function fetchTmdb<T>(path: string, options?: FetchTmdbOptions): Promise<T> {
  if (!tmdbProxyUrl) {
    throw new Error('VITE_TMDB_PROXY_URL is not configured');
  }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const targetUrl = `${tmdbProxyUrl}${cleanPath}`;

  try {
    const combinedSignal = options?.signal
      ? AbortSignal.any([controller.signal, options.signal])
      : controller.signal;

    const response = await fetch(targetUrl, { signal: combinedSignal });

    if (!response.ok) {
      throw new Error(`TMDB request failed with HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/**
 * Fast health check to verify TMDB connectivity (e.g. from Russia or through proxy).
 * Uses a shorter timeout (default 2500ms) so failure is detected quickly.
 */
export async function checkTmdbHealth(timeoutMs = 2500): Promise<boolean> {
  if (!tmdbProxyUrl) {
    return false;
  }

  try {
    await fetchTmdb('/configuration', { timeoutMs });
    return true;
  } catch (error) {
    console.warn('[TMDB Health Check] TMDB proxy is unreachable:', error);
    return false;
  }
}
