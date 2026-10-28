import './App.css';

import type { RootState } from './store/store';
import { MovieSlider } from './components/MovieSlider';
import Modal from './components/Modal';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import BackgroundPosters from './components/BackgroundPosters';

import useGetMovies from './HooksExcelMovies/useGetMovies';
import useSearchMovie from './HooksTMDB/useSearchMovie';
import { setSearchBarValue } from './store/searchBar';
import { openModal } from './store/openModal';
import useSetArrayOfSearchedMovies from './HooksTMDB/useSetArrayOfSearchedMovies';
import MovieEntryPage from './pages/MovieEntryPage';
import type { MovieRatings } from './HooksExcelMovies/useGetMovies';
import {
  detectMovieSource,
  getActiveMovieSource,
  onSourceChange,
  setActiveMovieSource,
  type NormalizedMovie,
  type MovieSource,
} from './api/movieSource';
import MovieRoulette from './components/MovieRoulette';
import { getTmdbImageUrl } from './api/tmdbImage';
import Logo from './components/UI/Logo';
import { TournamentsPage } from './pages/TournamentsPage';
import HeaderBurgerMenu from './components/UI/HeaderBurgerMenu';
import HeaderSettingsMenu from './components/UI/HeaderSettingsMenu';

type PageMode = 'main' | 'entry' | 'roulette' | 'tournaments';
type SortOrder = 'added' | 'reverse' | 'top-rated' | 'low-rated' | 'alphabetical' | 'alphabetical-reverse' | 'viewing-month';
type ViewingFilterMode = 'all' | 'month' | 'range';

type MovieMedia = Extract<RootState['foundMovies']['value'][number], { media_type: 'movie' | 'tv' }>;

type SortableMedia = {
  id?: number;
  media_type?: string;
  title?: string;
  original_title?: string;
  name?: string;
  original_name?: string;
  excelTitle?: string;
  backdrop_path?: string;
  poster_path?: string | null;
  overview?: string;
  source?: string;
  isExcelFallback?: boolean;
};

type ViewingMonth = {
  key: string;
  year: number;
  month: number;
};

const monthNames = {
  nominative: ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'],
  genitive: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  locative: ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре'],
};

const parseViewingMonth = (date?: string): ViewingMonth | undefined => {
  if (!date) return undefined;

  const normalizedDate = date.trim();
  const isoDate = normalizedDate.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  const localizedDate = normalizedDate.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  const year = Number(isoDate?.[1] ?? localizedDate?.[3]);
  const month = Number(isoDate?.[2] ?? localizedDate?.[2]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return undefined;
  }

  return {
    key: `${year}-${String(month).padStart(2, '0')}`,
    year,
    month,
  };
};

const formatViewingMonth = (month: ViewingMonth, form: keyof typeof monthNames) => {
  const name = monthNames[form][month.month - 1];
  return `${name[0].toLocaleUpperCase('ru-RU')}${name.slice(1)} ${month.year}`;
};

type ViewingMonthSectionItem = {
  key: string;
  title: string;
  movies: React.ComponentProps<typeof MovieSlider>['media'];
};

type ViewingMonthRow = {
  id: string;
  sections: ViewingMonthSectionItem[];
  layout: 'single' | 'two-left-larger' | 'two-right-larger' | 'two-equal' | 'three-equal';
};

const getViewingMonthColumnCount = (width: number): number => {
  if (width >= 1920) return 4;
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
};

const groupSectionsIntoRows = (
  sections: ViewingMonthSectionItem[],
  columnCount: number,
): ViewingMonthRow[] => {
  const rows: ViewingMonthRow[] = [];
  let currentRow: ViewingMonthSectionItem[] = [];

  const flushCurrentRow = () => {
    if (currentRow.length === 0) return;

    if (currentRow.length === 1) {
      rows.push({
        id: currentRow[0].key,
        sections: currentRow,
        layout: 'single',
      });
    } else if (currentRow.length === 2) {
      const count1 = currentRow[0].movies.length;
      const count2 = currentRow[1].movies.length;
      const layout: ViewingMonthRow['layout'] =
        columnCount >= 3
          ? count1 > count2
            ? 'two-left-larger'
            : count2 > count1
            ? 'two-right-larger'
            : 'two-equal'
          : 'two-equal';

      rows.push({
        id: `${currentRow[0].key}_${currentRow[1].key}`,
        sections: currentRow,
        layout,
      });
    } else {
      rows.push({
        id: currentRow.map((s) => s.key).join('_'),
        sections: currentRow,
        layout: 'three-equal',
      });
    }

    currentRow = [];
  };

  for (const section of sections) {
    const isInherentlyRow = section.movies.length >= 4;

    if (isInherentlyRow) {
      flushCurrentRow();
      rows.push({
        id: section.key,
        sections: [section],
        layout: 'single',
      });
    } else {
      currentRow.push(section);
      if (currentRow.length === columnCount) {
        flushCurrentRow();
      }
    }
  }

  flushCurrentRow();
  return rows;
};

const getRating = (movie: SortableMedia, ratings: MovieRatings[]) => {
  const movieTitle = (movie.excelTitle ?? movie.title ?? movie.original_title)?.trim().toLowerCase();
  const sheetRating = movieTitle
    ? ratings.find((rating) => rating.movie.trim().toLowerCase() === movieTitle)?.ratings[0]?.scores[1]
    : undefined;
  const ratingNumber = sheetRating?.replace(',', '.').match(/-?\d+(?:\.\d+)?/)?.[0];
  const parsedSheetRating = Number(ratingNumber);

  return Number.isFinite(parsedSheetRating) ? parsedSheetRating : undefined;
};

