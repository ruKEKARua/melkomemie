import { useState, useEffect, useCallback } from 'react';
import {
  INITIAL_BOOK_CLUB_BOOKS,
  fetchLiveBookClubList,
  type BookClubBook,
} from '../api/bookClubData';
import {
  getCachedBookClubBooks,
  preloadAllBookCovers,
  preloadAndCacheBookCovers,
} from '../api/bookCache';

export function checkIsMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const isTouchMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isNarrowScreen =
    window.innerWidth < 768 ||
    (typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 767px)').matches);
  return isNarrowScreen || (isTouchMobile && window.innerWidth < 1024);
}

export function useBookClub() {
  const [isMobile, setIsMobile] = useState<boolean>(() => checkIsMobileDevice());

  // Single synchronous call on initialization
  const [books, setBooks] = useState<BookClubBook[]>(() => {
    const cached = getCachedBookClubBooks();
    return cached && cached.length > 0 ? cached : INITIAL_BOOK_CLUB_BOOKS;
  });

  const [selectedBook, setSelectedBook] = useState<BookClubBook>(() => {
    return books[0] ?? INITIAL_BOOK_CLUB_BOOKS[0];
  });

  // On mobile devices, always default directly to the shelf view ('detail') with book #1
  const [viewMode, setViewMode] = useState<'room' | 'detail'>(() => {
    return checkIsMobileDevice() ? 'detail' : 'room';
  });

  // Listen to screen resizes / orientation changes to ensure room video is never displayed on mobile
  useEffect(() => {
    const handleResize = () => {
      const mobileNow = checkIsMobileDevice();
      setIsMobile(mobileNow);
      if (mobileNow) {
        setViewMode('detail');
      }
    };

    window.addEventListener('resize', handleResize);
    const mql = typeof window.matchMedia === 'function' ? window.matchMedia('(max-width: 767px)') : null;
    if (mql && mql.addEventListener) {
      mql.addEventListener('change', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mql && mql.removeEventListener) {
        mql.removeEventListener('change', handleResize);
      }
    };
  }, []);

  // Immediately preload all book covers in parallel upon entering the Book Club
  useEffect(() => {
    preloadAllBookCovers(books);
  }, [books]);

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

        // Parallel preload all live covers
        preloadAllBookCovers(liveBooks);
        preloadAndCacheBookCovers(liveBooks);
      }
    });

    const handleCacheCleared = () => {
      if (isMounted) {
        setBooks(INITIAL_BOOK_CLUB_BOOKS);
        setSelectedBook(INITIAL_BOOK_CLUB_BOOKS[0]);
        preloadAllBookCovers(INITIAL_BOOK_CLUB_BOOKS);
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
    isMobile,
    handleSelectBookFromRoom,
    handleSelectBookInDetail,
  };
}

export default useBookClub;
