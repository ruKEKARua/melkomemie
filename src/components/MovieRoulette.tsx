import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { searchMoviesFromSource, type NormalizedMovie } from '../api/movieSource';
import Button from './UI/Button';
import { getMovieImageUrl } from '../api/tmdbImage';
import Modal from './Modal';
import { openModal } from '../store/openModal';
import type { RootState } from '../store/store';
import type { MovieRatings } from '../HooksExcelMovies/useGetMovies';
import type { MovieSheetEntry } from '../api/googleSheets';
import { useTheme } from '../utils/theme';

type RouletteMode = 'elimination' | 'winner';
type RouletteSource = 'excel' | 'online' | 'text';

type MovieRouletteMovie = NormalizedMovie & {
    excelTitle?: string;
};

type TextRouletteMovie = {
    id: string;
    title: string;
    original_title: string;
    source: 'text';
    text: string;
};

type RouletteMovie = MovieRouletteMovie | TextRouletteMovie;

type MovieRouletteProps = {
    excelMovies: RouletteMovie[];
    isAuthorized: boolean;
    login: () => void;
    ratings: MovieRatings[];
    participantNames: string[];
    onUpdateMovie: (entry: MovieSheetEntry) => Promise<void>;
    onClose: () => void;
};

const randomIndex = (length: number) => {
    if (length < 1) {
        throw new Error('Нельзя выбрать фильм из пустого массива');
    }

    const maxUint32 = 0x100000000;
    const limit = maxUint32 - (maxUint32 % length);
    const buffer = new Uint32Array(1);

    do {
        crypto.getRandomValues(buffer);
    } while (buffer[0] >= limit);

    return buffer[0] % length;
};

const randomFraction = () => {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] / 0x100000000;
};

const movieTitle = (movie: RouletteMovie) => movie.title || movie.original_title || 'Без названия';

const movieKey = (movie: RouletteMovie) => `${movie.source}-${movie.id}-${'excelTitle' in movie ? movie.excelTitle ?? '' : ''}`;
const isTextMovie = (movie: RouletteMovie): movie is TextRouletteMovie => movie.source === 'text';
const wheelColorsDark = ['#131622', '#1a1f2e', '#161b28'];
const wheelColorsLight = ['#ffffff', '#f1f5f9', '#e2e8f0'];
const wheelDivider = 'rgba(245, 158, 11, 0.45)';
const wheelDividerAngle = 0.35;

