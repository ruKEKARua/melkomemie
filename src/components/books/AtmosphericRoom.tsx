import React, { useState, useEffect } from 'react';
import type { BookClubBook } from '../../api/bookClubData';
import BookShelf from './BookShelf';

interface AtmosphericRoomProps {
  books: BookClubBook[];
  onSelectBook: (book: BookClubBook) => void;
  onOpenCatalog: () => void;
}

export const AtmosphericRoom: React.FC<AtmosphericRoomProps> = ({
  books,
  onSelectBook,
  onOpenCatalog,
}) => {
  // Smooth 2.5s fade-in state
  const [isFadedIn, setIsFadedIn] = useState(false);

  useEffect(() => {
    // Trigger smooth fade-in after mount
    const timer = setTimeout(() => {
      setIsFadedIn(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Correct URL respecting Vite base URL (/movies/)
  const videoSrc = `${import.meta.env.BASE_URL}book-club-bg.mp4`;

  return (
    <div
      className={`relative w-full h-[calc(100vh-4.25rem)] overflow-hidden bg-black transition-opacity duration-[2500ms] ease-out select-none flex items-center justify-end ${
        isFadedIn ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Background Atmospheric Video - Full Bleed, Clean Atmosphere, No Obscuring Overlays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <video
          key={videoSrc}
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Main Room Arena: Left & Center display room video naturally, Right displays Bookcase */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-8 md:px-12 flex justify-end items-center">
        {/* Bookshelf on the right, matching Screenshot 1 */}
        <div className="w-full sm:w-[460px] md:w-[490px] lg:w-[500px]">
          <BookShelf
            books={books}
            onSelectBook={onSelectBook}
            onOpenCatalog={onOpenCatalog}
          />
        </div>
      </div>
    </div>
  );
};

export default AtmosphericRoom;
