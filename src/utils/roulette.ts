import type { NormalizedMovie } from '../api/movieSource';

export type RouletteMode = 'elimination' | 'winner';
export type RouletteSource = 'excel' | 'online' | 'text';

export type MovieRouletteMovie = NormalizedMovie & {
  excelTitle?: string;
};

export type TextRouletteMovie = {
  id: string;
  title: string;
  original_title: string;
  source: 'text';
  text: string;
};

export type RouletteMovie = MovieRouletteMovie | TextRouletteMovie;

export const randomIndex = (length: number): number => {
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

export const randomFraction = (): number => {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] / 0x100000000;
};

export const movieTitle = (movie: RouletteMovie): string =>
  movie.title || movie.original_title || 'Без названия';

export const movieKey = (movie: RouletteMovie): string =>
  `${movie.source}-${movie.id}-${'excelTitle' in movie ? movie.excelTitle ?? '' : ''}`;

export const isTextMovie = (movie: RouletteMovie): movie is TextRouletteMovie =>
  movie.source === 'text';

export const wheelColorsDark = ['#131622', '#1a1f2e', '#161b28'];
export const wheelColorsLight = ['#ffffff', '#f1f5f9', '#e2e8f0'];
export const wheelDivider = 'rgba(245, 158, 11, 0.45)';
export const wheelDividerAngle = 0.35;

export const getWheelBackground = (movieCount: number, isDark = true): string => {
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
    const color = isOdd && index === movieCount - 1 ? colors[2] : colors[index % 2];
    return `${color} ${start}deg ${dividerStart}deg, ${wheelDivider} ${dividerStart}deg ${end}deg`;
  });

  return `conic-gradient(from ${-sectorAngle / 2}deg, ${stops.join(', ')})`;
};