const getWheelBackground = (movieCount: number, isDark = true) => {
    const colors = isDark ? wheelColorsDark : wheelColorsLight;
    if (movieCount <= 1) {
        return `conic-gradient(${colors[0]} 0deg 360deg)`;
    }

    const sectorAngle = 360 / movieCount;
    const isOdd = movieCount % 2 === 1;
    const stops = Array.from({ length: movieCount }, (_, index) => {
        const start = index * sectorAngle;
        const end = (index + 1) * sectorAngle;
        const dividerStart = Math.max(start, end - wheelDividerAngle);
        const color = isOdd && index === movieCount - 1
            ? colors[2]
            : colors[index % 2];
        return `${color} ${start}deg ${dividerStart}deg, ${wheelDivider} ${dividerStart}deg ${end}deg`;
    });

    return `conic-gradient(from ${-sectorAngle / 2}deg, ${stops.join(', ')})`;
};

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
    const [winner, setWinner] = useState<RouletteMovie | null>(null);
    const [lastEliminated, setLastEliminated] = useState<RouletteMovie | null>(null);
    const [modalMovie, setModalMovie] = useState<RouletteMovie | null>(null);
    const [rotation, setRotation] = useState(0);
    const [spinning, setSpinning] = useState(false);
    const [pendingIndex, setPendingIndex] = useState<number | null>(null);
    const [spinDurationMs, setSpinDurationMs] = useState(10200);
    const [spinTurns, setSpinTurns] = useState(5);
    const [eliminatingMovie, setEliminatingMovie] = useState<RouletteMovie | null>(null);
    const eliminationTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (eliminationTimeoutRef.current !== null) {
                window.clearTimeout(eliminationTimeoutRef.current);
            }
        };
    }, []);

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
                        setSearchError('Не удалось выполнить поиск. Проверьте доступность TMDB или Kinopoisk.');
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

    const selectedKeys = new Set(selectedMovies.map(movieKey));

    const availableMovies = useMemo(() => {
        if (source === 'text') return [];
        if (source === 'online') return query.trim() ? onlineResults : [];

        const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU');
        if (!normalizedQuery) return excelMovies;

        return excelMovies.filter((movie) => [movieTitle(movie), movie.original_title]
            .some((title) => title.toLocaleLowerCase('ru-RU').includes(normalizedQuery)));
    }, [excelMovies, onlineResults, query, source]);
    const canStart = selectedMovies.length > 0 && (mode === 'winner' || selectedMovies.length > 1);

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
        setSelectedMovies((current) => current.filter((movie) => movieKey(movie) !== key));
        setWinner(null);
    };

    const spin = () => {
        if (!canStart || spinning) return;
        if (eliminationTimeoutRef.current !== null) {
            window.clearTimeout(eliminationTimeoutRef.current);
            eliminationTimeoutRef.current = null;
        }

        const index = randomIndex(selectedMovies.length);
        const sectorAngle = 360 / selectedMovies.length;
        const availableAngle = Math.max(0, sectorAngle - wheelDividerAngle - 1);
        const randomOffset = (randomFraction() - 0.5) * availableAngle * 0.7;
        const chosenAngle = index * sectorAngle + randomOffset;
        const targetAngle = ((360 - chosenAngle) % 360 + 360) % 360;

        setPendingIndex(index);
        setSpinning(true);
        setLastEliminated(null);
        setEliminatingMovie(null);
        setWinner(null);
        setRotation((current) => {
            const currentAngle = ((current % 360) + 360) % 360;
            const rotationToTarget = (targetAngle - currentAngle + 360) % 360;
            return current + spinTurns * 360 + rotationToTarget;
        });
    };

    const finishSpin = () => {
        if (pendingIndex === null) return;

        const chosenMovie = selectedMovies[pendingIndex];
        if (!chosenMovie) {
            setPendingIndex(null);
            setSpinning(false);
            return;
        }

        if (mode === 'winner') {
            setWinner(chosenMovie);
            setPendingIndex(null);
            setSpinning(false);
        } else {
            // Режим на выбывание:
            // 1. Стрелка остановилась точно на выбранном фильме (он прямо под указателем).
            // Фиксируем его как выбывший фильм и подсвечиваем на колесе.
            setLastEliminated(chosenMovie);
            setEliminatingMovie(chosenMovie);

            // 2. Даем пользователю время увидеть, на какой фильм попала стрелка,
            // после чего удаляем фильм из активного состава колеса.
            eliminationTimeoutRef.current = window.setTimeout(() => {
                setSelectedMovies((current) => {
                    const remaining = current.filter((m) => movieKey(m) !== movieKey(chosenMovie));
                    if (remaining.length === 1) {
                        setWinner(remaining[0]);
                    }
                    return remaining;
                });
                setEliminatingMovie(null);
                setPendingIndex(null);
                setSpinning(false);
                eliminationTimeoutRef.current = null;
            }, 1400);
        }
    };

    const handleWheelTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
        // Игнорируем события от дочерних элементов (постеров, кнопок и т.д.)
        if (event.target !== event.currentTarget) return;
        if (event.propertyName !== 'transform') return;
        if (!spinning) return;
        finishSpin();
    };

    const reset = () => {
        if (spinning) return;
        if (eliminationTimeoutRef.current !== null) {
            window.clearTimeout(eliminationTimeoutRef.current);
            eliminationTimeoutRef.current = null;
        }
        setSelectedMovies([]);
        setWinner(null);
        setLastEliminated(null);
        setEliminatingMovie(null);
        setModalMovie(null);
    };

    const posterUrl = (movie: MovieRouletteMovie) => getMovieImageUrl(movie.poster_path, 'w185');

    const openMovieModal = (movie: MovieRouletteMovie) => {
        setModalMovie(movie);
        dispatch(openModal());
    };


const STORAGE_KEY = 'user_image_key';

// 1. Инициализация состояния из localStorage (с fallback-значением по умолчанию)
const [userImage, setUserImage] = useState<string>(() => {
  return localStorage.getItem(STORAGE_KEY) || 'https://static2.klipy.com/ii/d7aec6f6f171607374b2065c836f92f4/25/92/ydTYzr90.gif';
});

// 2. Вспомогательная функция для обновления состояния и сохранения в localStorage
const updateAndSaveImage = (value: string) => {
  setUserImage(value);
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch (error) {
    console.error('Ошибка сохранения в localStorage:', error);
  }
};

// 3. Основная функция обработки файла или текста/URL
const handleImageChange = (fileOrText: File | string) => {
  if (!fileOrText) return;

  if (fileOrText instanceof File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const resultUrl = e.target?.result as string;
      if (resultUrl) {
        updateAndSaveImage(resultUrl);
        console.log('Загружен файл:', fileOrText.name);
      }
    };
    reader.readAsDataURL(fileOrText);
  } else if (typeof fileOrText === 'string') {
    updateAndSaveImage(fileOrText);
    console.log('Введен текст/ссылка:', fileOrText);
  }
};

