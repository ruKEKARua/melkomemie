import { useState, useEffect, useCallback } from 'react';
import {
  INITIAL_BOOK_CLUB_BOOKS,
  fetchLiveBookClubList,
  type BookClubBook,
} from '../api/bookClubData';
import {
  getCachedBookClubBooks,
  preloadAndCacheBookCovers,
} from '../api/bookCache';

export function useBookClub() {
  // Single synchronous call on initialization
  const [books, setBooks] = useState<BookClubBook[]>(() => {
    const cached = getCachedBookClubBooks();
    return cached && cached.length > 0 ? cached : INITIAL_BOOK_CLUB_BOOKS;
  });

  const [selectedBook, setSelectedBook] = useState<BookClubBook>(() => {
    return books[0] ?? INITIAL_BOOK_CLUB_BOOKS[0];
  });

  const [viewMode, setViewMode] = useState<'room' | 'detail'>('room');

  // Background live update from Google Sheets and preload covers
  useEffect(() => {
    let isMounted = true;

    fetchLiveBookClubList().then((liveBooks) => {
      if (isMounted && liveBooks && liveBooks.length > 0) {
        setBooks(liveBooks);
        setSelectedBook((prev) => {
          const match = liveBooks.find((b) => b.id === prev.id);
          return match || liveBooks[0];
        });

        // Preload missing covers in background in parallel batches
        preloadAndCacheBookCovers(liveBooks);
      }
    });

    const handleCacheCleared = () => {
      if (isMounted) {
        setBooks(INITIAL_BOOK_CLUB_BOOKS);
        setSelectedBook(INITIAL_BOOK_CLUB_BOOKS[0]);
      }
    };

    window.addEventListener('mm_books_cache_cleared', handleCacheCleared);

    return () => {
      isMounted = false;
      window.removeEventListener('mm_books_cache_cleared', handleCacheCleared);
    };
  }, []);

  const handleSelectBookFromRoom = useCallback((book: BookClubBook) => {
    setSelectedBook(book);
    setViewMode('detail');
  }, []);

  const handleSelectBookInDetail = useCallback((book: BookClubBook) => {
    setSelectedBook(book);
  }, []);

  return {
    books,
    selectedBook,
    setSelectedBook,
    viewMode,
    setViewMode,
    handleSelectBookFromRoom,
    handleSelectBookInDetail,
  };
}

export default useBookClub;
