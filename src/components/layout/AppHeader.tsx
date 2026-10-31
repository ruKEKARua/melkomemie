import Logo from '../UI/Logo';
import HeaderPageSelector, { type PageMode } from '../UI/HeaderPageSelector';
import HeaderSettingsMenu from '../UI/HeaderSettingsMenu';
import type { MovieSource } from '../../api/movieSource';

interface AppHeaderProps {
  currentDisplayedPage: PageMode;
  isAuthorized: boolean;
  userName?: string;
  userPicture?: string;
  searchBarValue: string;
  searchAllMovies: boolean;
  movieDatabaseSource: MovieSource;
  onNavigateToPage: (page: PageMode) => void;
  onResetCatalog: () => void;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onToggleSearchAllMovies: (checked: boolean) => void;
  onLogin: () => void;
  onLogout: () => void;
  onSourceChange: (source: MovieSource) => void;
}

export const AppHeader = ({
  currentDisplayedPage,
  isAuthorized,
  userName,
  userPicture,
  searchBarValue,
  searchAllMovies,
  movieDatabaseSource,
  onNavigateToPage,
  onResetCatalog,
  onSearchChange,
  onClearSearch,
  onToggleSearchAllMovies,
  onLogin,
  onLogout,
  onSourceChange,
}: AppHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#090a0f]/95 border-b border-white/10 px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 text-white transition-colors">
      <div className="max-w-7xl 2xl:max-w-[1600px] min-[1920px]:max-w-[1800px] min-[2560px]:max-w-[2200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-5">
        {/* Left (Block 1): Brand Logo, Burger Menu & Navigation Links (Fixed proportional width) */}
        <div className="flex items-center justify-between w-full md:w-auto md:min-w-[240px] lg:min-w-[270px] xl:min-w-[290px] gap-3 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onResetCatalog}
              className="flex items-center text-left group cursor-pointer focus:outline-none shrink-0"
              title="На главную"
            >
              <Logo className="h-12 sm:h-14 md:h-[68px] lg:h-[76px] w-auto shrink-0 filter drop-shadow-[0_2px_14px_rgba(245,158,11,0.28)] group-hover:scale-105 group-hover:drop-shadow-[0_2px_22px_rgba(245,158,11,0.45)] transition-all" />
            </button>

            {/* Page Selector */}
            <HeaderPageSelector
              currentPage={currentDisplayedPage}
              isAuthorized={isAuthorized}
              onSelectCatalog={onResetCatalog}
              onSelectTournaments={() => onNavigateToPage('tournaments')}
              onSelectRoulette={() => onNavigateToPage('roulette')}
              onSelectBookClub={() => onNavigateToPage('book-club')}
              onSelectAddMovie={() => onNavigateToPage('entry')}
            />
          </div>

          {/* Mobile-only right controls */}
          <div className="flex md:hidden items-center gap-2">
            <HeaderSettingsMenu
              isAuthorized={isAuthorized}
              userName={userName}
              userPicture={userPicture}
              onLogin={onLogin}
              onLogout={onLogout}
              movieDatabaseSource={movieDatabaseSource}
              onSourceChange={onSourceChange}
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
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Поиск по названию фильма..."
                aria-label="Поиск по названию"
                className="w-full rounded-full bg-[#181a25] border border-white/10 pl-10 pr-9 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-inner"
              />
              {searchBarValue && (
                <button
                  onClick={onClearSearch}
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
                onChange={(event) => onToggleSearchAllMovies(event.target.checked)}
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

        {/* Right (Block 2): User Avatar / Login & Gear Settings (Fixed proportional width) */}
        <div className="hidden md:flex items-center justify-end md:min-w-[150px] lg:min-w-[180px] xl:min-w-[200px] gap-2 sm:gap-2.5 shrink-0">
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
              onClick={onLogin}
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

          {/* Gear Settings Button */}
          <HeaderSettingsMenu
            isAuthorized={isAuthorized}
            userName={userName}
            userPicture={userPicture}
            onLogin={onLogin}
            onLogout={onLogout}
            movieDatabaseSource={movieDatabaseSource}
            onSourceChange={onSourceChange}
          />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
