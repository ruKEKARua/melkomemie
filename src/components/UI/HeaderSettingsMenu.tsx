import { useState, useRef, useEffect } from 'react';
import { useTheme, type ThemePreference } from '../../utils/theme';
import type { MovieSource } from '../../api/movieSource';

interface HeaderSettingsMenuProps {
  isAuthorized: boolean;
  userName?: string;
  userPicture?: string;
  onLogin?: () => void;
  onLogout?: () => void;
  movieDatabaseSource?: MovieSource;
  onSourceChange?: (source: MovieSource) => void;
  className?: string;
}

export const HeaderSettingsMenu = ({
  isAuthorized,
  userName,
  userPicture,
  onLogin,
  onLogout,
  movieDatabaseSource,
  onSourceChange,
  className = '',
}: HeaderSettingsMenuProps) => {
  const { themePreference, resolvedTheme, setThemePreference } = useTheme();
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

  const themeOptions: { value: ThemePreference; label: string; sublabel: string; icon: string }[] = [
    {
      value: 'light',
      label: 'Светлая тема',
      sublabel: 'Дневной режим',
      icon: '☀️',
    },
    {
      value: 'dark',
      label: 'Тёмная тема',
      sublabel: 'Классический кинозал',
      icon: '🌙',
    },
    {
      value: 'system',
      label: 'Системная тема',
      sublabel: `Авто (${resolvedTheme === 'dark' ? 'тёмная' : 'светлая'})`,
      icon: '💻',
    },
  ];

  return (
    <div ref={menuRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button (Gear Settings Icon) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Настройки"
        title="Настройки"
        className={`flex items-center justify-center p-2 sm:px-2.5 sm:py-2 rounded-xl border transition-all cursor-pointer shadow-sm hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500/40 group ${
          isOpen
            ? 'bg-white/15 text-white border-amber-500/50 ring-1 ring-amber-500/30'
            : 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white'
        }`}
      >
        <svg
          className={`w-5 h-5 transition-transform duration-300 ${
            isOpen ? 'rotate-90 text-amber-400' : 'group-hover:rotate-45 text-zinc-300 group-hover:text-white'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#12141f] border border-white/10 shadow-2xl p-2.5 z-50 animate-modal-enter focus:outline-none ring-1 ring-black/40 text-left"
        >
          {/* Header */}
          <div className="px-2.5 py-1 mb-2 border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Настройки
            </span>
            <span className="text-[10px] text-zinc-500">
              Параметры
            </span>
          </div>

          {/* Section 1: Theme Options (Requirement: кнопка темы должна быть в шестерёнках) */}
          <div className="flex flex-col gap-1">
            <div className="px-2 pt-0.5 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/90">
                Тема оформления сайта
              </span>
            </div>

            {themeOptions.map((opt) => {
              const isSelected = themePreference === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setThemePreference(opt.value);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-400/30'
                      : 'text-zinc-300 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base leading-none shrink-0">{opt.icon}</span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-xs text-zinc-100 truncate">
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-zinc-400 truncate">
                        {opt.sublabel}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span
                      className="w-2 h-2 rounded-full bg-amber-500 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Section 2: Movie Database Source */}
          {movieDatabaseSource && onSourceChange && (
            <div className="mt-2.5 pt-2 border-t border-white/5">
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  База фильмов
                </span>
                <span className="text-[10px] text-amber-400/90 font-mono font-semibold">
                  {movieDatabaseSource.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/30 border border-white/5">
                <button
                  type="button"
                  onClick={() => onSourceChange('tmdb')}
                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                    movieDatabaseSource === 'tmdb'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  TMDB
                </button>
                <button
                  type="button"
                  onClick={() => onSourceChange('kinopoisk')}
                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                    movieDatabaseSource === 'kinopoisk'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Кинопоиск
                </button>
              </div>
            </div>
          )}

          {/* Section 3: User Account */}
          <div className="mt-2.5 pt-2 border-t border-white/5">
            <div className="px-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Аккаунт
              </span>
            </div>

            {isAuthorized ? (
              <div className="flex flex-col gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2.5 min-w-0">
                  {userPicture ? (
                    <img
                      src={userPicture}
                      alt={userName || 'Аватар'}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover border border-amber-500/60 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400 border border-amber-500/40 shrink-0">
                      {userName ? userName[0].toUpperCase() : '👤'}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-white truncate">
                      {userName || 'Участник клуба'}
                    </span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Авторизован
                    </span>
                  </div>
                </div>

                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      setIsOpen(false);
                    }}
                    className="w-full mt-1 py-1.5 px-3 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors cursor-pointer text-center"
                  >
                    Выйти из аккаунта
                  </button>
                )}
              </div>
            ) : (
              onLogin && (
                <button
                  type="button"
                  onClick={() => {
                    onLogin();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Войти через Google</span>
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderSettingsMenu;
