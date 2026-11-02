import './App.css';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from './store/store';
import Modal from './components/Modal';
import MovieRoulette from './components/MovieRoulette';
import { TournamentsPage } from './pages/TournamentsPage';
import BookClubPage from './pages/BookClubPage';
import MovieEntryPage from './pages/MovieEntryPage';
import { setSearchBarValue } from './store/searchBar';
import { openModal } from './store/openModal';
import useGetMovies from './HooksExcelMovies/useGetMovies';
import useSearchMovie from './HooksTMDB/useSearchMovie';
import useSetArrayOfSearchedMovies from './HooksTMDB/useSetArrayOfSearchedMovies';
import {
  detectMovieSource,
  getActiveMovieSource,
  onSourceChange,
  setActiveMovieSource,
  type MovieSource,
  type NormalizedMovie,
} from './api/movieSource';
import { useAppNavigation } from './hooks/useAppNavigation';
import { checkIsMobileDevice } from './hooks/useBookClub';
import {
  useCatalogMovies,
  type SortOrder,
  type ViewingFilterMode,
  type SortableMedia,
  type MovieMedia,
} from './hooks/useCatalogMovies';
import { useBodyScrollLock } from './hooks/useBodyScrollLock';
import { AppHeader } from './components/layout/AppHeader';
import { HeroBillboard } from './components/catalog/HeroBillboard';
import { CatalogToolbar } from './components/catalog/CatalogToolbar';
import { CatalogContent } from './components/catalog/CatalogContent';
import { WelcomeLanding } from './components/landing/WelcomeLanding';
import { getMovieNumericRating } from './utils/ratings';

