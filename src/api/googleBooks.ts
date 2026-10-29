export interface GoogleBookVolume {
  id: string;
  volumeInfo: {
    title: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    printType?: string;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
    maturityRating?: string;
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
    language?: string;
    previewLink?: string;
    infoLink?: string;
    canonicalVolumeLink?: string;
  };
}

export interface GoogleBooksSearchResponse {
  kind?: string;
  totalItems: number;
  items?: GoogleBookVolume[];
}

export interface BookParticipantRating {
  name: string;
  score: string;
  hasAsterisk: boolean;
  isGuest?: boolean;
}

export interface BookClubData {
  book: string;
  originalTitle?: string;
  author: string;
  year?: string;
  overallRating: string;
  discussionDate?: string;
  participants: BookParticipantRating[];
}

// Participant ratings strictly according to Screenshot 1:
// Никита: 6
// Маша: 8
// Лина: 4
// Наташа: 8
// Монетка*: 8 (желтый фон)
// Дима: 8
// Олег*: 8 (желтый фон)
// Общая оценка: 7,3
export const SKOTNY_DVOR_CLUB_RATINGS: BookClubData = {
  book: 'Скотный двор',
  originalTitle: 'Animal Farm: A Fairy Story',
  author: 'Джордж Оруэлл',
  year: '1945',
  overallRating: '7,3',
  discussionDate: '2026-10-29',
  participants: [
    { name: 'Никита', score: '6', hasAsterisk: false },
    { name: 'Маша', score: '8', hasAsterisk: false },
    { name: 'Лина', score: '4', hasAsterisk: false },
    { name: 'Наташа', score: '8', hasAsterisk: false },
    { name: 'Монетка*', score: '8', hasAsterisk: true, isGuest: true },
    { name: 'Дима', score: '8', hasAsterisk: false },
    { name: 'Олег*', score: '8', hasAsterisk: true, isGuest: true },
  ],
};

// Default high-quality volume data for "Скотный двор" conforming to Google Books API
export const DEFAULT_SKOTNY_DVOR_VOLUME: GoogleBookVolume = {
  id: 'skotny-dvor-orwell',
  volumeInfo: {
    title: 'Скотный двор',
    subtitle: 'Сказка / Притча',
    authors: ['Джордж Оруэлл'],
    publisher: 'Издательство АСТ / Secker & Warburg',
    publishedDate: '1945',
    description:
      '«Скотный двор» (англ. Animal Farm: A Fairy Story) — культовая сатирическая повесть-притча Джорджа Оруэлла. В ней в аллегорической форме показано перерождение идеалов равенства и свободы: поднявшие восстание на ферме животные изгоняют жестокого хозяина, однако вскоре власть захватывают свиньи во главе с Наполеоном, провозглашая знаменитый лозунг: «Все животные равны, но некоторые животные равнее других».',
    pageCount: 112,
    printType: 'BOOK',
    categories: ['Художественная литература', 'Сатира', 'Антиутопия', 'Зарубежная классика'],
    averageRating: 4.6,
    ratingsCount: 840,
    language: 'ru',
    imageLinks: {
      thumbnail:
        'https://upload.wikimedia.org/wikipedia/commons/f/fb/Animal_Farm_-_1st_edition.jpg',
      smallThumbnail:
        'https://covers.openlibrary.org/b/id/11261770-M.jpg',
      medium:
        'https://covers.openlibrary.org/b/id/11261770-L.jpg',
      large:
        'https://upload.wikimedia.org/wikipedia/commons/f/fb/Animal_Farm_-_1st_edition.jpg',
    },
    previewLink: 'https://books.google.com/books?id=zyTCAlFPjgYC',
    infoLink: 'https://books.google.com/books?id=zyTCAlFPjgYC',
  },
};

export interface FetchBookResult {
  book: GoogleBookVolume;
  source: 'google-api' | 'cache-fallback';
  allResults: GoogleBookVolume[];
  apiStatus: string;
  error?: string;
}

