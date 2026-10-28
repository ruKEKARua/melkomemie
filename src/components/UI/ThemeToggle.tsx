import { useState, useRef, useEffect } from 'react';
import { useTheme, type ThemePreference } from '../../utils/theme';

interface ThemeToggleProps {
  className?: string;
  variant?: 'dropdown' | 'segmented';
}

export const ThemeToggle = ({ className = '', variant = 'dropdown' }: ThemeToggleProps) => {
  const { themePreference, resolvedTheme, setThemePreference } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const options: { value: ThemePreference; label: string; sublabel: string; icon: string }[] = [
    {
      value: 'light',
      label: 'Светлая',
      sublabel: 'Приятная для глаз',
      icon: '☀️',
    },
    {
      value: 'dark',
      label: 'Тёмная',
      sublabel: 'Классический стиль',
      icon: '🌙',
    },
    {
      value: 'system',
      label: 'Системная',
      sublabel: `Авто (${resolvedTheme === 'dark' ? 'тёмная' : 'светлая'})`,
      icon: '💻',
    },
  ];

  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#131622] border border-slate-200 dark:border-white/10 ${className}`}
        role="radiogroup"
        aria-label="Выбор темы оформления"
      >
        {options.map((opt) => {
          const isActive = themePreference === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setThemePreference(opt.value)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5'
              }`}
              title={`${opt.label} — ${opt.sublabel}`}
            >
              <span>{opt.icon}</span>
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Current active trigger icon and label
  const currentIcon = themePreference === 'system' ? '💻' : themePreference === 'dark' ? '🌙' : '☀️';
  const currentLabel =
    themePreference === 'system'
      ? `Системная (${resolvedTheme === 'dark' ? 'тёмная' : 'светлая'})`
      : themePreference === 'dark'
      ? 'Тёмная'
      : 'Светлая';

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Тема оформления: ${currentLabel}. Нажмите для выбора.`}
        title={`Тема оформления: ${currentLabel}`}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-200 text-xs font-semibold backdrop-blur-md transition-all shadow-sm hover:scale-102 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/40"
      >
        <span className="text-sm leading-none">{currentIcon}</span>
        <span className="hidden sm:inline text-xs font-medium">
          {themePreference === 'system' ? 'Системная' : themePreference === 'dark' ? 'Тёмная' : 'Светлая'}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#141724] border border-slate-200 dark:border-white/10 shadow-2xl p-1.5 z-50 animate-modal-enter focus:outline-none ring-1 ring-black/5"
        >
          <div className="px-3 py-1.5 mb-1 border-b border-slate-100 dark:border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Тема оформления
            </span>
          </div>

          <div className="flex flex-col gap-1">
            {options.map((opt) => {
              const isSelected = themePreference === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setThemePreference(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold border border-amber-400/30'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{opt.icon}</span>
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-slate-900 dark:text-zinc-100">
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                        {opt.sublabel}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
