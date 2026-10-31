import { useState, useEffect, useCallback } from 'react';
import type { BookClubBook } from '../api/bookClubData';
import { fetchGoogleBookDetails } from '../api/googleBooks';
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

  const activeCover =
    !isCoverFailed && cachedCover
      ? cachedCover
      : !isCoverFailed && enrichedData?.coverUrl
      ? enrichedData.coverUrl
      : !isCoverFailed && selectedBook.coverUrl
      ? selectedBook.coverUrl
      : 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Animal_Farm_-_1st_edition.jpg';

  const publisherDisplay =
    enrichedData?.publisher || selectedBook.publisher || 'Издательство классической литературы';
  const publishedYearDisplay =
    enrichedData?.publishedYear || selectedBook.publishedYear || selectedBook.date;
  const descriptionDisplay = enrichedData?.description || selectedBook.description;
  const pageCountDisplay = enrichedData?.pageCount || selectedBook.pageCount;
  const genresDisplay =
    enrichedData?.categories && enrichedData.categories.length > 0
      ? enrichedData.categories
      : selectedBook.genres;

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
