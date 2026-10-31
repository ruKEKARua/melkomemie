import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { searchMoviesFromSource } from '../api/movieSource';
import Button from './UI/Button';
import { getMovieImageUrl } from '../api/tmdbImage';
import Modal from './Modal';
import { openModal } from '../store/openModal';
import type { RootState } from '../store/store';
import type { MovieRatings } from '../HooksExcelMovies/useGetMovies';
import type { MovieSheetEntry } from '../api/googleSheets';
import { useTheme } from '../utils/theme';
import {
  movieKey,
  movieTitle,
  isTextMovie,
  type RouletteMode,
  type RouletteSource,
  type RouletteMovie,
  type MovieRouletteMovie,
  type TextRouletteMovie,
} from '../utils/roulette';
import { useRouletteWheel } from '../hooks/useRouletteWheel';
import { RouletteWheel } from './roulette/RouletteWheel';

type MovieRouletteProps = {
  excelMovies: RouletteMovie[];
  isAuthorized: boolean;
  login: () => void;
  ratings: MovieRatings[];
  participantNames: string[];
  onUpdateMovie: (entry: MovieSheetEntry) => Promise<void>;
  onClose: () => void;
};

const STORAGE_KEY = 'user_image_key';

const MovieRoulette = ({
  excelMovies,
  isAuthorized,
  login,
  ratings,
  participantNames,
  onUpdateMovie,
  onClose,
}: MovieRouletteProps) => {
  const dispatch = useDispatch();
  const { isDark } = useTheme();
  const isModalOpen = useSelector((state: RootState) => state.openModal.value);
  const [source, setSource] = useState<RouletteSource>('online');
  const [mode, setMode] = useState<RouletteMode>('elimination');
  const [query, setQuery] = useState('');
  const [textValue, setTextValue] = useState('');
  const [onlineResults, setOnlineResults] = useState<RouletteMovie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedMovies, setSelectedMovies] = useState<RouletteMovie[]>([]);
  const [modalMovie, setModalMovie] = useState<RouletteMovie | null>(null);

  const canStart = selectedMovies.length > 0 && (mode === 'winner' || selectedMovies.length > 1);

  const {
    rotation,
    spinning,
    spinDurationMs,
    setSpinDurationMs,
    spinTurns,
    setSpinTurns,
    eliminatingMovie,
    winner,
    setWinner,
    lastEliminated,
    spin,
    handleWheelTransitionEnd,
    resetWheel,
  } = useRouletteWheel({
    selectedMovies,
    setSelectedMovies,
    mode,
    canStart,
  });

  const [userImage, setUserImage] = useState<string>(() => {
    return (
      localStorage.getItem(STORAGE_KEY) ||
      'https://static2.klipy.com/ii/d7aec6f6f171607374b2065c836f92f4/25/92/ydTYzr90.gif'
    );
  });

  const updateAndSaveImage = (value: string) => {
    setUserImage(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
      console.error('Ошибка сохранения в localStorage:', error);
    }
  };

  const handleImageChange = (fileOrText: File | string) => {
    if (!fileOrText) return;

    if (fileOrText instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const resultUrl = e.target?.result as string;
        if (resultUrl) {
          updateAndSaveImage(resultUrl);
        }
      };
      reader.readAsDataURL(fileOrText);
    } else if (typeof fileOrText === 'string') {
      updateAndSaveImage(fileOrText);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageChange(file);
    }
  };

  useEffect(() => {
    if (source !== 'online' || !query.trim()) {
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      setIsSearching(true);
      setSearchError('');
      searchMoviesFromSource(query.trim())
        .then((movies) => {
          if (!cancelled) setOnlineResults(movies);
        })
        .catch(() => {
          if (!cancelled) {
            setOnlineResults([]);
            setSearchError(
              'Не удалось выполнить поиск. Проверьте доступность TMDB или Kinopoisk.'
            );
          }
        })
        .finally(() => {
          if (!cancelled) setIsSearching(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [query, source]);

  const selectedKeys = useMemo(
    () => new Set(selectedMovies.map(movieKey)),
    [selectedMovies]
  );

  const availableMovies = useMemo(() => {
    if (source === 'text') return [];
    if (source === 'online') return query.trim() ? onlineResults : [];
    if (!isAuthorized && source === 'excel') return [];

    const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU');
    if (!normalizedQuery) return excelMovies;

    return excelMovies.filter((movie) =>
      [movieTitle(movie), movie.original_title].some((title) =>
        title.toLocaleLowerCase('ru-RU').includes(normalizedQuery)
      )
    );
  }, [excelMovies, isAuthorized, onlineResults, query, source]);

  const addMovie = (movie: RouletteMovie) => {
    if (!spinning && !selectedKeys.has(movieKey(movie))) {
      setSelectedMovies((current) => [...current, movie]);
      setWinner(null);
    }
  };

  const addText = () => {
    const text = textValue.trim();
    if (spinning || !text) return;

    const textMovie: TextRouletteMovie = {
      id: `${Date.now()}-${text}`,
      title: text,
      original_title: text,
      source: 'text',
      text,
    };

    setSelectedMovies((current) => [...current, textMovie]);
    setTextValue('');
    setWinner(null);
  };

  const removeMovie = (key: string) => {
    if (spinning) return;
    setSelectedMovies((current) =>
      current.filter((movie) => movieKey(movie) !== key)
    );
    setWinner(null);
  };

  const reset = () => {
    if (spinning) return;
    resetWheel();
    setSelectedMovies([]);
    setModalMovie(null);
  };

  const posterUrl = (movie: MovieRouletteMovie) =>
    getMovieImageUrl(movie.poster_path, 'w185');

  const openMovieModal = (movie: MovieRouletteMovie) => {
    setModalMovie(movie);
    dispatch(openModal());
  };

  return (
    <main className="roulette-page">
      <div className="w-full max-w-[105rem] mx-auto flex flex-col">
        <header className="roulette-header w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-200 dark:border-white/10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
              КИНОКЛУБ / СЛУЧАЙНЫЙ ВЫБОР
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Рулетка фильмов
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="relative inline-flex items-center justify-center gap-2 cursor-pointer rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-white transition shadow-sm">
              <svg
                className="w-4 h-4 text-amber-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              <span>Сменить картинку в центре колеса</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="sr-only"
              />
            </label>
            <button
              onClick={onClose}
              className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <span>← В каталог</span>
            </button>
          </div>
        </header>

        <div className="roulette-layout">
          <section className="roulette-controls" aria-label="Настройки рулетки">
            <div className="roulette-control-group">
              <span className="roulette-label">Источник фильмов</span>
              <div className="roulette-segmented">
                <button
                  disabled={spinning}
                  className={`${source === 'excel' ? 'is-active' : ''} roulette-excel-button`}
                  onClick={() => setSource('excel')}
                >
                  Excel
                </button>
                <button
                  disabled={spinning}
                  className={`${source === 'online' ? 'is-active' : ''} roulette-tmdb-button`}
                  onClick={() => setSource('online')}
                >
                  TMDB / Kinopoisk
                </button>
                <button
                  disabled={spinning}
                  className={`${source === 'text' ? 'is-active' : ''} roulette-text-button`}
                  onClick={() => setSource('text')}
                >
                  Просто текст
                </button>
              </div>
            </div>

            <div className="roulette-control-group">
              <span className="roulette-label">Режим</span>
              <div className="roulette-segmented">
                <button
                  disabled={spinning}
                  className={mode === 'elimination' ? 'is-active' : ''}
                  onClick={() => {
                    setMode('elimination');
                    setWinner(null);
                  }}
                >
                  На выбывание
                </button>
                <button
                  disabled={spinning}
                  className={mode === 'winner' ? 'is-active' : ''}
                  onClick={() => {
                    setMode('winner');
                    setWinner(null);
                  }}
                >
                  На победу
                </button>
              </div>
            </div>

            <div className="roulette-control-group roulette-strength-controls">
              <span className="roulette-label">Сила вращения</span>
              <label className="roulette-range-label" htmlFor="roulette-turns">
                Обороты <output>{spinTurns}</output>
              </label>
              <input
                id="roulette-turns"
                className="roulette-range"
                type="range"
                min="2"
                max="12"
                step="1"
                value={spinTurns}
                disabled={spinning}
                onChange={(event) => setSpinTurns(Number(event.target.value))}
              />
              <label
                className="roulette-range-label"
                htmlFor="roulette-duration"
              >
                Длительность{' '}
                <output>{(spinDurationMs / 1000).toFixed(1)} с</output>
              </label>
              <input
                id="roulette-duration"
                className="roulette-range"
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={spinDurationMs / 1000}
                disabled={spinning}
                onChange={(event) =>
                  setSpinDurationMs(Number(event.target.value) * 1000)
                }
              />
            </div>

            {source === 'text' ? (
              <form
                className="roulette-text-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  addText();
                }}
              >
                <label className="roulette-label" htmlFor="roulette-text">
                  Текст участника
                </label>
                <textarea
                  id="roulette-text"
                  className="roulette-search roulette-text-input"
                  value={textValue}
                  onChange={(event) => setTextValue(event.target.value)}
                  placeholder="Например: Посмотреть сериал"
                  rows={3}
                />
                <button type="submit" className="roulette-login-button">
                  Добавить в колесо
                </button>
              </form>
            ) : (
              <>
                <label className="roulette-label" htmlFor="roulette-search">
                  Поиск по названию
                </label>
                <input
                  id="roulette-search"
                  className="roulette-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Например: Интерстеллар"
                />
                {isSearching && <p className="roulette-hint">Ищем фильм...</p>}
                {searchError && (
                  <p className="roulette-error">{searchError}</p>
                )}
              </>
            )}

            <div className="roulette-results">
              {source === 'excel' && !isAuthorized && (
                <div className="roulette-login-notice">
                  <p>Войдите, чтобы выбрать просмотренные фильмы</p>
                  <Button
                    label="Авторизоваться"
                    onClick={login}
                    className="roulette-login-button"
                  />
                </div>
              )}
              {availableMovies
                .filter((movie) => !selectedKeys.has(movieKey(movie)))
                .map((movie) => {
                  const key = movieKey(movie);
                  return (
                    <button
                      key={key}
                      className="roulette-result"
                      onClick={() => addMovie(movie)}
                    >
                      <span className="roulette-result-title">
                        {!isTextMovie(movie) && posterUrl(movie) && (
                          <img src={posterUrl(movie)} alt="" />
                        )}
                        {movieTitle(movie)}
                      </span>
                      <small>
                        {movie.source === 'kinopoisk'
                          ? 'Kinopoisk'
                          : source === 'excel'
                          ? 'Excel'
                          : 'TMDB'}
                      </small>
                    </button>
                  );
                })}
              {source !== 'text' && !isSearching && availableMovies.length === 0 && (
                <p className="roulette-hint">
                  {source === 'online' && !query.trim()
                    ? 'Введите название фильма для поиска'
                    : 'Фильмы не найдены'}
                </p>
              )}
            </div>
          </section>

          <section className="roulette-stage" aria-live="polite">
            <div className="roulette-board">
              <RouletteWheel
                selectedMovies={selectedMovies}
                spinning={spinning}
                rotation={rotation}
                spinDurationMs={spinDurationMs}
                isDark={isDark}
                eliminatingMovie={eliminatingMovie}
                userImage={userImage}
                canStart={canStart}
                mode={mode}
                onSpin={spin}
                onWheelTransitionEnd={handleWheelTransitionEnd}
                onOpenModal={openMovieModal}
                posterUrl={posterUrl}
              />

              <aside
                className="roulette-chips"
                aria-label="Список выбранных фильмов"
              >
                <div className="roulette-stage-heading">
                  <div>
                    <span className="roulette-label">Участники</span>
                    <h3>
                      {selectedMovies.length}{' '}
                      {selectedMovies.length === 1 ? 'фильм' : 'фильмов'} в
                      рулетке
                    </h3>
                  </div>
                  <Button
                    label="Очистить"
                    onClick={reset}
                    className="roulette-ghost-button"
                  />
                </div>
                <span className="roulette-label">Фильмы в рулетке</span>
                {lastEliminated && (
                  <button
                    className="roulette-eliminated"
                    onClick={() => {
                      if (!isTextMovie(lastEliminated))
                        openMovieModal(lastEliminated);
                    }}
                  >
                    {!isTextMovie(lastEliminated) && (
                      <img src={posterUrl(lastEliminated)} alt="" />
                    )}
                    <span>
                      Выбыл: <strong>{movieTitle(lastEliminated)}</strong>
                    </span>
                  </button>
                )}
                {selectedMovies.map((movie) => (
                  <div className="roulette-chip" key={movieKey(movie)}>
                    <button
                      aria-label={`Убрать ${movieTitle(movie)}`}
                      onClick={() => removeMovie(movieKey(movie))}
                    >
                      ×
                    </button>
                    <span>{movieTitle(movie)}</span>
                  </div>
                ))}
                {selectedMovies.length === 0 && (
                  <p className="roulette-empty">
                    Добавьте фильмы, чтобы начать вращение.
                  </p>
                )}
              </aside>
            </div>

            {mode === 'elimination' &&
              selectedMovies.length === 1 &&
              !winner && (
                <p className="roulette-hint">
                  {movieTitle(selectedMovies[0])} последний в списке и
                  становится победителем.
                </p>
              )}
          </section>
        </div>
      </div>
      {isModalOpen && modalMovie && !isTextMovie(modalMovie) && (
        <Modal
          isHidden=""
          movie_ID={modalMovie.id}
          source={modalMovie.source}
          ratings={ratings}
          excelMovieTitle={modalMovie.excelTitle}
          fallbackTitle={
            modalMovie.isExcelFallback ? movieTitle(modalMovie) : undefined
          }
          participantNames={participantNames}
          onUpdateMovie={onUpdateMovie}
        />
      )}
    </main>
  );
};

export default MovieRoulette;
