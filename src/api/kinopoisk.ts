const kinopoiskApiV21 = 'https://kinopoiskapiunofficial.tech/api/v2.1';
const kinopoiskApiV22 = 'https://kinopoiskapiunofficial.tech/api/v2.2';

const kinopoiskApiKey =
  import.meta.env.VITE_KINOPOISK_API_KEY ?? '5a2a67d9-a49f-4cda-9b4e-ab7c48034246';

export type KinopoiskFilm = {
  filmId: number;
  kinopoiskId?: number;
  nameRu?: string;
  nameEn?: string;
  nameOriginal?: string;
  year?: number | string;
  description?: string;
  shortDescription?: string;
  posterUrl?: string;
  posterUrlPreview?: string;
  coverUrl?: string;
  logoUrl?: string;
  rating?: number | string;
  ratingKinopoisk?: number | string;
  ratingVoteCount?: number;
  ratingKinopoiskVoteCount?: number;
  genres?: Array<{ genre?: string }>;
};

type KinopoiskSearchResponse = {
  films?: KinopoiskFilm[];
};

type KinopoiskTopResponse = {
  films?: KinopoiskFilm[];
  items?: KinopoiskFilm[];
};

const KINOPOISK_INTERVAL_MS = 250; // Max 4 requests/sec (API limit is 5 req/sec)
let nextKinopoiskRequestAt = 0;
let requestQueue = Promise.resolve();

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

/**
 * Executes a request in sequence, respecting the rate limit.
 * If 429 Too Many Requests occurs, pauses with exponential backoff and retries.
 */
const scheduleKinopoiskRequest = <T>(requestFn: () => Promise<T>, maxRetries = 2): Promise<T> => {
  const queued = requestQueue.then(async () => {
    let attempt = 0;
    while (attempt <= maxRetries) {
      const delay = Math.max(0, nextKinopoiskRequestAt - Date.now());
      if (delay > 0) {
        await wait(delay);
      }
      nextKinopoiskRequestAt = Date.now() + KINOPOISK_INTERVAL_MS;

      try {
        return await requestFn();
      } catch (err: unknown) {
        const error = err as { status?: number; message?: string };
        attempt++;

        if (error.status === 429 && attempt <= maxRetries) {
          const backoff = 1500 * attempt;
          console.warn(`[Kinopoisk] 429 Too Many Requests. Backing off for ${backoff}ms (attempt ${attempt}/${maxRetries})...`);
          await wait(backoff);
          continue;
        }

        if (attempt <= maxRetries && error.status && error.status >= 500) {
          await wait(1000);
          continue;
        }

        throw err;
      }
    }

    throw new Error('Kinopoisk request failed after maximum retries');
  });

  // Ensure queue chain never permanently rejects
  requestQueue = queued.then(
    () => undefined,
    () => undefined,
  );

  return queued;
};

const getKinopoisk = async <T>(url: string): Promise<T> => {
  return scheduleKinopoiskRequest(async () => {
    const response = await fetch(url, {
      headers: {
        'X-API-KEY': kinopoiskApiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = new Error(`Kinopoisk request failed: HTTP ${response.status}`) as Error & {
        status?: number;
      };
      error.status = response.status;
      throw error;
    }

    return (await response.json()) as T;
  });
};

// In-memory caching & request deduplication
const searchCache = new Map<string, { expiresAt: number; films: KinopoiskFilm[] }>();
const searchInFlight = new Map<string, Promise<KinopoiskFilm[]>>();
const SEARCH_CACHE_LIFETIME_MS = 15 * 60 * 1000; // 15 mins

const filmCache = new Map<number, { expiresAt: number; film: KinopoiskFilm }>();
const filmInFlight = new Map<number, Promise<KinopoiskFilm>>();
const FILM_CACHE_LIFETIME_MS = 30 * 60 * 1000; // 30 mins

export async function fetchKinopoiskSearch(keyword: string): Promise<KinopoiskFilm[]> {
  const cleanKeyword = keyword.trim().toLocaleLowerCase('ru-RU');
  if (!cleanKeyword) {
    return [];
  }

  const cached = searchCache.get(cleanKeyword);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.films;
  }

  const activeRequest = searchInFlight.get(cleanKeyword);
  if (activeRequest) {
    return activeRequest;
  }

  const request = getKinopoisk<KinopoiskSearchResponse>(
    `${kinopoiskApiV21}/films/search-by-keyword?keyword=${encodeURIComponent(cleanKeyword)}&page=1`,
  )
    .then((data) => {
      const films = data.films ?? [];
      searchCache.set(cleanKeyword, {
        expiresAt: Date.now() + SEARCH_CACHE_LIFETIME_MS,
        films,
      });
      return films;
    })
    .finally(() => {
      searchInFlight.delete(cleanKeyword);
    });

  searchInFlight.set(cleanKeyword, request);
  return request;
}

export async function fetchKinopoiskPopular(page: number): Promise<KinopoiskFilm[]> {
  const data = await getKinopoisk<KinopoiskTopResponse>(
    `${kinopoiskApiV22}/films/top?type=TOP_100_POPULAR_FILMS&page=${page}`,
  );
  return data.films ?? data.items ?? [];
}

export async function fetchKinopoiskFilm(filmId: number): Promise<KinopoiskFilm> {
  const cached = filmCache.get(filmId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.film;
  }

  const activeRequest = filmInFlight.get(filmId);
  if (activeRequest) {
    return activeRequest;
  }

  const request = getKinopoisk<KinopoiskFilm | { data?: KinopoiskFilm }>(
    `${kinopoiskApiV22}/films/${filmId}`,
  )
    .then((data) => {
      let film: KinopoiskFilm;
      if ('data' in data && data.data) {
        film = data.data;
      } else {
        film = data as KinopoiskFilm;
      }

      // Ensure filmId is filled
      if (!film.filmId && film.kinopoiskId) {
        film.filmId = film.kinopoiskId;
      }

      filmCache.set(filmId, {
        expiresAt: Date.now() + FILM_CACHE_LIFETIME_MS,
        film,
      });

      return film;
    })
    .catch(async () => {
      // Fallback to v2.1 if v2.2 fails for some reason
      const fallback = await getKinopoisk<{ data?: KinopoiskFilm } | KinopoiskFilm>(
        `${kinopoiskApiV21}/films/${filmId}`,
      );
      const film = 'data' in fallback && fallback.data ? fallback.data : (fallback as KinopoiskFilm);
      if (!film.filmId && (film as { kinopoiskId?: number }).kinopoiskId) {
        film.filmId = (film as { kinopoiskId: number }).kinopoiskId;
      }
      return film;
    })
    .finally(() => {
      filmInFlight.delete(filmId);
    });

  filmInFlight.set(filmId, request);
  return request;
}