function App() {
  const dispatch = useDispatch();

  const [sortOrder, setSortOrder] = useState<SortOrder>('added');
  const [viewingFilterMode, setViewingFilterMode] = useState<ViewingFilterMode>('all');
  const [selectedViewingMonth, setSelectedViewingMonth] = useState('');
  const [viewingRangeStart, setViewingRangeStart] = useState('');
  const [viewingRangeEnd, setViewingRangeEnd] = useState('');
  const [searchAllMovies, setSearchAllMovies] = useState(false);
  const [highlightMovieTitle, setHighlightMovieTitle] = useState<string | null>(null);
  const [heroModalMovie, setHeroModalMovie] = useState<SortableMedia | null>(null);
  const [movieDatabaseSource, setMovieDatabaseSource] = useState<MovieSource>(getActiveMovieSource());

  const searchBarValue = useSelector((state: RootState) => state.searchBarValue.value);
  const moviesFromExcel = useSelector((state: RootState) => state.setExcelMovies.value);
  const foundMovies = useSelector((state: RootState) => state.foundMovies.value);
  const isModalOpen = useSelector((state: RootState) => state.openModal.value);

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

  const {
    page,
    currentDisplayedPage,
    isAddMovieRequested,
    setIsAddMovieRequested,
    navigateToPage,
  } = useAppNavigation({ isAuthorized, login });

  // Lock window scroll when viewing the book club on desktop/laptops (not on mobile)
  const [isMobileDevice, setIsMobileDevice] = useState(() =>
    typeof window !== 'undefined' ? checkIsMobileDevice() : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobileDevice(checkIsMobileDevice());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useBodyScrollLock(page === 'book-club' && !isMobileDevice);

  useEffect(() => {
    detectMovieSource().then((src) => setMovieDatabaseSource(src));
    const unsubscribe = onSourceChange((src) => setMovieDatabaseSource(src));
    return unsubscribe;
  }, []);

  const searchValueArray = useSearchMovie(searchBarValue, searchAllMovies);

  const { isLoaded: areMoviesLoaded, loadedCount, totalCount } = useSetArrayOfSearchedMovies(
    moviesFromExcel,
    movieDatabaseSource
  );

  const isCatalogLoading = isLoading || (moviesFromExcel.length > 0 && foundMovies.length === 0);

  const {
    ratingsMap,
    displayedMovies,
    availableViewingMonths,
    activeViewingMonthKey,
    activeRangeStart,
    activeRangeEnd,
    rangeStartMonth,
    rangeEndMonth,
    viewingMonthSections,
    featuredMovie,
  } = useCatalogMovies({
    foundMovies,
    searchBarValue,
    searchAllMovies,
    searchResults: searchValueArray?.results,
    sortOrder,
    usersRating,
    viewingFilterMode,
    selectedViewingMonth,
    viewingRangeStart,
    viewingRangeEnd,
  });

  // Highlight added movie briefly
  useEffect(() => {
    if (page !== 'main' || !highlightMovieTitle || isCatalogLoading) return;

    const matchingMovie = foundMovies.some(
      (movie) =>
        movie.media_type !== 'person' &&
        movie.excelTitle?.trim().toLocaleLowerCase('ru-RU') ===
          highlightMovieTitle.trim().toLocaleLowerCase('ru-RU')
    );

    if (!matchingMovie) return;

    const timeoutId = window.setTimeout(() => setHighlightMovieTitle(null), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [foundMovies, highlightMovieTitle, isCatalogLoading, page]);

  const activeHeroModalMovie = isModalOpen ? heroModalMovie : null;

  return (
    <div
      className={`bg-[#f4f6fa] dark:bg-[#090a0f] text-slate-900 dark:text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 transition-colors duration-200 ${
        page === 'book-club'
          ? 'min-h-screen md:h-screen md:max-h-screen md:overflow-hidden'
          : 'min-h-screen'
      }`}
    >
      <AppHeader
        currentDisplayedPage={currentDisplayedPage}
        isAuthorized={isAuthorized}
        userName={userName}
        userPicture={userPicture}
        searchBarValue={searchBarValue}
        searchAllMovies={searchAllMovies}
        movieDatabaseSource={movieDatabaseSource}
        onNavigateToPage={navigateToPage}
        onResetCatalog={() => {
          navigateToPage('main');
          setSortOrder('added');
          dispatch(setSearchBarValue(''));
        }}
        onSearchChange={(val) => {
          if (page !== 'main') {
            navigateToPage('main');
          }
          dispatch(setSearchBarValue(val));
        }}
        onClearSearch={() => dispatch(setSearchBarValue(''))}
        onToggleSearchAllMovies={(checked) => setSearchAllMovies(checked)}
        onLogin={login}
        onLogout={() => void logout()}
        onSourceChange={(source) => {
          setActiveMovieSource(source);
          setMovieDatabaseSource(source);
        }}
      />

      <main className={`flex-1 w-full flex flex-col ${page === 'book-club' ? 'min-h-0 md:overflow-hidden' : ''}`}>
        {page === 'roulette' ? (
          <MovieRoulette
            excelMovies={isAuthorized ? (foundMovies.filter((movie) => movie.media_type !== 'person') as unknown as NormalizedMovie[]) : []}
            isAuthorized={isAuthorized}
            login={login}
            ratings={isAuthorized ? usersRating : []}
            participantNames={isAuthorized ? participantNames : []}
            onUpdateMovie={updateMovie}
            onClose={() => navigateToPage('main')}
          />
        ) : isAuthorized && page === 'tournaments' ? (
          <TournamentsPage
            onBack={() => navigateToPage('main')}
            isAuthorized={isAuthorized}
            userName={userName}
            userPicture={userPicture}
            onLogin={login}
            onLogout={logout}
          />
        ) : (isAuthorized || import.meta.env.DEV) && page === 'book-club' ? (
          <BookClubPage
            onBack={() => navigateToPage('main')}
            isAuthorized={isAuthorized}
            userName={userName}
            userPicture={userPicture}
          />
        ) : isAuthorized && (page === 'entry' || (isAddMovieRequested && isAuthorized)) ? (
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
            {!searchBarValue.trim() && sortOrder !== 'viewing-month' && featuredMovie && (
              <HeroBillboard
                featuredMovie={featuredMovie}
                numericRating={getMovieNumericRating(featuredMovie, ratingsMap)}
                onOpenModal={(movie: MovieMedia) => {
                  setHeroModalMovie(movie);
                  dispatch(openModal());
                }}
              />
            )}

            <CatalogToolbar
              searchBarValue={searchBarValue}
              sortOrder={sortOrder}
              onSetSortOrder={setSortOrder}
              displayedMoviesCount={displayedMovies.length}
              movieDatabaseSource={movieDatabaseSource}
              areMoviesLoaded={areMoviesLoaded}
              loadedCount={loadedCount}
              totalCount={totalCount}
              availableViewingMonths={availableViewingMonths}
              viewingFilterMode={viewingFilterMode}
              onSetViewingFilterMode={setViewingFilterMode}
              activeViewingMonthKey={activeViewingMonthKey}
              onSelectViewingMonth={setSelectedViewingMonth}
              activeRangeStart={activeRangeStart}
              onSetViewingRangeStart={setViewingRangeStart}
              activeRangeEnd={activeRangeEnd}
              onSetViewingRangeEnd={setViewingRangeEnd}
              rangeStartMonth={rangeStartMonth}
              rangeEndMonth={rangeEndMonth}
            />

            <CatalogContent
              sortOrder={sortOrder}
              isCatalogLoading={isCatalogLoading}
              viewingMonthSections={viewingMonthSections}
              displayedMovies={displayedMovies}
              usersRating={usersRating}
              participantNames={participantNames}
              updateMovie={updateMovie}
              highlightMovieTitle={highlightMovieTitle}
            />
          </>
        ) : (
          <WelcomeLanding
            login={login}
            authError={authError}
            isAuthorized={isAuthorized}
            onNavigateToPage={navigateToPage}
          />
        )}
      </main>

      {activeHeroModalMovie && activeHeroModalMovie.id !== undefined && (
        <Modal
          key={activeHeroModalMovie.id}
          isHidden=""
          movie_ID={activeHeroModalMovie.id}
          source={
            'source' in activeHeroModalMovie && (activeHeroModalMovie.source === 'tmdb' || activeHeroModalMovie.source === 'kinopoisk')
              ? (activeHeroModalMovie.source as MovieSource)
              : 'tmdb'
          }
          ratings={usersRating}
          excelMovieTitle={activeHeroModalMovie.excelTitle}
          fallbackTitle={activeHeroModalMovie.isExcelFallback ? activeHeroModalMovie.title : undefined}
          participantNames={participantNames}
          onUpdateMovie={updateMovie}
          onClose={() => setHeroModalMovie(null)}
        />
      )}
    </div>
  );
}

export default App;
