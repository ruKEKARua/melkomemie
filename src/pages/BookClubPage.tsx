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

export const BookClubPage: React.FC<BookClubPageProps> = ({ onBack }) => {
  const {
    books,
    selectedBook,
    viewMode,
    setViewMode,
    isMobile,
    handleSelectBookFromRoom,
    handleSelectBookInDetail,
  } = useBookClub();

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 h-full md:overflow-hidden overflow-y-auto bg-[#090a0f]">
      {/* Active DOM parallel image preload pool: forces browser network thread to download all covers in parallel */}
      <div
        className="absolute -top-[9999px] -left-[9999px] w-1 h-1 overflow-hidden opacity-0 pointer-events-none"
        aria-hidden="true"
      >
        {books.map((b) => (
          <img
            key={b.id}
            src={`${import.meta.env.BASE_URL}covers/book_${b.id}.jpg`}
            alt=""
            loading="eager"
            decoding="async"
          />
        ))}
      </div>
      {viewMode === 'room' && !isMobile ? (
        <AtmosphericRoom
          books={books}
          onSelectBook={handleSelectBookFromRoom}
          onOpenCatalog={() => setViewMode('detail')}
        />
      ) : (
        <BookDetailView
          books={books}
          selectedBook={selectedBook}
          isMobile={isMobile}
          onSelectBook={handleSelectBookInDetail}
          onBackToRoom={() => {
            if (!isMobile) {
              setViewMode('room');
            }
          }}
          onBack={onBack}
        />
      )}
    </div>
  );
};

export default BookClubPage;