/**
 * Searches Google Books API with automatic fallback to high-quality cached volume
 * when Google Books daily public quota is exhausted (HTTP 429).
 */
export async function searchGoogleBooks(
  query: string = 'Скотный двор',
  apiKey?: string,
): Promise<FetchBookResult> {
  const normalizedQuery = query.trim() || 'Скотный двор';
  const isDefaultBook =
    normalizedQuery.toLowerCase().includes('скотный') ||
    normalizedQuery.toLowerCase().includes('animal farm');

  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_BOOKS_API_KEY) || '';
  const effectiveKey = (apiKey || envKey).trim();
  const keyParam = effectiveKey ? `&key=${encodeURIComponent(effectiveKey)}` : '';
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
    normalizedQuery,
  )}&langRestrict=ru&maxResults=8${keyParam}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Ошибка HTTP ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson?.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch {
        // use default error message
      }

      console.warn('Google Books API response not OK, using cache fallback:', errorMessage);

      return {
        book: DEFAULT_SKOTNY_DVOR_VOLUME,
        source: 'cache-fallback',
        allResults: [DEFAULT_SKOTNY_DVOR_VOLUME],
        apiStatus: `Google Books API вернул статус ${response.status} (квота запросов). Использована эталонная запись по книге.`,
        error: errorMessage,
      };
    }

    const data = (await response.json()) as GoogleBooksSearchResponse;

    if (data.items && data.items.length > 0) {
      // Find item that best matches
      const matched =
        data.items.find((item) => {
          const t = item.volumeInfo?.title?.toLowerCase() || '';
          return t.includes('скотный') || t.includes('двор') || t.includes('animal farm');
        }) || data.items[0];

      // Fix image protocol if http
      const ensureHttps = (bookItem: GoogleBookVolume): GoogleBookVolume => {
        if (!bookItem.volumeInfo.imageLinks) {
          if (isDefaultBook) {
            bookItem.volumeInfo.imageLinks = DEFAULT_SKOTNY_DVOR_VOLUME.volumeInfo.imageLinks;
          }
          return bookItem;
        }
        const img = bookItem.volumeInfo.imageLinks;
        return {
          ...bookItem,
          volumeInfo: {
            ...bookItem.volumeInfo,
            imageLinks: {
              ...img,
              thumbnail: img.thumbnail?.replace(/^http:/, 'https:') || img.smallThumbnail?.replace(/^http:/, 'https:'),
              smallThumbnail: img.smallThumbnail?.replace(/^http:/, 'https:'),
              medium: img.medium?.replace(/^http:/, 'https:') || img.thumbnail?.replace(/^http:/, 'https:'),
            },
          },
        };
      };

      const sanitizedBook = ensureHttps(matched);
      const sanitizedAll = data.items.map(ensureHttps);

      return {
        book: sanitizedBook,
        source: 'google-api',
        allResults: sanitizedAll,
        apiStatus: 'Данные успешно получены в реальном времени из Google Books API',
      };
    }

    // No items found in live search
    return {
      book: isDefaultBook ? DEFAULT_SKOTNY_DVOR_VOLUME : {
        id: 'not-found',
        volumeInfo: {
          title: query,
          authors: ['Неизвестный автор'],
          description: 'По вашему запросу книги не найдены в Google Books API.',
        },
      },
      source: isDefaultBook ? 'cache-fallback' : 'google-api',
      allResults: isDefaultBook ? [DEFAULT_SKOTNY_DVOR_VOLUME] : [],
      apiStatus: 'Google Books API не вернул результатов по данному запросу.',
    };
  } catch (err: any) {
    console.error('Fetch error from Google Books API:', err);
    return {
      book: DEFAULT_SKOTNY_DVOR_VOLUME,
      source: 'cache-fallback',
      allResults: [DEFAULT_SKOTNY_DVOR_VOLUME],
      apiStatus: 'Сетевая ошибка при обращении к Google Books API. Использована эталонная база книжного клуба.',
      error: err?.message || 'Network error',
    };
  }
}
