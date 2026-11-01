import { useMemo, useCallback } from 'react';
import type { MovieRatings } from '../HooksExcelMovies/useGetMovies';
import type { RootState } from '../store/store';
import type { Media } from '../components/MovieSlider';
import {
  parseViewingMonth,
  formatViewingMonth,
  type ViewingMonth,
} from '../utils/dateFormat';
import {
  buildRatingsMap,
  getMovieNumericRating,
  type TitleHolder,
} from '../utils/ratings';

export type SortOrder =
  | 'added'
  | 'reverse'
  | 'top-rated'
  | 'low-rated'
  | 'alphabetical'
  | 'alphabetical-reverse'
  | 'viewing-month';

export type ViewingFilterMode = 'all' | 'month' | 'range';

export type MovieMedia = Extract<RootState['foundMovies']['value'][number], { media_type: 'movie' | 'tv' }>;

export type SortableMedia = TitleHolder & {
  id?: number;
  media_type?: string;
  original_title?: string;
  original_name?: string;
  backdrop_path?: string;
  poster_path?: string | null;
  overview?: string;
  source?: string;
  isExcelFallback?: boolean;
};

export type ViewingMonthSectionItem = {
  key: string;
  title: string;
  movies: Media[];
};

export const sortMovies = <T extends SortableMedia>(
  movies: T[],
  sortOrder: SortOrder,
  ratingsMap: Map<string, MovieRatings>
): T[] => {
  if (sortOrder === 'reverse') {
    return [...movies].reverse();
  }

  if (sortOrder === 'added' || sortOrder === 'viewing-month') {
    return movies;
  }

  return [...movies].sort((firstMovie, secondMovie) => {
    if (sortOrder === 'alphabetical') {
      const firstTitle = (firstMovie.title ?? firstMovie.name ?? firstMovie.original_title ?? firstMovie.original_name ?? '').trim();
      const secondTitle = (secondMovie.title ?? secondMovie.name ?? secondMovie.original_title ?? secondMovie.original_name ?? '').trim();
      if (!firstTitle && !secondTitle) return 0;
      if (!firstTitle) return 1;
      if (!secondTitle) return -1;
      return firstTitle.localeCompare(secondTitle, 'ru', { sensitivity: 'base' });
    }

    if (sortOrder === 'alphabetical-reverse') {
      const firstTitle = (firstMovie.title ?? firstMovie.name ?? firstMovie.original_title ?? firstMovie.original_name ?? '').trim();
      const secondTitle = (secondMovie.title ?? secondMovie.name ?? secondMovie.original_title ?? secondMovie.original_name ?? '').trim();
      if (!firstTitle && !secondTitle) return 0;
      if (!firstTitle) return 1;
      if (!secondTitle) return -1;
      return secondTitle.localeCompare(firstTitle, 'ru', { sensitivity: 'base' });
    }

    const firstRating = getMovieNumericRating(firstMovie, ratingsMap);
    const secondRating = getMovieNumericRating(secondMovie, ratingsMap);

    if (firstRating === undefined && secondRating === undefined) return 0;
    if (firstRating === undefined) return 1;
    if (secondRating === undefined) return -1;

    return sortOrder === 'top-rated' ? secondRating - firstRating : firstRating - secondRating;
  });
};

interface UseCatalogMoviesProps {
  foundMovies: Media[];
  searchBarValue: string;
  searchAllMovies: boolean;
  searchResults?: Media[];
  sortOrder: SortOrder;
  usersRating: MovieRatings[];
  viewingFilterMode: ViewingFilterMode;
  selectedViewingMonth: string;
  viewingRangeStart: string;
  viewingRangeEnd: string;
}

