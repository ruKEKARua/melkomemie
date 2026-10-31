import { useState, useRef, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { getRatingBadgeColor } from '../../utils/ratings';

export interface ParticipantRatingRowProps {
  name: string;
  score?: string | number;
  index?: number;
  hasAsterisk?: boolean;
  variant?: 'movie' | 'book';
  tooltipText?: string;
}

const ParticipantRatingRowComponent = ({
  name,
  score,
  index = 0,
  hasAsterisk: explicitHasAsterisk,
  variant = 'movie',
  tooltipText,
}: ParticipantRatingRowProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeBelow: boolean } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const rawName = name ?? '';
  const hasAsterisk = explicitHasAsterisk || rawName.includes('*');
  const userInitial = rawName.trim() ? rawName.trim()[0].toUpperCase() : '?';

  const isBook = variant === 'book';

  const defaultTooltipText = isBook
    ? 'Прочтение было незадолго до или после обсуждения книжным клубом'
    : 'Просмотр был незадолго до или после просмотра киноклубом';

  const resolvedTooltipText = tooltipText || defaultTooltipText;

  const handleMouseEnter = () => {
    if (!hasAsterisk) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const rect = rowRef.current?.getBoundingClientRect();
      if (rect) {
        const placeBelow = rect.top < 80;
        setCoords({
          top: placeBelow ? rect.bottom + 8 : rect.top - 8,
          left: rect.left + rect.width / 2,
          placeBelow,
        });
        setShowTooltip(true);
      }
    }, 2500);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowTooltip(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showTooltip) return;
    const handleScroll = () => {
      setShowTooltip(false);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showTooltip]);

  const rowClasses = hasAsterisk
    ? 'bg-amber-100 hover:bg-amber-200/80 border-amber-300 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:border-amber-500/40 shadow-xs'
    : isBook
    ? 'bg-white dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.07] border-slate-200/60 dark:border-white/5'
    : 'bg-white dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.07] border-slate-200/60 dark:border-transparent';

  const nameClasses = hasAsterisk
    ? 'text-amber-950 dark:text-amber-100 font-bold'
    : 'text-slate-800 dark:text-zinc-200 font-medium';

  const avatarClasses = hasAsterisk
    ? 'bg-amber-400/40 text-amber-950 dark:bg-amber-400/25 dark:text-amber-200 border-amber-400/70 dark:border-amber-400/40 font-black'
    : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold';

  const paddingClass = isBook ? 'p-2' : 'p-2.5';
  const avatarSize = isBook ? 'h-6 w-6 text-[11px]' : 'h-7 w-7 text-xs';
  const nameSize = isBook ? 'text-xs' : 'text-sm';
  const badgePadding = isBook ? 'px-2 py-0.5' : 'px-2.5 py-0.5';

  return (
    <div
      ref={rowRef}
      key={`${rawName}-${index}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative flex items-center justify-between ${paddingClass} rounded-xl border transition-all duration-200 ${rowClasses}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`flex ${avatarSize} shrink-0 items-center justify-center rounded-full border ${avatarClasses}`}>
          {userInitial}
        </div>
        <span className={`${nameSize} truncate ${nameClasses}`}>
          {name}
        </span>
      </div>

      <span
        className={`${badgePadding} rounded-md text-xs font-black border ${
          hasAsterisk ? 'bg-white/85 dark:bg-black/40 shadow-xs ' : ''
        }${getRatingBadgeColor(score)}`}
      >
        {score ?? '—'}
      </span>

      {showTooltip &&
        coords &&
        createPortal(
          <div
            style={{
              top: coords.top,
              left: coords.left,
              transform: coords.placeBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            }}
            className={`fixed z-[9999] pointer-events-none ${
              isBook ? 'px-3 py-1.5' : 'px-3.5 py-2'
            } rounded-xl bg-slate-900/95 dark:bg-[#141824]/95 text-amber-100 dark:text-amber-200 text-xs font-medium shadow-2xl border border-amber-500/50 backdrop-blur-md max-w-xs text-center animate-fade-in flex items-center gap-2`}
          >
            <span className="text-amber-400 text-sm shrink-0">ℹ️</span>
            <span className="leading-snug">{resolvedTooltipText}</span>
          </div>,
          document.body
        )}
    </div>
  );
};

export const ParticipantRatingRow = memo(ParticipantRatingRowComponent);
export default ParticipantRatingRow;
