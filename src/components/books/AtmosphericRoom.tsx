import React, { useState, useEffect } from 'react';
import type { BookClubBook } from '../../api/bookClubData';
import BookShelf from './BookShelf';

interface AtmosphericRoomProps {
  books: BookClubBook[];
  onSelectBook: (book: BookClubBook) => void;
  onOpenCatalog: () => void;
  onBackToMovies: () => void;
}

export const AtmosphericRoom: React.FC<AtmosphericRoomProps> = ({
  books,
  onSelectBook,
  onOpenCatalog,
  onBackToMovies,
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

  const handlePickRandomBook = () => {
    if (books.length === 0) return;
    const randomIndex = Math.floor(Math.random() * books.length);
    onSelectBook(books[randomIndex]);
  };

  // Calculate average rating
  const avgRating = (
    books.reduce((acc, b) => acc + (parseFloat(b.overallRating.replace(',', '.')) || 0), 0) /
    (books.length || 1)
  ).toFixed(1);

  // Correct URL respecting Vite base URL (/movies/)
  const videoSrc = `${import.meta.env.BASE_URL}book-club-bg.mp4`;

  return (
    <div
      className={`relative w-full min-h-[calc(100vh-4.5rem)] flex flex-col justify-between overflow-hidden bg-black transition-opacity duration-[2500ms] ease-out select-none ${
        isFadedIn ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Background Atmospheric Video - Full Bleed, Looped, High Atmosphere */}
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
        {/* Subtle top and bottom dark fades to blend seamlessly into header and footer */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
      </div>

      {/* Top Bar Navigation */}
      <header className="relative z-20 w-full px-4 sm:px-8 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToMovies}
            className="flex items-center gap-2 rounded-xl bg-black/60 hover:bg-black/80 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white transition cursor-pointer border border-white/15 backdrop-blur-md shadow-lg hover:scale-105"
            title="Вернуться к киноклубу"
          >
            <span>← Вернуться к фильмам</span>
          </button>
        </div>

        <div className="text-[11px] sm:text-xs text-amber-200/90 bg-black/60 px-3.5 py-1.5 rounded-full border border-amber-500/30 backdrop-blur-md shadow-md">
          Нажмите на книгу на полке, чтобы открыть описание и оценки
        </div>
      </header>

      {/* Main Room Arena: Left & Center display background video, Right displays Bookcase */}
      <main className="relative z-10 w-full flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-2 flex items-center justify-end">
        {/* Bookshelf on the right, perfectly matching Screenshot 1 layout */}
        <div className="w-full sm:w-[460px] md:w-[490px] lg:w-[500px]">
          <BookShelf
            books={books}
            onSelectBook={onSelectBook}
            onOpenCatalog={onOpenCatalog}
          />
        </div>
      </main>

      {/* Bottom Atmospheric Status Bar matching Screenshot 1 */}
      <footer className="relative z-20 w-full px-4 sm:px-8 py-3 bg-black/75 backdrop-blur-md border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-300">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-amber-400 font-bold">📚 Мелкомемье</span>
          <span className="text-zinc-600">•</span>
          <span>На полке: {books.length} произведений</span>
          <span className="text-zinc-600">•</span>
          <span className="text-amber-300 font-bold">Средний рейтинг: {avgRating} ★</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePickRandomBook}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition cursor-pointer border border-white/15 shadow-sm hover:scale-105"
          >
            <span>🎲</span>
            <span>Случайная книга с полки</span>
          </button>

          <button
            onClick={onOpenCatalog}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition cursor-pointer shadow-md hover:scale-105"
          >
            <span>📖</span>
            <span>Открыть каталог книг</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default AtmosphericRoom;
