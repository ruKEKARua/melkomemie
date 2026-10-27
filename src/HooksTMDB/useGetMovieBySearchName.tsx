import { getCachedMovie, setCachedMovie } from '../api/movieCache';
import { searchMoviesFromSource, type NormalizedMovie } from '../api/movieSource';

export const normalizeTitle = (value: string): string =>
  value
    .toLocaleLowerCase('ru-RU')
    .replace(/[«»"'`]/g, '')
    .replace(/\s*\((?:18|19|20)\d{2}\)\s*$/, '')
    .trim();

export const getRequestedYear = (value: string): string | undefined =>
  value.match(/\b(18|19|20)\d{2}\b/)?.[0];

type MovieAlias = {
  searchQuery?: string;
  tmdbId?: number;
  kinopoiskId?: number;
};

const MOVIE_ALIASES: Record<string, MovieAlias> = {
  комната: {
    tmdbId: 17473,
    kinopoiskId: 259981,
  },
  вершина: {
    searchQuery: 'На вершине',
  },
  толкатель: {
    searchQuery: 'Дилер',
  },
  'толкатель 2': {
    searchQuery: 'Дилер 2',
  },
  'бивис и баттхед уделывают америку (1996)': {
    searchQuery: 'Бивис и Баттхед уделывают Америку',
    tmdbId: 3179,
    kinopoiskId: 4172,
  },
  'бивис и баттхед уделывают америку': {
    searchQuery: 'Бивис и Баттхед уделывают Америку',
    tmdbId: 3179,
    kinopoiskId: 4172,
  },
  'чёрный котёл': {
    searchQuery: 'The Black Cauldron',
    tmdbId: 10957,
    kinopoiskId: 28108,
  },
  'гром в штанах': {
    searchQuery: 'Thunderpants',
    tmdbId: 21605,
    kinopoiskId: 43054,
  },
  'золушка (2021)': {
    searchQuery: 'Cinderella',
    tmdbId: 593910,
    kinopoiskId: 1261358,
  },
  'птицекалипсис: шок и трепет': {
    searchQuery: 'Birdemic: Shock and Terror',
    tmdbId: 40016,
    kinopoiskId: 494572,
  },
  '🎄 клаус 🎄': {
    searchQuery: 'Клаус',
  },
  кентавр: {
    tmdbId: 1142871,
    kinopoiskId: 5064560,
  },
  'ресидент ивел': {
    searchQuery: 'Resident Evil',
    tmdbId: 1423191,
    kinopoiskId: 5396556,
  },
};

export async function findMovieBySearchTitle(title: string): Promise<NormalizedMovie | null> {
  const excelTitle = title.trim();
  if (!excelTitle) {
    return null;
  }

  // 1. Check persistent cache first (instant return, 0 network requests)
  const cached = getCachedMovie(excelTitle);
  if (cached) {
    return { ...cached, excelTitle };
  }

  const normalized = normalizeTitle(excelTitle);
  const requestedYear = getRequestedYear(excelTitle);

  const alias = MOVIE_ALIASES[normalized] ?? MOVIE_ALIASES[excelTitle.toLocaleLowerCase('ru-RU')];
  const searchQuery = alias?.searchQuery || excelTitle;

  try {
    const movies = await searchMoviesFromSource(searchQuery);
    if (!movies || movies.length === 0) {
      return null;
    }

    // Match candidate in order of precision:
    // 1. Alias ID match (TMDB or Kinopoisk ID based on movie.source)
    let candidate: NormalizedMovie | undefined;

    if (alias) {
      candidate = movies.find((item) => {
        if (item.source === 'tmdb' && alias.tmdbId && item.id === alias.tmdbId) {
          return true;
        }
        if (item.source === 'kinopoisk' && alias.kinopoiskId && item.id === alias.kinopoiskId) {
          return true;
        }
        return false;
      });
    }

    if (!candidate) {
      const exactTitleMatches = movies.filter(
        (item) =>
          normalizeTitle(item.title) === normalized ||
          normalizeTitle(item.original_title) === normalized,
      );

      const yearMatches = requestedYear
        ? exactTitleMatches.filter((item) => item.release_date?.startsWith(requestedYear))
        : [];

      candidate = yearMatches[0] ?? exactTitleMatches[0] ?? movies[0];
    }

    if (candidate) {
      const result: NormalizedMovie = {
        ...candidate,
        excelTitle,
      };

      // Save to persistent cache
      setCachedMovie(excelTitle, result);
      return result;
    }
  } catch (error) {
    console.error(`[MovieSearch] Failed to find movie "${excelTitle}":`, error);
  }

  return null;
}

export default findMovieBySearchTitle;
