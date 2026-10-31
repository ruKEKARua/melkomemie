import type { MovieRatings } from '../HooksExcelMovies/useGetMovies';

export interface TitleHolder {
  excelTitle?: string;
  title?: string;
  original_title?: string;
  name?: string;
  original_name?: string;
}

/**
 * Normalizes movie title for index lookups
 */
export function normalizeMovieTitle(title?: string): string {
  return (title ?? '').trim().toLocaleLowerCase('ru-RU');
}

/**
 * Builds an O(1) lookup Map of movie ratings keyed by normalized title
 */
export function buildRatingsMap(ratings: MovieRatings[]): Map<string, MovieRatings> {
  const map = new Map<string, MovieRatings>();
  for (const rating of ratings) {
    if (rating?.movie) {
      map.set(normalizeMovieTitle(rating.movie), rating);
    }
  }
  return map;
}

/**
 * Retrieves the numeric rating for a movie from either a pre-built Map or raw array
 */
export function getMovieNumericRating(
  movie?: TitleHolder | null,
  ratings?: Map<string, MovieRatings> | MovieRatings[] | null
): number | undefined {
  if (!movie || !ratings) return undefined;
  const rawTitle = movie.excelTitle ?? movie.title ?? movie.original_title ?? movie.name ?? movie.original_name;
  if (!rawTitle) return undefined;

  const normalized = normalizeMovieTitle(rawTitle);
  let match: MovieRatings | undefined;
  if (ratings instanceof Map) {
    match = ratings.get(normalized);
  } else if (Array.isArray(ratings)) {
    match = ratings.find((r) => normalizeMovieTitle(r.movie) === normalized);
  }

  const sheetRating = match?.ratings[0]?.scores[1];
  const ratingNumber = sheetRating?.replace(',', '.').match(/-?\d+(?:\.\d+)?/)?.[0];
  return ratingNumber ? Number(ratingNumber) : undefined;
}

/**
 * Badge style for participant ratings in Modal and BookDetailView
 */
export function getRatingBadgeColor(scoreStr?: string | number): string {
  if (scoreStr === undefined || scoreStr === null || scoreStr === '') {
    return 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-300 dark:border-zinc-700';
  }
  const num = typeof scoreStr === 'number' ? scoreStr : parseFloat(String(scoreStr).replace(',', '.'));
  if (isNaN(num)) {
    return 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-300 dark:border-zinc-700';
  }

  if (num >= 7.5) {
    return 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-500/40';
  }
  if (num >= 6.0) {
    return 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30 dark:border-amber-500/40';
  }
  return 'bg-[#78350f]/15 dark:bg-[#78350f]/30 text-[#78350f] dark:text-amber-200 border-[#92400e]/30 dark:border-[#92400e]/40';
}

/**
 * Rating pill style in MovieCard
 */
export function getCardRatingStyle(ratingStr?: string | number): { bg: string; text: string } | null {
  if (!ratingStr && ratingStr !== 0) return null;
  const num = typeof ratingStr === 'number' ? ratingStr : parseFloat(String(ratingStr).replace(',', '.'));
  if (isNaN(num)) return { bg: 'bg-zinc-700/90 border-zinc-600', text: 'text-zinc-200' };

  if (num >= 7.5) {
    return { bg: 'bg-emerald-500/95 border-emerald-400/50 shadow-emerald-950/40', text: 'text-white' };
  }
  if (num >= 6.0) {
    return { bg: 'bg-amber-500/95 border-amber-400/50 shadow-amber-950/40', text: 'text-slate-950' };
  }
  return { bg: 'bg-[#78350f]/95 border-[#92400e]/70 shadow-amber-950/40', text: 'text-amber-100' };
}

/**
 * Rating badge style in HeroBillboard
 */
export function getHeroRatingBadgeStyle(score?: number | string | null): string {
  const scoreNum = typeof score === 'number' ? score : parseFloat(String(score ?? 0));
  if (scoreNum < 6.0) {
    return 'bg-[#78350f]/60 text-amber-200 border-[#92400e]/70';
  }
  if (scoreNum >= 7.5) {
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  }
  return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
}
