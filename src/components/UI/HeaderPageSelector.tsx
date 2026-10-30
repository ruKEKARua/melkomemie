import { useState, useRef, useEffect } from 'react';

export type PageMode = 'main' | 'entry' | 'roulette' | 'tournaments' | 'book-club';

interface HeaderPageSelectorProps {
  currentPage: PageMode;
  isAuthorized?: boolean;
  onSelectCatalog: () => void;
  onSelectTournaments: () => void;
  onSelectRoulette: () => void;
  onSelectBookClub: () => void;
  onSelectAddMovie: () => void;
  align?: 'left' | 'right';
  className?: string;
}

interface PageOption {
  id: PageMode;
  title: string;
  subtitle: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  action: () => void;
}

export const HeaderPageSelector = ({
  currentPage,
  isAuthorized = false,
  onSelectCatalog,
  onSelectTournaments,
  onSelectRoulette,
  onSelectBookClub,
  onSelectAddMovie,
  align = 'left',
  className = '',
}: HeaderPageSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
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

  // Current page presentation configuration
  const pageDetails: Record<
    PageMode,
    { title: string; icon: string }
  > = {
    main: { title: 'Каталог', icon: '🍿' },
    tournaments: { title: 'Турниры', icon: '🏆' },
    roulette: { title: 'Рулетка', icon: '🎲' },
    'book-club': { title: 'Книжный клуб', icon: '📚' },
    entry: { title: 'Добавить фильм', icon: '➕' },
  };

  const currentPageInfo = pageDetails[currentPage] ?? pageDetails.main;

  const mainPages: PageOption[] = [
    {
      id: 'main',
      title: 'Каталог',
      subtitle: 'Библиотека фильмов',
      icon: '🍿',
      badgeBg: 'bg-amber-500/15',
      badgeText: 'text-amber-400',
      badgeBorder: 'border-amber-500/20',
      action: onSelectCatalog,
    },
    {
      id: 'tournaments',
      title: 'Турниры',
      subtitle: 'Сетка турниров и матчи',
      icon: '🏆',
      badgeBg: 'bg-amber-500/15',
      badgeText: 'text-amber-400',
      badgeBorder: 'border-amber-500/20',
      action: onSelectTournaments,
    },
    {
      id: 'roulette',
      title: 'Рулетка',
      subtitle: 'Случайный выбор фильма',
      icon: '🎲',
      badgeBg: 'bg-indigo-500/20',
      badgeText: 'text-indigo-400',
      badgeBorder: 'border-indigo-500/20',
      action: onSelectRoulette,
    },
    {
      id: 'book-club',
      title: 'Книжный клуб',
      subtitle: 'Каталог и оценки книг',
      icon: '📚',
      badgeBg: 'bg-emerald-500/20',
      badgeText: 'text-emerald-400',
      badgeBorder: 'border-emerald-500/20',
      action: onSelectBookClub,
    },
  ];

  const handleSelect = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div ref={selectorRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button - Sleek page selector matching reference */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Выбор страницы"
        title="Переключить раздел"
        className={`group flex items-center justify-between gap-2.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl border transition-all duration-200 cursor-pointer shadow-sm select-none ${
          isOpen
            ? 'bg-white/15 text-white border-amber-500/60 ring-2 ring-amber-500/25 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
            : 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white hover:border-amber-500/40 hover:shadow-[0_0_15px_rgba(245,158,11,0.12)]'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base sm:text-lg leading-none shrink-0" aria-hidden="true">
            {currentPageInfo.icon}
          </span>
          <span className="text-xs sm:text-sm font-bold tracking-tight text-white whitespace-nowrap">
            {currentPageInfo.title}
          </span>
        </div>

        {/* Chevron Down Arrow (Rotates when open) */}
        <svg
          className={`w-4 h-4 text-zinc-400 group-hover:text-amber-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Floating Dropdown Selector */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Список страниц"
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-64 sm:w-72 rounded-2xl bg-[#12141f]/95 backdrop-blur-xl border border-white/10 shadow-2xl p-2 z-50 animate-modal-enter focus:outline-none ring-1 ring-black/50 text-left`}
        >
          {/* Header */}
          <div className="px-3 py-1.5 mb-1.5 border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Разделы
            </span>
            <span className="text-[10px] text-amber-400 font-semibold">
               
            </span>
          </div>

          {/* Main Pages List */}
          <div className="flex flex-col gap-1.5">
            {mainPages.map((page) => {
              const isCurrent = currentPage === page.id;
              return (
                <button
                  key={page.id}
                  type="button"
                  role="option"
                  aria-selected={isCurrent}
                  onClick={() => handleSelect(page.action)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer group border ${
                    isCurrent
                      ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-sm ring-1 ring-amber-500/20'
                      : 'border-white/5 bg-white/[0.03] hover:bg-white/10 text-zinc-300 hover:text-white hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg ${page.badgeBg} ${page.badgeText} border ${page.badgeBorder} flex items-center justify-center text-base shrink-0 group-hover:scale-110 transition-transform`}
                    >
                      {page.icon}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className={`text-xs font-bold ${isCurrent ? 'text-amber-400' : 'text-white group-hover:text-amber-300'} transition-colors`}>
                        {page.title}
                      </span>
                    </div>
                  </div>

                  {/* Lock indicator if unauthorized */}
                  {!isAuthorized && page.id !== 'roulette' && (
                    <span
                      className="text-[10px] text-zinc-400 group-hover:text-amber-400 flex items-center gap-1 font-medium shrink-0 bg-white/5 px-2 py-0.5 rounded-md border border-white/10"
                      title="Требуется авторизация"
                    >
                      <span>🔒</span>
                      <span className="hidden sm:inline">Вход</span>
                    </span>
                  )}
                </button>
              );
            })}

            {/* Separator */}
            <div className="my-1 border-t border-white/5" />

            {/* Action Item: Add Movie */}
            <button
              type="button"
              role="option"
              aria-selected={currentPage === 'entry'}
              onClick={() => handleSelect(onSelectAddMovie)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer group border ${
                currentPage === 'entry'
                  ? 'bg-emerald-500/25 border-emerald-500/60 text-white ring-1 ring-emerald-500/30'
                  : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 hover:from-emerald-500/30 hover:to-teal-500/20 border-emerald-500/30 text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/25 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-extrabold text-base shrink-0 group-hover:scale-110 transition-transform">
                  ➕
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Добавить фильм
                  </span>
                </div>
              </div>

              {!isAuthorized ? (
                <span
                  className="text-[10px] text-zinc-400 group-hover:text-amber-400 flex items-center gap-1 font-medium shrink-0 bg-white/5 px-2 py-0.5 rounded-md border border-white/10"
                  title="Требуется авторизация"
                >
                  <span>🔒</span>
                  <span className="hidden sm:inline">Вход</span>
                </span>
              ) : currentPage === 'entry' ? (
                <span className="text-emerald-400 text-xs font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 shrink-0">
                  ✓
                </span>
              ) : null}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderPageSelector;
