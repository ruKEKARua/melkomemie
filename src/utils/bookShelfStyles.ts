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

export interface BookTiltInfo {
  tiltAngle: number;
  tiltOrigin: 'bottom left' | 'bottom right' | 'bottom center';
}

/**
 * Returns natural, varied tilt configurations so that books lean organically against
 * their sturdy upright neighbors on each shelf.
 */
export function getBookTilt(
  shelfIndex: number,
  bookIndex: number,
  totalOnShelf: number
): BookTiltInfo {
  // If shelf has only 1 book, maintain upright
  if (totalOnShelf <= 1) {
    return { tiltAngle: 0, tiltOrigin: 'bottom center' };
  }

  // Shelf 0 (Top shelf: books 0..5)
  // Book 1 leans left on Book 0; Book 4 leans right on Book 5
  if (shelfIndex === 0) {
    if (bookIndex === 1 && totalOnShelf >= 2) {
      return { tiltAngle: -7.2, tiltOrigin: 'bottom left' };
    }
    if (bookIndex === 4 && totalOnShelf >= 6) {
      return { tiltAngle: 7.0, tiltOrigin: 'bottom right' };
    }
    return { tiltAngle: 0, tiltOrigin: 'bottom center' };
  }

  // Shelf 1 (Second shelf: books 6..11)
  // Keystone composition: Book 2 leans right onto Book 3, Book 4 leans left onto Book 3
  if (shelfIndex === 1) {
    if (bookIndex === 2 && totalOnShelf >= 4) {
      return { tiltAngle: 7.4, tiltOrigin: 'bottom right' };
    }
    if (bookIndex === 4 && totalOnShelf >= 5) {
      return { tiltAngle: -7.2, tiltOrigin: 'bottom left' };
    }
    return { tiltAngle: 0, tiltOrigin: 'bottom center' };
  }

  // Shelf 2 (Third shelf: books 12..17)
  // If 3 books (current state), Book 2 leans left onto Book 1
  if (shelfIndex === 2) {
    if (totalOnShelf === 3 && bookIndex === 2) {
      return { tiltAngle: -7.5, tiltOrigin: 'bottom left' };
    }
    if (bookIndex === 2 && totalOnShelf >= 3) {
      return { tiltAngle: -7.5, tiltOrigin: 'bottom left' };
    }
    if (bookIndex === 5 && totalOnShelf >= 6) {
      return { tiltAngle: -7.0, tiltOrigin: 'bottom left' };
    }
    return { tiltAngle: 0, tiltOrigin: 'bottom center' };
  }

  // Shelf 3 (Bottom shelf: books 18..23)
  if (shelfIndex === 3) {
    if (bookIndex === 1 && totalOnShelf >= 2) {
      return { tiltAngle: -7.0, tiltOrigin: 'bottom left' };
    }
    if (bookIndex === 4 && totalOnShelf >= 5) {
      return { tiltAngle: 7.2, tiltOrigin: 'bottom right' };
    }
    return { tiltAngle: 0, tiltOrigin: 'bottom center' };
  }

  return { tiltAngle: 0, tiltOrigin: 'bottom center' };
}
