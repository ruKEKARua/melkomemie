import React, { useState, useEffect } from 'react';
import {
  INITIAL_BOOK_CLUB_BOOKS,
  fetchLiveBookClubList,
  type BookClubBook,
} from '../api/bookClubData';
import {
  getCachedBookClubBooks,
  preloadAndCacheBookCovers,
} from '../api/bookCache';
import AtmosphericRoom from '../components/books/AtmosphericRoom';
import BookDetailView from '../components/books/BookDetailView';

interface BookClubPageProps {
  onBack: () => void;
  isAuthorized?: boolean;
  userName?: string;
  userPicture?: string;
}

export const BookClubPage: React.FC<BookClubPageProps> = () => {
  // Synchronous zero-latency startup: instantly hydrate from localStorage cache if available
  const [books, setBooks] = useState<BookClubBook[]>(() => {
    const cached = getCachedBookClubBooks();
    return cached && cached.length > 0 ? cached : INITIAL_BOOK_CLUB_BOOKS;
  });

  const [selectedBook, setSelectedBook] = useState<BookClubBook>(() => {
    const cached = getCachedBookClubBooks();
    return cached && cached.length > 0 ? cached[0] : INITIAL_BOOK_CLUB_BOOKS[0];
  });

  const [viewMode, setViewMode] = useState<'room' | 'detail'>('room');

  // Background live update from Google Sheets and preload covers
  useEffect(() => {
    let isMounted = true;

    // Trigger non-blocking live sync in background
    fetchLiveBookClubList().then((liveBooks) => {
      if (isMounted && liveBooks && liveBooks.length > 0) {
        setBooks(liveBooks);
        setSelectedBook((prev) => {
          const match = liveBooks.find((b) => b.id === prev.id);
          return match || liveBooks[0];
        });

        // Preload any missing covers in background
        preloadAndCacheBookCovers(liveBooks);
      }
    });

    // Handle cache reset event
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

  const handleSelectBookFromRoom = (book: BookClubBook) => {
    setSelectedBook(book);
    setViewMode('detail');
  };

  const handleSelectBookInDetail = (book: BookClubBook) => {
    setSelectedBook(book);
  };

  return (
    <div className={`w-full flex-1 flex flex-col ${viewMode === 'room' ? 'overflow-hidden' : ''}`}>
      {viewMode === 'room' ? (
        <AtmosphericRoom
          books={books}
          onSelectBook={handleSelectBookFromRoom}
          onOpenCatalog={() => setViewMode('detail')}
        />
      ) : (
        <BookDetailView
          books={books}
          selectedBook={selectedBook}
          onSelectBook={handleSelectBookInDetail}
          onBackToRoom={() => setViewMode('room')}
        />
      )}
    </div>
  );
};

export default BookClubPage;
