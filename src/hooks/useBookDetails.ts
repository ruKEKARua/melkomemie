import { useState, useEffect, useCallback } from 'react';
import { sanitizeGoogleBooksCover, type BookClubBook } from '../api/bookClubData';
import { fetchGoogleBookDetails, cleanDescription } from '../api/googleBooks';
import { getCachedBookCover, getCachedBookDetails, type EnrichedBookDetails } from '../api/bookCache';

export function useBookDetails(selectedBook: BookClubBook) {
  const [enrichedMap, setEnrichedMap] = useState<Record<number, EnrichedBookDetails>>({});
  const [failedCoverId, setFailedCoverId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchGoogleBookDetails(selectedBook.title, selectedBook.author, undefined, selectedBook.id).then(
      (details) => {
        if (isMounted && details) {
          setEnrichedMap((prev) => ({ ...prev, [selectedBook.id]: details }));
        }
      }
    );

    return () => {
      isMounted = false;
    };
  }, [selectedBook.id, selectedBook.title, selectedBook.author]);

  const onCoverError = useCallback(() => {
    setFailedCoverId(selectedBook.id);
  }, [selectedBook.id]);

  const enrichedData = enrichedMap[selectedBook.id] || getCachedBookDetails(selectedBook.id);
  const isCoverFailed = failedCoverId === selectedBook.id;
  const cachedCover = getCachedBookCover(selectedBook.id);
  const localCover = `${import.meta.env.BASE_URL}covers/book_${selectedBook.id}.jpg`;
  const sanitizedUrl = sanitizeGoogleBooksCover(
    enrichedData?.coverUrl || selectedBook.coverUrl
  );

  // Guarantee 100% cover display: always use local curated HD cover first,
  // with fallback to offline base64 dictionary. External Google Books placeholder
  // or rate-limited links will never overwrite the verified artwork.
  const activeCover = isCoverFailed
    ? (cachedCover || localCover)
    : (localCover || cachedCover || sanitizedUrl);

  const publisherDisplay =
    enrichedData?.publisher || selectedBook.publisher || 'Издательство классической литературы';
  const publishedYearDisplay =
    enrichedData?.publishedYear || selectedBook.publishedYear || selectedBook.date;

  // Selected book description is curated, clean and 100% Russian.
  // Clean raw description to ensure zero publisher artifacts or English noise.
  const rawDescription = selectedBook.description || enrichedData?.description || '';
  const descriptionDisplay = cleanDescription(rawDescription) || selectedBook.description || '';

  const pageCountDisplay = enrichedData?.pageCount || selectedBook.pageCount;

  // Keep curated Russian genres; only use external categories if they are in Russian and selectedBook has none.
  const genresDisplay =
    selectedBook.genres && selectedBook.genres.length > 0
      ? selectedBook.genres
      : enrichedData?.categories && enrichedData.categories.length > 0
      ? enrichedData.categories
      : ['Классическая литература'];

  return {
    enrichedData,
    activeCover,
    onCoverError,
    publisherDisplay,
    publishedYearDisplay,
    descriptionDisplay,
    pageCountDisplay,
    genresDisplay,
  };
}
