import { useState, useRef, useEffect } from 'react';

interface HeaderBurgerMenuProps {
  onAddMovie: () => void;
  onOpenTournaments: () => void;
  onOpenRoulette: () => void;
  onOpenCatalog?: () => void;
  className?: string;
}

export const HeaderBurgerMenu = ({
  onAddMovie,
  onOpenTournaments,
  onOpenRoulette,
  onOpenCatalog,
  className = '',
}: HeaderBurgerMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button (Burger Hamburger Icon) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Меню навигации"
        title="Меню"
        className={`flex items-center justify-center p-2 sm:px-2.5 sm:py-2 rounded-xl border transition-all cursor-pointer shadow-sm hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${
          isOpen
            ? 'bg-white/15 text-white border-amber-500/50 ring-1 ring-amber-500/30'
            : 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white'
        }`}
      >
        <svg
          className="w-5 h-5 transition-transform duration-200"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-64 sm:w-72 rounded-2xl bg-[#12141f] border border-white/10 shadow-2xl p-2 z-50 animate-modal-enter focus:outline-none ring-1 ring-black/40 text-left"
        >
          {/* Header */}
          <div className="px-3 py-1.5 mb-1.5 border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Меню киноклуба
            </span>
            <span className="text-[10px] text-amber-400 font-semibold">
              Разделы
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {/* 1. Add Movie Button */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onAddMovie();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer bg-gradient-to-r from-emerald-500/20 to-teal-500/10 hover:from-emerald-500/30 hover:to-teal-500/20 border border-emerald-500/30 text-white group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/25 flex items-center justify-center text-emerald-300 font-extrabold text-base shrink-0 group-hover:scale-110 transition-transform">
                +
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Добавить фильм
                </span>
                <span className="text-[10px] text-zinc-400 truncate">
                  Внести новый фильм с оценками
                </span>
              </div>
            </button>

            {/* 2. Tournaments */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onOpenTournaments();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer hover:bg-white/10 text-zinc-200 hover:text-white group border border-transparent hover:border-amber-500/20"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 text-base shrink-0 group-hover:scale-110 transition-transform">
                🏆
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                  Турниры
                </span>
                <span className="text-[10px] text-zinc-400 truncate">
                  Турнирная сетка и реплеи
                </span>
              </div>
            </button>

            {/* 3. Movie Roulette */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onOpenRoulette();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer hover:bg-white/10 text-zinc-200 hover:text-white group border border-transparent hover:border-indigo-500/20"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-base shrink-0 group-hover:scale-110 transition-transform">
                🎲
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                  Кинорулетка
                </span>
                <span className="text-[10px] text-zinc-400 truncate">
                  Случайный выбор фильма на вечер
                </span>
              </div>
            </button>

            {/* 4. Catalog (Home) if provided */}
            {onOpenCatalog && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onOpenCatalog();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all cursor-pointer hover:bg-white/5 text-zinc-400 hover:text-zinc-200 group border-t border-white/5 mt-0.5 pt-2"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 text-sm shrink-0 group-hover:text-white transition-colors">
                  🍿
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">
                    Каталог фильмов
                  </span>
                  <span className="text-[10px] text-zinc-500 truncate">
                    Главная страница библиотеки
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderBurgerMenu;
