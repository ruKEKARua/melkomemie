import React, { useState, useEffect } from 'react';
import {
  INITIAL_BOOK_CLUB_BOOKS,
  fetchLiveBookClubList,
  type BookClubBook,
} from '../api/bookClubData';
import AtmosphericRoom from '../components/books/AtmosphericRoom';
import BookDetailView from '../components/books/BookDetailView';

interface BookClubPageProps {
  onBack: () => void;
  isAuthorized?: boolean;
  userName?: string;
  userPicture?: string;
}

export const BookClubPage: React.FC<BookClubPageProps> = () => {
  const [books, setBooks] = useState<BookClubBook[]>(INITIAL_BOOK_CLUB_BOOKS);
  const [selectedBook, setSelectedBook] = useState<BookClubBook>(INITIAL_BOOK_CLUB_BOOKS[0]);
  const [viewMode, setViewMode] = useState<'room' | 'detail'>('room');

  // Load latest live books from Google Sheets asynchronously on mount
  useEffect(() => {
    let isMounted = true;
    fetchLiveBookClubList().then((liveBooks) => {
      if (isMounted && liveBooks && liveBooks.length > 0) {
        setBooks(liveBooks);
        setSelectedBook((prev) => {
          const match = liveBooks.find((b) => b.id === prev.id);
          return match || liveBooks[0];
        });
      }
    });

    return () => {
      isMounted = false;
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
