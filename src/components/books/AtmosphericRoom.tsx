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

  // Interactive room states
  const [isLampOn, setIsLampOn] = useState(true);
  const [fireLevel, setFireLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [catPurrNotice, setCatPurrNotice] = useState(false);

  useEffect(() => {
    // Trigger smooth fade-in right after initial paint
    const timer = setTimeout(() => {
      setIsFadedIn(true);
    }, 60);
    return () => clearTimeout(timer);
  }, []);

  const handlePickRandomBook = () => {
    if (books.length === 0) return;
    const randomIndex = Math.floor(Math.random() * books.length);
    onSelectBook(books[randomIndex]);
  };

  const cycleFire = () => {
    if (fireLevel === 'low') setFireLevel('medium');
    else if (fireLevel === 'medium') setFireLevel('high');
    else setFireLevel('low');
  };

  const triggerCatPurr = () => {
    setCatPurrNotice(true);
    setTimeout(() => setCatPurrNotice(false), 2500);
  };

  // Calculate average rating
  const avgRating = (
    books.reduce((acc, b) => acc + (parseFloat(b.overallRating.replace(',', '.')) || 0), 0) /
    (books.length || 1)
  ).toFixed(1);

  const fireNames = {
    low: 'Уютный',
    medium: 'Средний',
    high: 'Жаркий',
  };

  return (
    <div
      className={`relative w-full min-h-[calc(100vh-5rem)] flex flex-col justify-between overflow-hidden bg-[#07090e] transition-opacity duration-[2500ms] ease-out select-none ${
        isFadedIn ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Background Atmospheric Video */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <video
          src="/book-club-bg.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-85 filter contrast-105"
        />
        {/* Cinematic Vignette Gradients */}
        <div className="absolute inset-0 bg-radial from-transparent via-[#07090e]/40 to-[#07090e]/95 pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#07090e] via-[#07090e]/60 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#07090e] via-[#07090e]/70 to-transparent pointer-events-none" />

        {/* Dynamic Light overlays */}
        {isLampOn && (
          <div className="absolute top-[28%] left-[24%] w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none transition-opacity duration-700" />
        )}
        <div
          className={`absolute top-[40%] left-[45%] -translate-x-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            fireLevel === 'high'
              ? 'bg-orange-500/25 scale-125'
              : fireLevel === 'medium'
              ? 'bg-orange-500/15 scale-100'
              : 'bg-orange-500/10 scale-75'
          }`}
        />
      </div>

      {/* Top Bar Navigation */}
      <header className="relative z-20 w-full px-4 sm:px-8 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToMovies}
            className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white transition cursor-pointer border border-white/15 backdrop-blur-md shadow-md hover:scale-105"
            title="Вернуться к киноклубу"
          >
            <span>← Вернуться к фильмам</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold backdrop-blur-md">
            <span>📚</span>
            <span>Интерактивная комната книжного клуба</span>
          </div>
        </div>

        <div className="text-[11px] sm:text-xs text-zinc-400 bg-black/40 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
          Нажимайте на книги на полке для выбора произведения
        </div>
      </header>

      {/* Main Room Arena */}
      <main className="relative z-10 w-full flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left Side: Cozy Armchair & Fireplace Hotspots */}
        <div className="flex-1 w-full flex flex-col md:flex-row items-center justify-around gap-6 py-6">
          {/* Armchair + Lamp Hotspot */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => setIsLampOn((prev) => !prev)}
              className="px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border transition-all duration-300 cursor-pointer shadow-lg hover:scale-105 flex items-center gap-1.5 bg-black/60 hover:bg-black/80 text-amber-200 border-amber-400/40"
            >
              <span className={`w-2 h-2 rounded-full ${isLampOn ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : 'bg-zinc-600'}`} />
              <span>{isLampOn ? 'Торшер включён • Кликните' : 'Торшер выключен • Кликните'}</span>
            </button>

            {/* Cozy Cat Interactive Spot */}
            <div
              onClick={triggerCatPurr}
              className="mt-6 flex flex-col items-center cursor-pointer group"
              title="Погладить кота"
            >
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner">
                🐱
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                {catPurrNotice ? 'Муррр... 🐾' : 'Кот Василий спит'}
              </span>
            </div>
          </div>

          {/* Fireplace Hotspot */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={cycleFire}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border transition-all duration-300 cursor-pointer shadow-lg hover:scale-105 flex items-center gap-2 bg-black/60 hover:bg-black/80 text-orange-200 border-orange-500/40"
            >
              <span className="animate-pulse">🔥</span>
              <span>Подкинуть дров (Огонь: {fireNames[fireLevel]})</span>
            </button>

            <div className="w-20 h-20 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-4xl shadow-inner mt-4">
              ♨️
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Bookshelf (The Core Menu) */}
        <div className="w-full lg:w-[480px] xl:w-[500px] shrink-0">
          <BookShelf
            books={books}
            onSelectBook={onSelectBook}
            onOpenCatalog={onOpenCatalog}
          />
        </div>
      </main>

      {/* Bottom Atmospheric Status Bar */}
      <footer className="relative z-20 w-full px-4 sm:px-8 py-3 bg-black/60 backdrop-blur-md border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-300">
        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-bold">📚 Мелкомемье Клуб</span>
          <span>•</span>
          <span>На полке: {books.length} произведений</span>
          <span>•</span>
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold transition cursor-pointer shadow-md hover:scale-105"
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
