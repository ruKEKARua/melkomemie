import React, { type CSSProperties } from 'react';
import {
  movieKey,
  movieTitle,
  isTextMovie,
  getWheelBackground,
  type RouletteMovie,
  type MovieRouletteMovie,
  type RouletteMode,
} from '../../utils/roulette';

interface RouletteWheelProps {
  selectedMovies: RouletteMovie[];
  spinning: boolean;
  rotation: number;
  spinDurationMs: number;
  isDark: boolean;
  eliminatingMovie: RouletteMovie | null;
  userImage: string;
  canStart: boolean;
  mode: RouletteMode;
  onSpin: () => void;
  onWheelTransitionEnd: (event: React.TransitionEvent<HTMLDivElement>) => void;
  onOpenModal: (movie: MovieRouletteMovie) => void;
  posterUrl: (movie: MovieRouletteMovie) => string;
}

export const RouletteWheel: React.FC<RouletteWheelProps> = ({
  selectedMovies,
  spinning,
  rotation,
  spinDurationMs,
  isDark,
  eliminatingMovie,
  userImage,
  canStart,
  mode,
  onSpin,
  onWheelTransitionEnd,
  onOpenModal,
  posterUrl,
}) => {
  return (
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
                <feDropShadow
                  dx="0"
                  dy="2"
                  stdDeviation="3"
                  floodColor="#f59e0b"
                  floodOpacity="0.7"
                />
              </filter>
            </defs>
            <path
              d="M3 4 L29 4 L29 16 L16 35 L3 16 Z"
              fill="url(#goldPointerGrad)"
              stroke="#fef08a"
              strokeWidth="1.2"
              filter="url(#pointerGlow)"
            />
            <path d="M8 8 L24 8 L24 15 L16 27 L8 15 Z" fill="#78350f" opacity="0.35" />
            <path d="M16 11 L21 16 L16 24 L11 16 Z" fill="#fef08a" opacity="0.9" />
          </svg>
        </div>

        <div
          className={`roulette-wheel ${spinning ? 'is-spinning' : ''}`}
          style={{
            transform: `rotate(${rotation}deg)`,
            transitionDuration: `${spinDurationMs}ms`,
            background: getWheelBackground(selectedMovies.length, isDark),
          }}
          onTransitionEnd={onWheelTransitionEnd}
          aria-label="Колесо рулетки"
        >
          {selectedMovies.map((movie, index) => {
            const angle = (360 / selectedMovies.length) * index;
            const isText = isTextMovie(movie);
            const title = movieTitle(movie);
            const poster = !isText ? posterUrl(movie) : null;
            const isEliminating =
              eliminatingMovie && movieKey(eliminatingMovie) === movieKey(movie);

            return (
              <div
                className={`roulette-sector-slot ${isEliminating ? 'is-eliminating' : ''}`}
                key={movieKey(movie)}
                style={
                  {
                    '--sector-angle': `${angle}deg`,
                  } as CSSProperties
                }
                role={isText ? undefined : 'button'}
                tabIndex={isText ? undefined : 0}
                aria-label={isText ? title : `Открыть описание: ${title}`}
                onClick={() => {
                  if (!isText && !spinning) onOpenModal(movie);
                }}
                onKeyDown={(event) => {
                  if (
                    !isText &&
                    !spinning &&
                    (event.key === 'Enter' || event.key === ' ')
                  ) {
                    event.preventDefault();
                    onOpenModal(movie);
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
          onClick={onSpin}
          disabled={spinning || !canStart}
          aria-label={
            spinning
              ? 'Колесо вращается'
              : mode === 'winner'
              ? 'Крутить и выбрать победителя'
              : 'Крутить и выбрать выбывший фильм'
          }
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
  );
};
