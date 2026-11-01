import { useState, useRef, useEffect, useCallback } from 'react';
import {
  randomIndex,
  randomFraction,
  movieKey,
  wheelDividerAngle,
  type RouletteMovie,
  type RouletteMode,
} from '../utils/roulette';

interface UseRouletteWheelOptions {
  selectedMovies: RouletteMovie[];
  setSelectedMovies: React.Dispatch<React.SetStateAction<RouletteMovie[]>>;
  mode: RouletteMode;
  canStart: boolean;
}

export function useRouletteWheel({
  selectedMovies,
  setSelectedMovies,
  mode,
  canStart,
}: UseRouletteWheelOptions) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [spinDurationMs, setSpinDurationMs] = useState(10200);
  const [spinTurns, setSpinTurns] = useState(5);
  const [eliminatingMovie, setEliminatingMovie] = useState<RouletteMovie | null>(null);
  const [winner, setWinner] = useState<RouletteMovie | null>(null);
  const [lastEliminated, setLastEliminated] = useState<RouletteMovie | null>(null);
  const eliminationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (eliminationTimeoutRef.current !== null) {
        window.clearTimeout(eliminationTimeoutRef.current);
      }
    };
  }, []);

  const spin = useCallback(() => {
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
    const targetAngle = (((360 - chosenAngle) % 360) + 360) % 360;

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
  }, [canStart, spinning, selectedMovies.length, spinTurns]);

  const finishSpin = useCallback(() => {
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
      // 1. Фиксируем его как выбывший фильм и подсвечиваем на колесе.
      setLastEliminated(chosenMovie);
      setEliminatingMovie(chosenMovie);

      // 2. Даем время увидеть, после чего удаляем из активного состава колеса.
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
  }, [mode, pendingIndex, selectedMovies, setSelectedMovies]);

  const handleWheelTransitionEnd = useCallback(
    (event: React.TransitionEvent<HTMLDivElement>) => {
      // Игнорируем события от дочерних элементов (постеров, кнопок и т.д.)
      if (event.target !== event.currentTarget) return;
      if (event.propertyName !== 'transform') return;
      if (!spinning) return;
      finishSpin();
    },
    [spinning, finishSpin]
  );

  const resetWheel = useCallback(() => {
    if (spinning) return;
    if (eliminationTimeoutRef.current !== null) {
      window.clearTimeout(eliminationTimeoutRef.current);
      eliminationTimeoutRef.current = null;
    }
    setWinner(null);
    setLastEliminated(null);
    setEliminatingMovie(null);
  }, [spinning]);

  return {
    rotation,
    spinning,
    pendingIndex,
    spinDurationMs,
    setSpinDurationMs,
    spinTurns,
    setSpinTurns,
    eliminatingMovie,
    winner,
    setWinner,
    lastEliminated,
    setLastEliminated,
    spin,
    handleWheelTransitionEnd,
    resetWheel,
  };
}
