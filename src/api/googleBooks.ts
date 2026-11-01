import { sanitizeGoogleBooksCover } from './bookClubData';
import {
  getCachedBookDetails,
  setCachedBookDetails,
  type EnrichedBookDetails,
} from './bookCache';

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
 * Strips HTML formatting tags, decodes HTML entities, and removes publisher metadata/promotional noise.
 * Also verifies Russian language content to avoid returning English descriptions.
 */
export function cleanDescription(html?: string): string | undefined {
  if (!html) return undefined;
  let text = html
    .replace(/<br\s*[/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&nbsp;/g, ' ');

  // Strip publisher technical footnotes and file production credits
  text = text.replace(/Файл электронной книги подготовлен[\s\S]*$/gi, '');
  text = text.replace(/В формате\s+[^\n.]*сохранен[^\n.]*макет[^\n.]*[.]?/gi, '');
  text = text.replace(/В формате\s+(?:a4\.pdf|pdf|fb2|epub)[^\n.]*[.]?/gi, '');
  text = text.replace(/сохранен[^\n.]*издательский макет[^\n.]*[.]?/gi, '');
  text = text.replace(/Книга содержит нецензурную брань[^\n.]*[.]?/gi, '');
  text = text.replace(/Для кого эта книга[\s\S]*$/gi, '');
  text = text.replace(/В сборник также вошли[\s\S]*$/gi, '');
  text = text.replace(/[A-Z\s]{4,}:[\s\S]*$/g, '');
  text = text.replace(/["'—–\-]+\s*$/g, '');
  text = text.replace(/\s*[,;:]\s*$/g, '.');

  text = text.replace(/\n{3,}/g, '\n\n').trim();

  // Language check: Must contain Russian Cyrillic characters.
  // If text is in English or non-Russian, discard it so system retains vetted Russian description.
  const cyrillicCount = (text.match(/[а-яёА-ЯЁ]/g) || []).length;
  const latinCount = (text.match(/[a-zA-Z]/g) || []).length;
  if (cyrillicCount === 0 || (latinCount > cyrillicCount && cyrillicCount < 30)) {
    return undefined;
  }

  return text || undefined;
}

/**
 * Searches Google Books API for extra metadata and covers without edge curl.
 * Results are persistently cached in localStorage with 14-day TTL.
 */
export async function fetchGoogleBookDetails(
  title: string,
  author?: string,
  apiKey?: string,
  bookId?: number | string,
): Promise<EnrichedBookDetails | null> {
  const cacheKey = bookId ?? title;
  const cached = getCachedBookDetails(cacheKey);
  if (cached) {
    return cached;
  }

  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_BOOKS_API_KEY) || '';
  const effectiveKey = (apiKey || envKey).trim();
  const keyParam = effectiveKey ? `&key=${encodeURIComponent(effectiveKey)}` : '';

  const query = encodeURIComponent(`${title} ${author || ''}`.trim());
  const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&langRestrict=ru&maxResults=4${keyParam}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      // If 429 quota reached or other status, gracefully return null without breaking the UI
      console.warn(`Google Books API status ${res.status} for query: ${title}`);
      return null;
    }

    const data: GoogleBooksResponse = await res.json();
    if (!data.items || data.items.length === 0) {
      return null;
    }

    // Find best matching item
    const normalizedTitle = title.toLowerCase().trim();
    const item = data.items.find((it) => {
      const itemTitle = (it.volumeInfo?.title || '').toLowerCase();
      return itemTitle.includes(normalizedTitle) || normalizedTitle.includes(itemTitle);
    });

    if (!item) {
      return null;
    }

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

    // Only keep Russian categories to avoid polluting with English generic tags like "Fiction" or "Brain"
    const russianCategories = (vi.categories || []).filter((cat) => /[а-яёА-ЯЁ]/i.test(cat));

    const result: EnrichedBookDetails = {
      coverUrl,
      publisher: vi.publisher,
      publishedYear,
      description: cleanedDesc,
      pageCount: vi.pageCount,
      categories: russianCategories.length > 0 ? russianCategories : undefined,
      language: vi.language === 'ru' ? 'Русский' : vi.language,
    };

    setCachedBookDetails(cacheKey, result);
    return result;
  } catch (err) {
    console.warn(`Error fetching Google Books metadata for "${title}":`, err);
    return null;
  }
}
