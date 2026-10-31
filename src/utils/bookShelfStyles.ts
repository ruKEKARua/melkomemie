import type { BookClubBook } from '../api/bookClubData';

export interface SpineColors {
  topColor: string;
  bottomColor: string;
  accent: string;
}

/**
 * Extracts top, bottom and accent colors from book spine metadata.
 */
export function parseSpineColors(book: BookClubBook): SpineColors {
  const hexMatches = book.spineColor?.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/g);
  const topColor = hexMatches?.[0] || book.spineAccent || '#450a0a';
  const bottomColor = hexMatches?.[1] || '#12141d';
  const accent = book.spineAccent || '#f59e0b';
  return { topColor, bottomColor, accent };
}

/**
 * Formats numeric or string rating to a consistent 2-decimal representation.
 */
export function formatRating(rating: string | number | undefined): string {
  if (rating === undefined || rating === null || rating === '') return '0.00';
  const num = typeof rating === 'number' ? rating : parseFloat(String(rating).replace(',', '.'));
  if (isNaN(num)) return String(rating);
  return num.toFixed(2);
}
