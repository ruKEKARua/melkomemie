import React from 'react';
import { useBookClub } from '../hooks/useBookClub';
import AtmosphericRoom from '../components/books/AtmosphericRoom';
import BookDetailView from '../components/books/BookDetailView';

interface BookClubPageProps {
  onBack: () => void;
  isAuthorized?: boolean;
  userName?: string;
  userPicture?: string;
}

export const BookClubPage: React.FC<BookClubPageProps> = () => {
  const {
    books,
    selectedBook,
    viewMode,
    setViewMode,
    handleSelectBookFromRoom,
    handleSelectBookInDetail,
  } = useBookClub();

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
