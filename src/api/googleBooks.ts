import { sanitizeGoogleBooksCover } from './bookClubData';

export interface GoogleBookVolumeInfo {
  title?: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  categories?: string[];
  imageLinks?: {
    smallThumbnail?: string;
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    extraLarge?: string;
  };
  language?: string;
}

export interface GoogleBooksItem {
  id: string;
  volumeInfo: GoogleBookVolumeInfo;
}

export interface GoogleBooksResponse {
  totalItems: number;
  items?: GoogleBooksItem[];
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Strips HTML formatting tags from Google Books description strings.
 */
function cleanDescription(html?: string): string | undefined {
  if (!html) return undefined;
  return html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Searches Google Books API for extra metadata and covers without edge curl.
 */
export async function fetchGoogleBookDetails(
  title: string,
  author?: string,
  apiKey?: string,
): Promise<{
  coverUrl?: string;
  publisher?: string;
  publishedYear?: string;
  description?: string;
  pageCount?: number;
  categories?: string[];
  language?: string;
} | null> {
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_BOOKS_API_KEY) || '';
  const effectiveKey = (apiKey || envKey).trim();
  const keyParam = effectiveKey ? `&key=${encodeURIComponent(effectiveKey)}` : '';

  const query = encodeURIComponent(`${title} ${author || ''}`.trim());
  const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&langRestrict=ru&maxResults=4${keyParam}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Google Books API status ${res.status} for query: ${title}`);
      return null;
    }

    const data: GoogleBooksResponse = await res.json();
    if (!data.items || data.items.length === 0) {
      return null;
    }

    // Find best matching item
    const normalizedTitle = title.toLowerCase().trim();
    const item =
      data.items.find((it) => {
        const itemTitle = (it.volumeInfo?.title || '').toLowerCase();
        return itemTitle.includes(normalizedTitle) || normalizedTitle.includes(itemTitle);
      }) || data.items[0];

    const vi = item.volumeInfo || {};
    const rawImg =
      vi.imageLinks?.extraLarge ||
      vi.imageLinks?.large ||
      vi.imageLinks?.medium ||
      vi.imageLinks?.thumbnail ||
      vi.imageLinks?.smallThumbnail;

    const coverUrl = sanitizeGoogleBooksCover(rawImg);
    const cleanedDesc = cleanDescription(vi.description);
    const publishedYear = vi.publishedDate ? vi.publishedDate.slice(0, 4) : undefined;

    return {
      coverUrl,
      publisher: vi.publisher,
      publishedYear,
      description: cleanedDesc,
      pageCount: vi.pageCount,
      categories: vi.categories,
      language: vi.language === 'ru' ? 'Русский' : vi.language,
    };
  } catch (err) {
    console.warn(`Error fetching Google Books metadata for "${title}":`, err);
    return null;
  }
}