// 4. Обработчик выборки файла из инпута
const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    handleImageChange(file);
  }
};

    return (
        <main className="roulette-page">
            <div className="w-full max-w-[105rem] mx-auto flex flex-col">
                <header className="roulette-header w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-200 dark:border-white/10">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">КИНОКЛУБ / СЛУЧАЙНЫЙ ВЫБОР</p>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Рулетка фильмов</h1>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <label className="relative inline-flex items-center justify-center gap-2 cursor-pointer rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-white transition shadow-sm">
                            <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                            <button disabled={spinning} className={`${source === 'excel' ? 'is-active' : '' } roulette-excel-button`} onClick={() => setSource('excel')}>Excel</button>
                            <button disabled={spinning} className={`${source === 'online' ? 'is-active' : '' } roulette-tmdb-button`} onClick={() => setSource('online')}>TMDB / Kinopoisk</button>
                            <button disabled={spinning} className={`${source === 'text' ? 'is-active' : '' } roulette-text-button`} onClick={() => setSource('text')}>Просто текст</button>
                        </div>
                    </div>

                    <div className="roulette-control-group">
                        <span className="roulette-label">Режим</span>
                        <div className="roulette-segmented">
                            <button disabled={spinning} className={mode === 'elimination' ? 'is-active' : ''} onClick={() => { setMode('elimination'); setWinner(null); }}>На выбывание</button>
                            <button disabled={spinning} className={mode === 'winner' ? 'is-active' : ''} onClick={() => { setMode('winner'); setWinner(null); }}>На победу</button>
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
                        <label className="roulette-range-label" htmlFor="roulette-duration">
                            Длительность <output>{(spinDurationMs / 1000).toFixed(1)} с</output>
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
                            onChange={(event) => setSpinDurationMs(Number(event.target.value) * 1000)}
                        />
                    </div>

                    {source === 'text' ? (
                        <form className="roulette-text-form" onSubmit={(event) => { event.preventDefault(); addText(); }}>
                            <label className="roulette-label" htmlFor="roulette-text">Текст участника</label>
                            <textarea
                                id="roulette-text"
                                className="roulette-search roulette-text-input"
                                value={textValue}
                                onChange={(event) => setTextValue(event.target.value)}
                                placeholder="Например: Посмотреть сериал"
                                rows={3}
                            />
                            <button type="submit" className="roulette-login-button">Добавить в колесо</button>
                        </form>
                    ) : (
                        <>
                            <label className="roulette-label" htmlFor="roulette-search">Поиск по названию</label>
                            <input id="roulette-search" className="roulette-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Например: Интерстеллар" />
                            {isSearching && <p className="roulette-hint">Ищем фильм...</p>}
                            {searchError && <p className="roulette-error">{searchError}</p>}
                        </>
                    )}

                    <div className="roulette-results">
                        {source === 'excel' && !isAuthorized && (
                            <div className="roulette-login-notice">
                                <p>Войдите, чтобы выбрать просмотренные фильмы</p>
                                <Button label="Авторизоваться" onClick={login} className="roulette-login-button" />
                            </div>
                        )}
                        {availableMovies.filter((movie) => !selectedKeys.has(movieKey(movie))).map((movie) => {
                            const key = movieKey(movie);
                            return (
                                <button key={key} className="roulette-result" onClick={() => addMovie(movie)}>
                                    <span className="roulette-result-title">
                                        {!isTextMovie(movie) && posterUrl(movie) && <img src={posterUrl(movie)} alt="" />}
                                        {movieTitle(movie)}
                                    </span>
                                    <small>{movie.source === 'kinopoisk' ? 'Kinopoisk' : source === 'excel' ? 'Excel' : 'TMDB'}</small>
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
                        <div className="roulette-wheel-panel">
                            <div className="roulette-wheel-wrap">
                                <div className="roulette-pointer" aria-hidden="true">
                                    <svg viewBox="0 0 32 38" className="roulette-pointer-icon" fill="none">
                                        <defs>
                                            <linearGradient id="goldPointerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#fef08a" />
                                                <stop offset="35%" stopColor="#f59e0b" />
                                                <stop offset="75%" stopColor="#d97706" />
                                                <stop offset="100%" stopColor="#78350f" />
                                            </linearGradient>
                                            <filter id="pointerGlow" x="-20%" y="-20%" width="140%" height="140%">
                                                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.7" />
                                            </filter>
                                        </defs>
                                        <path
                                            d="M3 4 L29 4 L29 16 L16 35 L3 16 Z"
                                            fill="url(#goldPointerGrad)"
                                            stroke="#fef08a"
                                            strokeWidth="1.2"
                                            filter="url(#pointerGlow)"
                                        />
                                        <path
                                            d="M8 8 L24 8 L24 15 L16 27 L8 15 Z"
                                            fill="#78350f"
                                            opacity="0.35"
                                        />
                                        <path
                                            d="M16 11 L21 16 L16 24 L11 16 Z"
                                            fill="#fef08a"
                                            opacity="0.9"
                                        />
                                    </svg>
                                </div>
                                <div
                                    className={`roulette-wheel ${spinning ? 'is-spinning' : ''}`}
                                    style={{
                                        transform: `rotate(${rotation}deg)`,
                                        transitionDuration: `${spinDurationMs}ms`,
                                        background: getWheelBackground(selectedMovies.length, isDark),
                                    }}
                                    onTransitionEnd={handleWheelTransitionEnd}
                                    aria-label="Колесо рулетки"
                                >
                                    {selectedMovies.map((movie, index) => {
                                        const angle = (360 / selectedMovies.length) * index;
                                        const isText = isTextMovie(movie);
                                        const title = movieTitle(movie);
                                        const poster = !isText ? posterUrl(movie) : null;
                                        const isEliminating = eliminatingMovie && movieKey(eliminatingMovie) === movieKey(movie);

                                        return (
                                            <div
                                                className={`roulette-sector-slot ${isEliminating ? 'is-eliminating' : ''}`}
                                                key={movieKey(movie)}
                                                style={{
                                                    '--sector-angle': `${angle}deg`,
                                                } as CSSProperties}
                                                role={isText ? undefined : 'button'}
                                                tabIndex={isText ? undefined : 0}
                                                aria-label={isText ? title : `Открыть описание: ${title}`}
                                                onClick={() => { if (!isText && !spinning) openMovieModal(movie); }}
                                                onKeyDown={(event) => {
                                                    if (!isText && !spinning && (event.key === 'Enter' || event.key === ' ')) {
                                                        event.preventDefault();
                                                        openMovieModal(movie);
                                                    }
                                                }}
                                            >
                                                <span className="roulette-slot-title" title={title}>
                                                    {title}
                                                </span>
                                                {isText ? (
                                                    <div className="roulette-text-slot">
                                                        <span>{movie.text}</span>
                                                    </div>
                                                ) : poster ? (
                                                    <img
                                                        className="roulette-slot-poster"
                                                        src={poster}
                                                        alt={title}
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="roulette-slot-poster roulette-slot-placeholder">
                                                        <span>{title.slice(0, 1)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <button
                                    type="button"
                                    className="roulette-wheel-center"
                                    onClick={spin}
                                    disabled={spinning || !canStart}
                                    aria-label={spinning ? 'Колесо вращается' : mode === 'winner' ? 'Крутить и выбрать победителя' : 'Крутить и выбрать выбывший фильм'}
                                    title={spinning ? 'Колесо вращается' : 'Крутить рулетку'}
                                >
                                    <img
                                        src={userImage}
                                        alt={spinning ? 'Колесо вращается' : 'Крутить рулетку'}
                                        className="roulette-center-avatar"
                                        draggable={false}
                                    />
                                </button>
                            </div>
                        </div>

                        <aside className="roulette-chips" aria-label="Список выбранных фильмов">
                            <div className="roulette-stage-heading">
                                <div>
                                    <span className="roulette-label">Участники</span>
                                    <h3>{selectedMovies.length} {selectedMovies.length === 1 ? 'фильм' : 'фильмов'} в рулетке</h3>
                                </div>
                                <Button label="Очистить" onClick={reset} className="roulette-ghost-button" />
                            </div>
                            <span className="roulette-label">Фильмы в рулетке</span>
                            {lastEliminated && (
                                <button className="roulette-eliminated" onClick={() => { if (!isTextMovie(lastEliminated)) openMovieModal(lastEliminated); }}>
                                    {!isTextMovie(lastEliminated) && <img src={posterUrl(lastEliminated)} alt="" />}
                                    <span>Выбыл: <strong>{movieTitle(lastEliminated)}</strong></span>
                                </button>
                            )}
                            {selectedMovies.map((movie) => (
                                <div className="roulette-chip" key={movieKey(movie)}>
                                    <button aria-label={`Убрать ${movieTitle(movie)}`} onClick={() => removeMovie(movieKey(movie))}>×</button>
                                    <span>{movieTitle(movie)}</span>
                                </div>
                            ))}
                            {selectedMovies.length === 0 && <p className="roulette-empty">Добавьте фильмы, чтобы начать вращение.</p>}
                        </aside>
                    </div>

                    {mode === 'elimination' && selectedMovies.length === 1 && !winner && <p className="roulette-hint">{movieTitle(selectedMovies[0])} последний в списке и становится победителем.</p>}
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
                    fallbackTitle={modalMovie.isExcelFallback ? movieTitle(modalMovie) : undefined}
                    participantNames={participantNames}
                    onUpdateMovie={onUpdateMovie}
                />
            )}
        </main>
    );
};

export default MovieRoulette;