const rawGasUrl = import.meta.env.VITE_GAS_URL;
const rawProxyUrl = import.meta.env.VITE_TMDB_PROXY_URL;
const tmdbProxyUrl = rawProxyUrl ? rawProxyUrl.replace(/\/+$/, '') : '';
const DEFAULT_TIMEOUT_MS = 6000;

export type FetchTmdbOptions = {
  timeoutMs?: number;
  signal?: AbortSignal;
};

export async function fetchTmdb<T>(path: string, options?: FetchTmdbOptions): Promise<T> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  let targetUrl = '';
  if (rawGasUrl) {
    const separator = rawGasUrl.includes('?') ? '&' : '?';
    targetUrl = `${rawGasUrl}${separator}action=tmdb&path=${encodeURIComponent(cleanPath)}`;
  } else if (tmdbProxyUrl) {
    targetUrl = `${tmdbProxyUrl}${cleanPath}`;
  } else {
    throw new Error('Neither VITE_GAS_URL nor VITE_TMDB_PROXY_URL is configured');
  }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    let combinedSignal: AbortSignal;
    if (options?.signal) {
      if (typeof AbortSignal.any === 'function') {
        combinedSignal = AbortSignal.any([controller.signal, options.signal]);
      } else {
        options.signal.addEventListener('abort', () => controller.abort(), { once: true });
        combinedSignal = controller.signal;
      }
    } else {
      combinedSignal = controller.signal;
    }

    const response = await fetch(targetUrl, { signal: combinedSignal, redirect: 'follow' });

    if (!response.ok) {
      throw new Error(`TMDB request failed with HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/**
 * Fast health check to verify TMDB connectivity (e.g. through GAS or proxy).
 */
export async function checkTmdbHealth(timeoutMs = 4000): Promise<boolean> {
  if (!rawGasUrl && !tmdbProxyUrl) {
    return false;
  }

  try {
    await fetchTmdb('/configuration', { timeoutMs });
    return true;
  } catch (error) {
    console.warn('[TMDB Health Check] TMDB is unreachable:', error);
    return false;
  }
}