export function useCatalogMovies({
  foundMovies,
  searchBarValue,
  searchAllMovies,
  searchResults,
  sortOrder,
  usersRating,
  viewingFilterMode,
  selectedViewingMonth,
  viewingRangeStart,
  viewingRangeEnd,
}: UseCatalogMoviesProps) {
  // Pre-build ratings map for O(1) rating lookups
  const ratingsMap = useMemo(() => buildRatingsMap(usersRating), [usersRating]);

  const normalizedSearchValue = searchBarValue.trim().toLowerCase();

  // 1. Determine base unsorted array
  const baseMovies = useMemo(() => {
    if (!normalizedSearchValue) {
      return foundMovies;
    }
    if (searchAllMovies) {
      return searchResults ?? [];
    }
    return foundMovies.filter((movie) => {
      if (movie.media_type === 'person') return false;
      return [movie.title, movie.original_title].some((title) =>
        title?.toLowerCase().includes(normalizedSearchValue)
      );
    });
  }, [normalizedSearchValue, searchAllMovies, searchResults, foundMovies]);

  // 2. Perform a single sort only on baseMovies
  const displayedMovies = useMemo(() => {
    return sortMovies(baseMovies, sortOrder, ratingsMap);
  }, [baseMovies, sortOrder, ratingsMap]);

  // Available viewing months from usersRating
  const availableViewingMonths = useMemo(() => {
    return [...new Map(
      usersRating
        .map((rating) => parseViewingMonth(rating.date))
        .filter((month): month is ViewingMonth => month !== undefined)
        .map((month): [string, ViewingMonth] => [month.key, month])
    ).values()].sort((first, second) => first.key.localeCompare(second.key));
  }, [usersRating]);

  const latestViewingMonth = availableViewingMonths[availableViewingMonths.length - 1];
  const firstViewingMonth = availableViewingMonths[0];

  const activeViewingMonthKey = availableViewingMonths.some((month) => month.key === selectedViewingMonth)
    ? selectedViewingMonth
    : latestViewingMonth?.key ?? '';

  const activeRangeStart = availableViewingMonths.some((month) => month.key === viewingRangeStart)
    ? viewingRangeStart
    : firstViewingMonth?.key ?? '';

  const activeRangeEnd = availableViewingMonths.some((month) => month.key === viewingRangeEnd)
    ? viewingRangeEnd
    : latestViewingMonth?.key ?? '';

  const rangeStartMonth = availableViewingMonths.find((month) => month.key === activeRangeStart);
  const rangeEndMonth = availableViewingMonths.find((month) => month.key === activeRangeEnd);

  const getMovieViewingMonth = useCallback(
    (movie: SortableMedia): ViewingMonth | undefined => {
      const movieTitle = (movie.excelTitle ?? movie.title ?? movie.original_title ?? movie.name)
        ?.trim()
        .toLocaleLowerCase('ru-RU');
      if (!movieTitle) return undefined;
      const matchingRating = ratingsMap.get(movieTitle);
      return parseViewingMonth(matchingRating?.date);
    },
    [ratingsMap]
  );

  const visibleViewingMonths = useMemo(() => {
    return availableViewingMonths.filter((month) => {
      if (viewingFilterMode === 'month') {
        return month.key === activeViewingMonthKey;
      }
      if (viewingFilterMode === 'range') {
        return month.key >= activeRangeStart && month.key <= activeRangeEnd;
      }
      return true;
    });
  }, [availableViewingMonths, viewingFilterMode, activeViewingMonthKey, activeRangeStart, activeRangeEnd]);

  // Heavy grouping is computed ONLY when sortOrder === 'viewing-month'
  const { groupedMoviesByViewingMonth, moviesWithoutViewingDate, viewingMonthSections } = useMemo(() => {
    if (sortOrder !== 'viewing-month') {
      return {
        groupedMoviesByViewingMonth: [],
        moviesWithoutViewingDate: [],
        viewingMonthSections: [],
      };
    }

    const grouped = visibleViewingMonths
      .map((month) => ({
        month,
        movies: displayedMovies.filter((movie) => getMovieViewingMonth(movie)?.key === month.key),
      }))
      .filter((group) => group.movies.length > 0);

    const withoutDate =
      viewingFilterMode === 'all'
        ? displayedMovies.filter((movie) => getMovieViewingMonth(movie) === undefined)
        : [];

    const sections: ViewingMonthSectionItem[] = [
      ...grouped.map(({ month, movies }) => ({
        key: month.key,
        title: formatViewingMonth(month, 'nominative'),
        movies,
      })),
      ...(withoutDate.length > 0
        ? [
            {
              key: 'without-viewing-date',
              title: 'Дата просмотра не указана',
              movies: withoutDate,
            },
          ]
        : []),
    ];

    return {
      groupedMoviesByViewingMonth: grouped,
      moviesWithoutViewingDate: withoutDate,
      viewingMonthSections: sections,
    };
  }, [sortOrder, visibleViewingMonths, displayedMovies, viewingFilterMode, getMovieViewingMonth]);

  // Featured billboard movie (top-rated movie with backdrop/poster)
  const featuredMovie = useMemo<MovieMedia | null>(() => {
    if (!foundMovies || foundMovies.length === 0) return null;
    const candidates = foundMovies.filter(
      (m): m is MovieMedia => m.media_type !== 'person' && Boolean(m.backdrop_path || m.poster_path)
    );
    if (candidates.length === 0) {
      const first = foundMovies.find((m): m is MovieMedia => m.media_type !== 'person');
      return first ?? null;
    }

    const sortedByRating = [...candidates].sort((a, b) => {
      const rA = getMovieNumericRating(a, ratingsMap) ?? 0;
      const rB = getMovieNumericRating(b, ratingsMap) ?? 0;
      return rB - rA;
    });

    return sortedByRating[0] ?? null;
  }, [foundMovies, ratingsMap]);

  return {
    ratingsMap,
    displayedMovies,
    availableViewingMonths,
    activeViewingMonthKey,
    activeRangeStart,
    activeRangeEnd,
    rangeStartMonth,
    rangeEndMonth,
    visibleViewingMonths,
    groupedMoviesByViewingMonth,
    moviesWithoutViewingDate,
    viewingMonthSections,
    featuredMovie,
  };
}