const sortMovies = <T extends SortableMedia>(movies: T[], sortOrder: SortOrder, ratings: MovieRatings[]) => {
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

    const firstRating = getRating(firstMovie, ratings);
    const secondRating = getRating(secondMovie, ratings);

    if (firstRating === undefined && secondRating === undefined) return 0;
    if (firstRating === undefined) return 1;
    if (secondRating === undefined) return -1;

    return sortOrder === 'top-rated' ? secondRating - firstRating : firstRating - secondRating;
  });
};

const parsePageFromHash = (hasAuth = true): PageMode => {
  const raw = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (raw === 'tournaments' || raw === 'tournament') return hasAuth ? 'tournaments' : 'main';
  if (raw === 'roulette') return 'roulette';
  if (raw === 'entry' || raw === 'add') return hasAuth ? 'entry' : 'main';
  return 'main';
};

function App() {
  const dispatch = useDispatch();
  const [page, setPage] = useState<PageMode>(() => parsePageFromHash(true));
  const [isAddMovieRequested, setIsAddMovieRequested] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('added');
  const [viewingFilterMode, setViewingFilterMode] = useState<ViewingFilterMode>('all');
  const [selectedViewingMonth, setSelectedViewingMonth] = useState('');
  const [viewingRangeStart, setViewingRangeStart] = useState('');
  const [viewingRangeEnd, setViewingRangeEnd] = useState('');
  const [searchAllMovies, setSearchAllMovies] = useState(false);
  const [highlightMovieTitle, setHighlightMovieTitle] = useState<string | null>(null);
  const [heroModalMovie, setHeroModalMovie] = useState<SortableMedia | null>(null);
  const [movieDatabaseSource, setMovieDatabaseSource] = useState<MovieSource>(getActiveMovieSource());

  useEffect(() => {
    detectMovieSource().then((src) => setMovieDatabaseSource(src));
    const unsubscribe = onSourceChange((src) => setMovieDatabaseSource(src));
    return unsubscribe;
  }, []);

  const searchBarValue = useSelector((state: RootState) => state.searchBarValue.value);
  const moviesFromExcel = useSelector((state: RootState) => state.setExcelMovies.value);
  const foundMovies = useSelector((state: RootState) => state.foundMovies.value);
  const isModalOpen = useSelector((state: RootState) => state.openModal.value);

  const searchValueArray = useSearchMovie(searchBarValue, searchAllMovies);

  const normalizedSearchValue = searchBarValue.trim().toLowerCase();
  const filteredSliderMovies = normalizedSearchValue
    ? foundMovies.filter((movie) => {
        if (movie.media_type === 'person') return false;
        return [movie.title, movie.original_title].some((title) =>
          title?.toLowerCase().includes(normalizedSearchValue),
        );
      })
    : foundMovies;

  const {
    login,
    logout,
    isAuthorized,
    isLoading,
    userName,
    userPicture,
    authError,
    usersRating,
    participantNames,
    saveMovie,
    updateMovie,
  } = useGetMovies();

  // Navigation with browser history support (Back / Forward button works without leaving the site)
  const navigateToPage = (newPage: PageMode, replace = false) => {
    if (!isAuthorized && newPage !== 'roulette' && newPage !== 'main') {
      login();
      return;
    }
    setPage(newPage);
    const targetHash = newPage === 'main' ? '' : `#${newPage}`;
    if (window.location.hash !== targetHash) {
      const targetUrl = window.location.pathname + window.location.search + targetHash;
      if (replace) {
        window.history.replaceState({ page: newPage }, '', targetUrl);
      } else {
        window.history.pushState({ page: newPage }, '', targetUrl);
      }
    }
  };

  // Listen to browser Back / Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const p = parsePageFromHash(isAuthorized);
      if (!isAuthorized && p !== 'roulette' && p !== 'main') {
        setPage('main');
        window.history.replaceState({ page: 'main' }, '', window.location.pathname + window.location.search);
      } else {
        setPage(p);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, [isAuthorized]);

  // Redirect away from protected pages if unauthorized after auth state resolves
  useEffect(() => {
    if (!isLoading && !isAuthorized && page !== 'roulette' && page !== 'main') {
      const timer = setTimeout(() => {
        setPage('main');
        window.history.replaceState({ page: 'main' }, '', window.location.pathname + window.location.search);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthorized, page]);

  const { isLoaded: areMoviesLoaded, loadedCount, totalCount } = useSetArrayOfSearchedMovies(
    moviesFromExcel,
    movieDatabaseSource,
  );

  const sortedFoundMovies = sortMovies(foundMovies, sortOrder, usersRating);
  const sortedFilteredMovies = sortMovies(filteredSliderMovies, sortOrder, usersRating);
  const sortedSearchMovies = sortMovies(searchValueArray?.results ?? [], sortOrder, usersRating);
  const displayedMovies =
    searchBarValue.trim() === ''
      ? sortedFoundMovies
      : searchAllMovies
      ? sortedSearchMovies
      : sortedFilteredMovies;

  const isCatalogLoading = isLoading || (moviesFromExcel.length > 0 && foundMovies.length === 0);

  const availableViewingMonths = [...new Map(
    usersRating
      .map((rating) => parseViewingMonth(rating.date))
      .filter((month): month is ViewingMonth => month !== undefined)
      .map((month): [string, ViewingMonth] => [month.key, month]),
  ).values()].sort((first, second) => first.key.localeCompare(second.key));

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

  const getMovieViewingMonth = (movie: SortableMedia) => {
    const movieTitle = (movie.excelTitle ?? movie.title ?? movie.original_title ?? movie.name)
      ?.trim()
      .toLocaleLowerCase('ru-RU');
    const matchingRating = movieTitle
      ? usersRating.find((rating) => rating.movie.trim().toLocaleLowerCase('ru-RU') === movieTitle)
      : undefined;

    return parseViewingMonth(matchingRating?.date);
  };

  const visibleViewingMonths = availableViewingMonths.filter((month) => {
    if (viewingFilterMode === 'month') {
      return month.key === activeViewingMonthKey;
    }
    if (viewingFilterMode === 'range') {
      return month.key >= activeRangeStart && month.key <= activeRangeEnd;
    }
    return true;
  });

  const groupedMoviesByViewingMonth = visibleViewingMonths
    .map((month) => ({
      month,
      movies: displayedMovies.filter((movie) => getMovieViewingMonth(movie)?.key === month.key),
    }))
    .filter((group) => group.movies.length > 0);

  const moviesWithoutViewingDate =
    viewingFilterMode === 'all' && sortOrder === 'viewing-month'
      ? displayedMovies.filter((movie) => getMovieViewingMonth(movie) === undefined)
      : [];

  const rangeStartMonth = availableViewingMonths.find((month) => month.key === activeRangeStart);
  const rangeEndMonth = availableViewingMonths.find((month) => month.key === activeRangeEnd);

  const viewingMonthGroupsRef = useRef<HTMLDivElement>(null);
  const [viewingMonthColumnCount, setViewingMonthColumnCount] = useState(3);

  const viewingMonthSections: ViewingMonthSectionItem[] = [
    ...groupedMoviesByViewingMonth.map(({ month, movies }) => ({
      key: month.key,
      title: formatViewingMonth(month, 'nominative'),
      movies,
    })),
    ...(moviesWithoutViewingDate.length > 0
      ? [
          {
            key: 'without-viewing-date',
            title: 'Дата просмотра не указана',
            movies: moviesWithoutViewingDate,
          },
        ]
      : []),
  ];

  useLayoutEffect(() => {
    if (sortOrder !== 'viewing-month' || isCatalogLoading) return;

    const element = viewingMonthGroupsRef.current;
    if (!element) return;

    const updateColumns = () => {
      const nextCount = getViewingMonthColumnCount(element.clientWidth);
      setViewingMonthColumnCount((prev) => (prev !== nextCount ? nextCount : prev));
    };

    updateColumns();
    const resizeObserver = new ResizeObserver(updateColumns);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [sortOrder, isCatalogLoading]);

  const viewingMonthRows = groupSectionsIntoRows(viewingMonthSections, viewingMonthColumnCount);

  useEffect(() => {
    if (page !== 'main' || !highlightMovieTitle || isCatalogLoading) return;

    const matchingMovie = foundMovies.some(
      (movie) =>
        movie.media_type !== 'person' &&
        movie.excelTitle?.trim().toLocaleLowerCase('ru-RU') ===
          highlightMovieTitle.trim().toLocaleLowerCase('ru-RU'),
    );

    if (!matchingMovie) return;

    const timeoutId = window.setTimeout(() => setHighlightMovieTitle(null), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [foundMovies, highlightMovieTitle, isCatalogLoading, page]);

  // Featured billboard movie (top-rated movie from club with backdrop/poster)
  const featuredMovie = useMemo<MovieMedia | null>(() => {
    if (!foundMovies || foundMovies.length === 0) return null;
    const candidates = foundMovies.filter(
      (m): m is MovieMedia => m.media_type !== 'person' && Boolean(m.backdrop_path || m.poster_path),
    );
    if (candidates.length === 0) {
      const first = foundMovies.find((m): m is MovieMedia => m.media_type !== 'person');
      return first ?? null;
    }

    const sortedByRating = [...candidates].sort((a, b) => {
      const rA = getRating(a, usersRating) ?? 0;
      const rB = getRating(b, usersRating) ?? 0;
      return rB - rA;
    });

    return sortedByRating[0] ?? null;
  }, [foundMovies, usersRating]);

  // Pages for background posters (pages 1-4 provide 80 unique popular posters, cached in localStorage)
  const [sliderPages] = useState(() => ({
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
  }));

  return (
    <div className="min-h-screen bg-[#f4f6fa] dark:bg-[#090a0f] text-slate-900 dark:text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 transition-colors duration-200">
      {/* =========================================================================
          Sticky Glassmorphic Navigation Header (Unified across all pages)
          ========================================================================= */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#090a0f]/95 border-b border-white/10 px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 text-white transition-colors">
        <div className="max-w-7xl 2xl:max-w-[1600px] min-[1920px]:max-w-[1800px] min-[2560px]:max-w-[2200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-5">
          {/* Left (Block 1): Brand Logo & Navigation Links (Fixed proportional width) */}
          <div className="flex items-center justify-between w-full md:w-auto md:w-[200px] lg:w-[240px] xl:w-[260px] gap-3 shrink-0">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => {
                  navigateToPage('main');
                  setSortOrder('added');
                  dispatch(setSearchBarValue(''));
                }}
                className="flex items-center text-left group cursor-pointer focus:outline-none shrink-0"
                title="На главную"
              >
                <Logo className="h-12 sm:h-14 md:h-[68px] lg:h-[76px] w-auto shrink-0 filter drop-shadow-[0_2px_14px_rgba(245,158,11,0.28)] group-hover:scale-105 group-hover:drop-shadow-[0_2px_22px_rgba(245,158,11,0.45)] transition-all" />
              </button>

              {/* Navigation Tab (Каталог) - ONLY visible when authorized */}
              {isAuthorized && (
                <nav className="flex items-center">
                  <button
                    onClick={() => {
                      setSortOrder('added');
                      navigateToPage('main');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      page === 'main'
                        ? 'bg-white/15 text-white shadow-sm font-bold'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Каталог
                  </button>
                </nav>
              )}
            </div>

            {/* Mobile-only right controls */}
            <div className="flex md:hidden items-center gap-2">
              <HeaderSettingsMenu
                isAuthorized={isAuthorized}
                userName={userName}
                userPicture={userPicture}
                onLogin={login}
                onLogout={() => void logout()}
                movieDatabaseSource={movieDatabaseSource}
                onSourceChange={(source) => {
                  setActiveMovieSource(source);
                  setMovieDatabaseSource(source);
                }}
              />
              <HeaderBurgerMenu
                onAddMovie={() => {
                  if (isAuthorized) {
                    navigateToPage('entry');
                    setIsAddMovieRequested(false);
                  } else {
                    setIsAddMovieRequested(true);
                    login();
                  }
                }}
                onOpenTournaments={() => {
                  if (isAuthorized) {
                    navigateToPage('tournaments');
                  } else {
                    login();
                  }
                }}
                onOpenRoulette={() => navigateToPage('roulette')}
                onOpenCatalog={() => {
                  if (isAuthorized) {
                    navigateToPage('main');
                    setSortOrder('added');
                    dispatch(setSearchBarValue(''));
                  } else {
                    login();
                  }
                }}
              />
            </div>
          </div>

          {/* Center: Integrated Search Bar (Centered between Block 1 and Block 2) */}
          {isAuthorized ? (
            <div className="flex-1 w-full min-w-0 max-w-xl lg:max-w-2xl mx-auto flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-zinc-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="search"
                  value={searchBarValue}
                  onChange={(event) => {
                    if (page !== 'main') {
                      navigateToPage('main');
                    }
                    dispatch(setSearchBarValue(event.target.value));
                  }}
                  placeholder="Поиск по названию фильма..."
                  aria-label="Поиск по названию"
                  className="w-full rounded-full bg-[#181a25] border border-white/10 pl-10 pr-9 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-inner"
                />
                {searchBarValue && (
                  <button
                    onClick={() => dispatch(setSearchBarValue(''))}
                    aria-label="Очистить поиск"
                    className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* All Database Toggle Pill */}
              <label
                htmlFor="search-all-movies"
                title={`Искать по всей базе фильмов (${movieDatabaseSource === 'tmdb' ? 'TMDB' : 'Кинопоиск'}) или только среди просмотренных клубом`}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold select-none cursor-pointer border transition-all shrink-0 ${
                  searchAllMovies
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm'
                    : 'bg-[#181a25] text-zinc-400 border-white/10 hover:text-zinc-200'
                }`}
              >
                <input
                  id="search-all-movies"
                  type="checkbox"
                  checked={searchAllMovies}
                  onChange={(event) => setSearchAllMovies(event.target.checked)}
                  className="hidden"
                />
                <span className={`w-2 h-2 rounded-full ${searchAllMovies ? 'bg-amber-500' : 'bg-zinc-600'}`} />
                <span className="hidden sm:inline">Вся база</span>
                <span className="sm:hidden">Все</span>
              </label>
            </div>
          ) : (
            <div className="hidden md:flex flex-1" />
          )}

          {/* Right (Block 2): User Avatar / Login, Gear Settings & Burger Menu (Fixed proportional width) */}
          <div className="hidden md:flex items-center justify-end w-[200px] lg:w-[240px] xl:w-[260px] gap-2 sm:gap-2.5 shrink-0">
            {isAuthorized ? (
              <div className="flex items-center gap-2 pr-1 border-r border-white/10">
                {userPicture ? (
                  <img
                    src={userPicture}
                    alt={userName || 'Аватар'}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border-2 border-amber-500/60 shadow"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400 border border-amber-500/40">
                    {userName ? userName[0].toUpperCase() : '👤'}
                  </div>
                )}
                {userName && (
                  <span className="text-xs font-semibold text-zinc-200 hidden xl:inline max-w-[110px] truncate">
                    {userName}
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={login}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 text-xs shadow-md shadow-amber-500/25 transition-all hover:scale-105 cursor-pointer shrink-0"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Войти</span>
              </button>
            )}

            {/* Gear Settings Button (Contains theme button) */}
            <HeaderSettingsMenu
              isAuthorized={isAuthorized}
              userName={userName}
              userPicture={userPicture}
              onLogin={login}
              onLogout={() => void logout()}
              movieDatabaseSource={movieDatabaseSource}
              onSourceChange={(source) => {
                setActiveMovieSource(source);
                setMovieDatabaseSource(source);
              }}
            />

            {/* Burger Menu Button (Contains Add Movie, Tournaments, Roulette) */}
            <HeaderBurgerMenu
              onAddMovie={() => {
                if (isAuthorized) {
                  navigateToPage('entry');
                  setIsAddMovieRequested(false);
                } else {
                  setIsAddMovieRequested(true);
                  login();
                }
              }}
              onOpenTournaments={() => {
                if (isAuthorized) {
                  navigateToPage('tournaments');
                } else {
                  login();
                }
              }}
              onOpenRoulette={() => navigateToPage('roulette')}
              onOpenCatalog={() => {
                if (isAuthorized) {
                  navigateToPage('main');
                  setSortOrder('added');
                  dispatch(setSearchBarValue(''));
                } else {
                  login();
                }
              }}
            />
          </div>
        </div>
      </header>

      {/* =========================================================================
          Main Content Layout
          ========================================================================= */}
      <main className="flex-1 w-full flex flex-col">
        {page === 'roulette' ? (
          <MovieRoulette
            excelMovies={foundMovies.filter((movie) => movie.media_type !== 'person') as unknown as NormalizedMovie[]}
            isAuthorized={isAuthorized}
            login={login}
            ratings={usersRating}
            participantNames={participantNames}
            onUpdateMovie={updateMovie}
            onClose={() => navigateToPage('main')}
          />
        ) : page === 'tournaments' && isAuthorized ? (
          <TournamentsPage
            onBack={() => navigateToPage('main')}
            isAuthorized={isAuthorized}
            userName={userName}
            userPicture={userPicture}
            onLogin={login}
            onLogout={logout}
          />
        ) : (page === 'entry' || (isAddMovieRequested && isAuthorized)) && isAuthorized ? (
          <div className="p-4 sm:p-6 md:p-10">
            <div className="max-w-5xl mx-auto mb-4 flex items-center justify-between">
              <button
                onClick={() => {
                  navigateToPage('main');
                  setIsAddMovieRequested(false);
                }}
                className="flex items-center gap-2 rounded-xl bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 px-4 py-2 text-sm font-semibold text-slate-800 dark:text-white transition cursor-pointer border border-slate-300/80 dark:border-white/10 shadow-xs"
              >
                <span>← Вернуться к каталогу</span>
              </button>
            </div>
            <MovieEntryPage
              participantNames={participantNames}
              onSave={saveMovie}
              onSaveSuccess={(title) => {
                setHighlightMovieTitle(title);
                dispatch(setSearchBarValue(''));
                setSearchAllMovies(false);
                navigateToPage('main');
                setIsAddMovieRequested(false);
              }}
            />
          </div>
        ) : isAuthorized ? (
          <>
            {/* -------------------------------------------------------------
                Netflix Hero Billboard Showcase (When not searching)
                ------------------------------------------------------------- */}
            {!searchBarValue.trim() && sortOrder !== 'viewing-month' && featuredMovie && (
              <div className="relative w-full h-[45vh] min-h-[22rem] max-h-[32rem] overflow-hidden bg-slate-900 dark:bg-[#0c0e17]">
                {/* Backdrop poster */}
                {featuredMovie.backdrop_path ? (
                  <img
                    src={getTmdbImageUrl('original', featuredMovie.backdrop_path)}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover object-top opacity-50 dark:opacity-40 scale-102"
                  />
                ) : featuredMovie.poster_path ? (
                  <img
                    src={getTmdbImageUrl('w1280', featuredMovie.poster_path)}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover object-center opacity-40 dark:opacity-30 blur-sm"
                  />
                ) : null}

                {/* Cinematic Vignette Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#f4f6fa] dark:from-[#090a0f] via-slate-950/70 dark:via-[#090a0f]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 dark:from-[#090a0f] via-slate-950/70 dark:via-[#090a0f]/80 to-transparent" />

                {/* Billboard Content */}
                <div className="relative z-10 h-full max-w-7xl 2xl:max-w-[1600px] min-[1920px]:max-w-[1800px] min-[2560px]:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-10">
                  <div className="max-w-2xl 2xl:max-w-3xl flex flex-col gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center gap-1 rounded-md bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30 backdrop-blur-sm">
                        <span>★</span>
                        <span>ВЫБОР КИНОКЛУБА</span>
                      </span>
                      {getRating(featuredMovie, usersRating) && (() => {
                        const score = getRating(featuredMovie, usersRating);
                        const scoreNum = typeof score === 'number' ? score : parseFloat(String(score ?? 0));
                        const badgeStyle = scoreNum < 6.0
                          ? 'bg-[#78350f]/60 text-amber-200 border-[#92400e]/70'
                          : scoreNum >= 7.5
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                        return (
                          <span className={`rounded-md px-2.5 py-0.5 text-xs font-extrabold border backdrop-blur-sm ${badgeStyle}`}>
                            Рейтинг: {score} / 10
                          </span>
                        );
                      })()}
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-none drop-shadow-md">
                      {featuredMovie.title || featuredMovie.original_title}
                    </h1>

                    {featuredMovie.overview && (
                      <p className="text-xs sm:text-sm md:text-base text-zinc-200 dark:text-zinc-300 line-clamp-3 leading-relaxed drop-shadow max-w-xl">
                        {featuredMovie.overview}
                      </p>
                    )}

                    <div className="mt-2 flex items-center gap-3">
                      <button
                        onClick={() => {
                          setHeroModalMovie(featuredMovie);
                          dispatch(openModal());
                        }}
                        className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-105 cursor-pointer"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>Подробнее и оценки</span>
                      </button>

                      <button
                        onClick={() => setPage('roulette')}
                        className="flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2.5 text-sm backdrop-blur-md transition-all cursor-pointer border border-white/20"
                      >
                        <span>🎲</span>
                        <span>Случайный фильм</span>
                      </button>

                      <button
                        onClick={() => setPage('tournaments')}
                        className="flex items-center gap-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold px-4 py-2.5 text-sm backdrop-blur-md border border-amber-500/30 transition-all cursor-pointer"
                      >
                        <span>🏆</span>
                        <span>Турниры</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                Catalog Controls Toolbar (Kinopoisk-style Filters)
                ------------------------------------------------------------- */}
            <div className="max-w-7xl 2xl:max-w-[1600px] min-[1920px]:max-w-[1800px] min-[2560px]:max-w-[2200px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-2">
              <div className="flex flex-col gap-3">
                {/* Row 1: Section Header & Count (Left) + Source Status (Right, Kinopoisk only) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {searchBarValue.trim()
                        ? 'Результаты поиска'
                        : sortOrder === 'viewing-month'
                        ? 'Архив просмотров по месяцам'
                        : 'Каталог фильмов'}
                    </h2>
                    <span className="rounded-full bg-slate-200/80 dark:bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-zinc-400">
                      {displayedMovies.length}
                    </span>
                  </div>

                  {/* Warning for Kinopoisk only; completely omitted for TMDB */}
                  {movieDatabaseSource === 'kinopoisk' && (
                    <div
                      role="status"
                      className="flex items-center gap-2 rounded-xl border border-amber-500/50 dark:border-amber-500/60 bg-amber-500/10 dark:bg-[#16120b] px-3.5 py-1.5 text-xs text-amber-800 dark:text-amber-300 shadow-sm"
                    >
                      <span className="text-sm shrink-0" aria-hidden="true">⚠️</span>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5">
                        <span className="font-bold text-amber-900 dark:text-amber-200">Источник: Кинопоиск.</span>
                        <span className="text-amber-800/90 dark:text-amber-300/85">
                          {!areMoviesLoaded && totalCount > 0
                            ? `Загрузка фильмов может занять некоторое время (${loadedCount} из ${totalCount})...`
                            : 'Загрузка с Кинопоиска медленнее из-за лимитов сервиса. Фильмы кэшируются.'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Row 2: Sort Label & Buttons (Left-aligned as in reference) */}
                <div className="flex flex-col gap-2 mt-1">
                  <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">
                    Сортировка:
                  </span>
                  <div className="flex flex-wrap gap-1 bg-slate-200/70 dark:bg-[#131520] p-1 rounded-xl border border-slate-300/60 dark:border-white/10 shadow-inner w-fit">
                    <button
                      onClick={() => setSortOrder('added')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        sortOrder === 'added'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      По добавлению
                    </button>
                    <button
                      onClick={() => setSortOrder('top-rated')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        sortOrder === 'top-rated'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      ★ Топ рейтинга
                    </button>
                    <button
                      onClick={() => setSortOrder('low-rated')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        sortOrder === 'low-rated'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Сначала худшие
                    </button>
                    <button
                      onClick={() => {
                        if (sortOrder === 'alphabetical') {
                          setSortOrder('alphabetical-reverse');
                        } else {
                          setSortOrder('alphabetical');
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        sortOrder === 'alphabetical' || sortOrder === 'alphabetical-reverse'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title={
                        sortOrder === 'alphabetical'
                          ? 'Сортировка А-Я активна. Нажмите для Я-А'
                          : sortOrder === 'alphabetical-reverse'
                          ? 'Сортировка Я-А активна. Нажмите для А-Я'
                          : 'Сортировка по алфавиту (А-Я)'
                      }
                    >
                      <span>{sortOrder === 'alphabetical-reverse' ? 'Я-А' : 'А-Я'}</span>
                      {sortOrder === 'alphabetical' ? (
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      ) : sortOrder === 'alphabetical-reverse' ? (
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : (
                        <svg
                          className="w-3.5 h-3.5 shrink-0 opacity-80"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => setSortOrder('reverse')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        sortOrder === 'reverse'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      С конца
                    </button>
                    <button
                      onClick={() => setSortOrder('viewing-month')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        sortOrder === 'viewing-month'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      По месяцам
                    </button>
                  </div>
                </div>
              </div>

              {/* Month Filtering Sub-toolbar (When sortOrder === 'viewing-month') */}
              {sortOrder === 'viewing-month' && (
                <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-[#141724] border border-slate-200 dark:border-amber-500/20 shadow-sm flex flex-wrap items-center justify-between gap-4 animate-fade-in transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      Период:
                    </span>
                    <div className="flex gap-1 bg-slate-100 dark:bg-[#0d0f17] p-1 rounded-xl border border-slate-200 dark:border-white/10">
                      <button
                        onClick={() => setViewingFilterMode('all')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          viewingFilterMode === 'all'
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Все месяцы
                      </button>
                      <button
                        disabled={availableViewingMonths.length === 0}
                        onClick={() => setViewingFilterMode('month')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          viewingFilterMode === 'month'
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-40'
                        }`}
                      >
                        Один месяц
                      </button>
                      <button
                        disabled={availableViewingMonths.length === 0}
                        onClick={() => setViewingFilterMode('range')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          viewingFilterMode === 'range'
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-40'
                        }`}
                      >
                        Диапазон
                      </button>
                    </div>
                  </div>

                  {/* Dropdowns */}
                  {viewingFilterMode === 'month' && (
                    <div className="flex items-center gap-2">
                      <label htmlFor="viewing-month-select" className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
                        Выбрать месяц:
                      </label>
                      <select
                        id="viewing-month-select"
                        value={activeViewingMonthKey}
                        onChange={(event) => setSelectedViewingMonth(event.target.value)}
                        className="rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0d0f17] px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-amber-400 shadow-sm"
                      >
                        {availableViewingMonths.map((m) => (
                          <option key={m.key} value={m.key}>
                            {formatViewingMonth(m, 'nominative')}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {viewingFilterMode === 'range' && (
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium">С:</span>
                        <select
                          value={activeRangeStart}
                          onChange={(e) => {
                            const nextStart = e.target.value;
                            setViewingRangeStart(nextStart);
                            if (nextStart > activeRangeEnd) setViewingRangeEnd(nextStart);
                          }}
                          className="rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0d0f17] px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-amber-400 shadow-sm"
                        >
                          {availableViewingMonths.map((m) => (
                            <option key={m.key} value={m.key}>
                              {formatViewingMonth(m, 'nominative')}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium">По:</span>
                        <select
                          value={activeRangeEnd}
                          onChange={(e) => {
                            const nextEnd = e.target.value;
                            setViewingRangeEnd(nextEnd);
                            if (nextEnd < activeRangeStart) setViewingRangeStart(nextEnd);
                          }}
                          className="rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0d0f17] px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-amber-400 shadow-sm"
                        >
                          {availableViewingMonths.map((m) => (
                            <option key={m.key} value={m.key}>
                              {formatViewingMonth(m, 'nominative')}
                            </option>
                          ))}
                        </select>
                      </div>
                      {rangeStartMonth && rangeEndMonth && (
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/15 dark:bg-amber-500/10 px-2.5 py-1 rounded-lg">
                          {formatViewingMonth(rangeStartMonth, 'nominative')} — {formatViewingMonth(rangeEndMonth, 'nominative')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* -------------------------------------------------------------
                Movie Content Grid / Shelves
                ------------------------------------------------------------- */}
            <div className="max-w-7xl 2xl:max-w-[1600px] min-[1920px]:max-w-[1800px] min-[2560px]:max-w-[2200px] mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16">
              {sortOrder === 'viewing-month' && !isCatalogLoading ? (
                <div
                  ref={viewingMonthGroupsRef}
                  className="flex flex-col gap-8 mt-2"
                  role="region"
                  aria-label="Фильмы по месяцам просмотра"
                  tabIndex={0}
                >
                  {viewingMonthRows.map((row) => (
                    <div key={row.id} className="flex flex-col gap-8">
                      {row.sections.map((section) => (
                        <section key={section.key} className="flex flex-col gap-3">
                          <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-white/10 transition-colors">
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                              {section.title}
                            </h3>
                            <span className="rounded-full bg-amber-500/15 dark:bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400 border border-amber-500/30">
                              {section.movies.length}
                            </span>
                          </div>
                          <MovieSlider
                            media={section.movies}
                            ratings={usersRating}
                            participantNames={participantNames}
                            onUpdateMovie={updateMovie}
                            highlightMovieTitle={highlightMovieTitle}
                          />
                        </section>
                      ))}
                    </div>
                  ))}
                  {viewingMonthRows.length === 0 && (
                    <div className="py-20 text-center text-slate-500 dark:text-zinc-400">
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">Нет фильмов за выбранный период</p>
                      <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">Попробуйте выбрать другой месяц или переключить на «Все месяцы»</p>
                    </div>
                  )}
                </div>
              ) : (
                <MovieSlider
                  media={displayedMovies}
                  ratings={usersRating}
                  participantNames={participantNames}
                  onUpdateMovie={updateMovie}
                  isLoading={isCatalogLoading}
                  highlightMovieTitle={highlightMovieTitle}
                />
              )}
            </div>
          </>
        ) : (
          /* =========================================================================
             Welcome Landing Page (Netflix / Kinopoisk Unauthenticated Hero)
             ========================================================================= */
          <div className="relative flex-1 w-full min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center px-4 py-8 lg:py-12 overflow-hidden bg-[#090a0f]">
            {/* Background Posters Mosaic (darkened in light mode for better poster visibility) */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden flex items-center justify-center opacity-40 dark:opacity-20 transition-opacity">
              <div className="flex w-[160%] -rotate-6 flex-col items-center justify-center">
                <BackgroundPosters key={sliderPages.first} page={sliderPages.first} direction={false} />
                <BackgroundPosters key={sliderPages.second} page={sliderPages.second} direction />
                <BackgroundPosters key={sliderPages.third} page={sliderPages.third} direction={false} />
                <BackgroundPosters key={sliderPages.fourth} page={sliderPages.fourth} direction />
              </div>
            </div>

            {/* Light Theme Background Darkening Overlay & Vignettes */}
            <div className="pointer-events-none absolute inset-0 bg-slate-900/[0.14] dark:bg-transparent transition-colors" />

            <div
              className="pointer-events-none absolute inset-0 transition-all duration-300 dark:hidden"
              style={{
                background:
                  'radial-gradient(circle at center, rgba(15, 23, 42, 0.05) 0%, rgba(15, 23, 42, 0.20) 55%, rgba(15, 23, 42, 0.45) 100%)',
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 transition-all duration-300 hidden dark:block"
              style={{
                background:
                  'radial-gradient(circle at center, transparent 20%, rgba(9, 10, 15, 0.75) 60%, #090a0f 100%)',
              }}
            />

            {/* 3-Column Layout: Left 2 Cards | Center Login Card | Right 2 Cards */}
            <div className="relative z-10 w-full max-w-7xl 2xl:max-w-[1600px] min-[1920px]:max-w-[1800px] min-[2560px]:max-w-[2200px] mx-auto px-2 sm:px-6 py-4 flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-5 xl:gap-7">
              {/* Left Column: 2 Cards (Equal dimensions & layout) */}
              <div className="w-full max-w-md lg:max-w-none lg:w-80 xl:w-88 flex flex-col sm:flex-row lg:flex-col justify-between gap-4 sm:gap-5 order-2 lg:order-1">
                {/* Card 1: Архив просмотров */}
                <div
                  onClick={login}
                  className="flex-1 min-h-[195px] sm:min-h-[205px] flex flex-col justify-between p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-[#12141f]/90 border border-slate-200/90 dark:border-white/10 hover:border-amber-500/40 shadow-xl backdrop-blur-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-500/10 cursor-pointer group text-left"
                >
                  <div>
                    <div className="flex items-center gap-3.5 mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform shrink-0">
                        🍿
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          Коллекция
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight truncate">
                          Архив просмотров
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                      Каталог всех сеансов киноклуба с фильтрами отображения и удобной навигацией по архиву.
                    </p>
                  </div>

                  <div className="flex justify-end mt-4">
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shadow-sm">
                      Каталог →
                    </span>
                  </div>
                </div>

                {/* Card 2: Оценки друзей */}
                <div
                  onClick={login}
                  className="flex-1 min-h-[195px] sm:min-h-[205px] flex flex-col justify-between p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-[#12141f]/90 border border-slate-200/90 dark:border-white/10 hover:border-amber-500/40 shadow-xl backdrop-blur-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-500/10 cursor-pointer group text-left"
                >
                  <div>
                    <div className="flex items-center gap-3.5 mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform shrink-0">
                        ⭐
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          Рейтинги
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight truncate">
                          Оценки друзей
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                      Честное и неподкупное мнение каждого участника, просмотревшего фильм вместе с клубом.
                    </p>
                  </div>

                  <div className="flex justify-end mt-4">
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shadow-sm">
                      Оценки →
                    </span>
                  </div>
                </div>
              </div>

              {/* Center: Main Login Modal */}
              <div className="w-full max-w-md xl:max-w-lg rounded-3xl overflow-hidden bg-white/95 dark:bg-[#12141f]/95 shadow-2xl backdrop-blur-xl flex flex-col transition-colors order-1 lg:order-2 shrink-0">
                {/* Upper Half: Always Dark (recolored into dark style as requested) */}
                <div className="relative bg-[#090a0f] px-6 py-8 sm:py-10 flex flex-col items-center justify-center overflow-hidden">
                  {/* Atmospheric gold neon glow */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="w-56 h-32 bg-amber-500/20 rounded-full blur-3xl" />
                  </div>

                  {/* Neon Club Logo */}
                  <Logo className="relative z-10 h-28 sm:h-36 w-auto shrink-0 filter drop-shadow-[0_0_35px_rgba(245,158,11,0.45)] hover:scale-105 transition-transform duration-300" />
                </div>

                {/* Lower Half: Club Title, Description, and Google Login Button */}
                <div className="flex-1 p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-5">
                  <div className="flex flex-col gap-2">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      Мелкомемье
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 max-w-sm leading-relaxed">
                      Сообщество друзей, с отборной солянкой по интересам — от просмотра кино и жарких споров, до соревнований и горечи поражения.
                    </p>
                  </div>

                  {authError && (
                    <div role="alert" className="w-full rounded-xl bg-rose-500/15 dark:bg-rose-500/20 p-3 text-xs text-rose-700 dark:text-rose-300 border border-rose-500/30">
                      {authError}
                    </div>
                  )}

                  <button
                    onClick={login}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold px-8 py-3.5 sm:py-4 text-sm sm:text-base shadow-xl shadow-amber-500/25 transition-all hover:scale-105 cursor-pointer"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Войти с помощью Google</span>
                  </button>
                </div>
              </div>

              {/* Right Column: 2 Feature Cards (Equal dimensions & layout) */}
              <div className="w-full max-w-md lg:max-w-none lg:w-80 xl:w-88 flex flex-col sm:flex-row lg:flex-col justify-between gap-4 sm:gap-5 order-3 lg:order-3">
                {/* Card 3: Кинорулетка */}
                <div
                  onClick={() => navigateToPage('roulette')}
                  className="flex-1 min-h-[195px] sm:min-h-[205px] flex flex-col justify-between p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-[#12141f]/90 border border-slate-200/90 dark:border-white/10 hover:border-indigo-500/50 shadow-xl backdrop-blur-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer group text-left"
                >
                  <div>
                    <div className="flex items-center gap-3.5 mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform shrink-0">
                        🎲
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          Интерактив
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight truncate">
                          Кинорулетка
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                      Колесо фортуны — доступно даже без входа, но тогда не будет доступен выбор ранее просмотренных фильмов киноклубом.
                    </p>
                  </div>

                  <div className="flex justify-end mt-4">
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm">
                      Крутить →
                    </span>
                  </div>
                </div>

                {/* Card 4: Турниры клуба */}
                <div
                  onClick={() => {
                    if (isAuthorized) {
                      navigateToPage('tournaments');
                    } else {
                      login();
                    }
                  }}
                  className="flex-1 min-h-[195px] sm:min-h-[205px] flex flex-col justify-between p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-[#12141f]/90 border border-slate-200/90 dark:border-white/10 hover:border-amber-500/40 shadow-xl backdrop-blur-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-500/10 cursor-pointer group text-left"
                >
                  <div>
                    <div className="flex items-center gap-3.5 mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform shrink-0">
                        🏆
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          Соревнования
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight truncate">
                          Турниры клуба
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                      Результаты турнира по Тетрису, интерактивная сетка Double Elimination и статистика участников.
                    </p>
                  </div>

                  <div className="flex justify-end mt-4">
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shadow-sm">
                      Сетка →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Hero Billboard Modal */}
      {isModalOpen && heroModalMovie && heroModalMovie.id !== undefined && (
        <Modal
          key={heroModalMovie.id}
          isHidden=""
          movie_ID={heroModalMovie.id}
          source={
            'source' in heroModalMovie && (heroModalMovie.source === 'tmdb' || heroModalMovie.source === 'kinopoisk')
              ? (heroModalMovie.source as MovieSource)
              : 'tmdb'
          }
          ratings={usersRating}
          excelMovieTitle={heroModalMovie.excelTitle}
          fallbackTitle={heroModalMovie.isExcelFallback ? heroModalMovie.title : undefined}
          participantNames={participantNames}
          onUpdateMovie={updateMovie}
          onClose={() => setHeroModalMovie(null)}
        />
      )}
    </div>
  );
}

export default App;
