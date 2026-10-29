import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { GoogleBookVolume, BookClubData } from '../api/googleBooks';

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: GoogleBookVolume;
  clubData: BookClubData;
}

function getRatingBadgeColor(scoreStr?: string | number) {
  if (scoreStr === undefined || scoreStr === null || scoreStr === '') {
    return 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-300 dark:border-zinc-700';
  }
  const num = typeof scoreStr === 'number' ? scoreStr : parseFloat(String(scoreStr).replace(',', '.'));
  if (isNaN(num)) {
    return 'bg-zinc-700/90 text-zinc-200 border-zinc-600';
  }
  if (num >= 7.5) {
    return 'bg-emerald-500/95 text-white border-emerald-400/50 shadow-emerald-950/40';
  }
  if (num >= 6.0) {
    return 'bg-amber-500/95 text-slate-950 border-amber-400/50 shadow-amber-950/40';
  }
  return 'bg-[#78350f]/95 text-amber-100 border-[#92400e]/70 shadow-amber-950/40';
}

const ParticipantRatingItem = ({
  name,
  score,
  hasAsterisk,
  index,
}: {
  name: string;
  score: string;
  hasAsterisk: boolean;
  index: number;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeBelow: boolean } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const userInitial = name.trim() ? name.trim()[0].toUpperCase() : '?';

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
    }, 400); // Friendly fast tooltip
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

  const rowClasses = hasAsterisk
    ? 'bg-amber-100 hover:bg-amber-200/80 border-amber-300 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:border-amber-500/40 shadow-xs'
    : 'bg-white dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.07] border-slate-200/60 dark:border-transparent';

  const nameClasses = hasAsterisk
    ? 'text-amber-950 dark:text-amber-100 font-bold'
    : 'text-slate-800 dark:text-zinc-200 font-medium';

  const avatarClasses = hasAsterisk
    ? 'bg-amber-400/40 text-amber-950 dark:bg-amber-400/25 dark:text-amber-200 border-amber-400/70 dark:border-amber-400/40 font-black'
    : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold';

  const tooltipText = 'Прочтение было незадолго до или после заседания книжного клуба';

  return (
    <div
      ref={rowRef}
      key={`${name}-${index}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 ${rowClasses}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs border ${avatarClasses}`}>
          {userInitial}
        </div>
        <span className={`text-sm truncate ${nameClasses}`}>
          {name}
        </span>
      </div>
      <span
        className={`px-2.5 py-0.5 rounded-md text-xs font-black border ${
          hasAsterisk ? 'bg-white/85 dark:bg-black/40 shadow-xs ' : ''
        }${getRatingBadgeColor(score)}`}
      >
        {score || '—'}
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
            className="fixed z-[9999] pointer-events-none px-3.5 py-2 rounded-xl bg-slate-900/95 dark:bg-[#141824]/95 text-amber-100 dark:text-amber-200 text-xs font-medium shadow-2xl border border-amber-500/50 backdrop-blur-md max-w-xs text-center animate-fade-in flex items-center gap-2"
          >
            <span>⭐</span>
            <span>{tooltipText}</span>
          </div>,
          document.body,
        )}
    </div>
  );
};

export const BookModal: React.FC<BookModalProps> = ({
  isOpen,
  onClose,
  book,
  clubData,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'sheet'>('details');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const info = book.volumeInfo;
  const coverUrl =
    info.imageLinks?.medium ||
    info.imageLinks?.large ||
    info.imageLinks?.thumbnail ||
    'https://upload.wikimedia.org/wikipedia/commons/f/fb/Animal_Farm_-_1st_edition.jpg';

  const authorName = info.authors?.join(', ') || clubData.author;
  const overallBadgeStyle = getRatingBadgeColor(clubData.overallRating);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden rounded-3xl bg-white dark:bg-[#12141f] border border-slate-200/80 dark:border-white/10 shadow-2xl animate-modal-enter text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-200/70 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white transition cursor-pointer"
        >
          ✕
        </button>

        {/* Header Tabs */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📚</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                {info.title || clubData.book}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {authorName} {info.publishedDate ? `(${info.publishedDate})` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs mr-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                activeTab === 'details'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Карточка клуба
            </button>
            <button
              onClick={() => setActiveTab('sheet')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                activeTab === 'sheet'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Сводка (Google Таблица)
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 md:p-7 overflow-y-auto max-h-[calc(92vh-80px)]">
          {activeTab === 'details' ? (
            <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-6 md:gap-8 items-start">
              {/* Left Column: Book Details & Synopsis */}
              <div className="flex flex-col gap-5">
                <div className="flex gap-4 sm:gap-6 items-start">
                  <div className="w-28 sm:w-36 aspect-[2/3] shrink-0 rounded-xl overflow-hidden shadow-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/30">
                    <img
                      src={coverUrl}
                      alt={info.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex flex-col gap-2 min-w-0">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 w-fit">
                      Книга книжного клуба
                    </span>

                    <h3 className="text-lg sm:text-xl font-black leading-tight text-slate-900 dark:text-white">
                      {info.title}
                    </h3>
                    <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                      {authorName}
                    </p>

                    <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-zinc-400 mt-1">
                      {info.publishedDate && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                          📅 {info.publishedDate}
                        </span>
                      )}
                      {info.pageCount && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                          📖 {info.pageCount} стр.
                        </span>
                      )}
                      {info.language && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 uppercase">
                          🌐 {info.language}
                        </span>
                      )}
                    </div>

                    {/* Overall Score Badge */}
                    <div className="mt-2 flex items-center gap-3">
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-sm border shadow-sm ${overallBadgeStyle}`}
                      >
                        <span>★</span>
                        <span>{clubData.overallRating}</span>
                      </div>
                      <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                        Общая оценка книжного клуба
                      </span>
                    </div>
                  </div>
                </div>

                {/* Categories */}
                {info.categories && info.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {info.categories.map((cat, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-medium"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                {/* Synopsis */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">
                    Описание книги
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed line-clamp-6">
                    {info.description || 'Описание отсутствует в базе данных Google Books.'}
                  </p>
                </div>
              </div>

              {/* Right Column: Club Ratings List */}
              <div className="flex flex-col rounded-2xl bg-slate-50 dark:bg-[#171a27] p-5 border border-slate-200 dark:border-white/10 shadow-lg">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-base">👥</span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Оценки участников
                    </h4>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    {clubData.participants.length} оценок
                  </span>
                </div>

                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                  {clubData.participants.map((item, index) => (
                    <ParticipantRatingItem
                      key={`${item.name}-${index}`}
                      name={item.name}
                      score={item.score}
                      hasAsterisk={item.hasAsterisk}
                      index={index}
                    />
                  ))}
                </div>

                {/* Legend for asterisks */}
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span>
                    Жёлтым фоном и звёздочкой (*) отмечены гости или прочтение вне основного заседания.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Screenshot 1 recreation: Google Sheets table */
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                    Сводная таблица оценок клуба
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Оценки участников и итоговый балл книги
                  </p>
                </div>
              </div>

              {/* Exact Google Spreadsheet view */}
              <div className="overflow-x-auto rounded-xl border border-slate-400 dark:border-zinc-700 shadow-md bg-white text-slate-900">
                <table className="w-full border-collapse font-sans text-sm select-none">
                  {/* Column Header identifiers like Google Sheets */}
                  <thead>
                    <tr className="bg-[#f3f3f3] text-zinc-600 text-xs font-bold border-b border-slate-300">
                      <th className="w-10 py-1.5 px-2 border-r border-slate-300 text-center font-normal text-zinc-400">
                        #
                      </th>
                      <th className="py-2 px-4 border-r border-slate-300 text-center font-bold">
                        E
                      </th>
                      <th className="py-2 px-4 border-r border-slate-300 text-center font-bold">
                        F
                      </th>
                      <th className="py-2 px-4 border-r border-slate-300 text-center font-bold">
                        G
                      </th>
                    </tr>
                    <tr className="bg-[#fafafa] font-bold text-slate-900 border-b-2 border-slate-900">
                      <th className="w-10 py-2 border-r border-slate-300 text-center font-normal text-zinc-400">
                        1
                      </th>
                      <th className="py-2 px-6 border-r border-slate-400 text-center font-black">
                        Участники
                      </th>
                      <th className="py-2 px-6 border-r border-slate-400 text-center font-black">
                        Оценка
                      </th>
                      <th className="py-2 px-6 text-center font-black">
                        Общая оценка
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {clubData.participants.map((p, idx) => (
                      <tr
                        key={p.name}
                        className={`border-b border-slate-300 transition-colors ${
                          p.hasAsterisk ? 'bg-[#ffff00] font-medium' : 'bg-white'
                        }`}
                      >
                        <td className="w-10 py-2 border-r border-slate-300 text-center text-xs text-zinc-400 font-mono">
                          {idx + 2}
                        </td>
                        <td className="py-2 px-6 border-r border-slate-400 text-left font-medium">
                          {p.name}
                        </td>
                        <td className="py-2 px-6 border-r border-slate-400 text-right font-medium font-mono">
                          {p.score}
                        </td>

                        {/* Merged cell for G (Overall rating) */}
                        {idx === 0 ? (
                          <td
                            rowSpan={clubData.participants.length}
                            className="py-4 px-6 text-center font-bold text-base align-middle bg-white border-l border-slate-300"
                          >
                            <div className="flex flex-col items-center justify-center">
                              <span className="text-xl sm:text-2xl font-black text-slate-950 font-mono">
                                {clubData.overallRating}
                              </span>
                              <span className="text-[11px] text-zinc-500 font-normal mt-0.5">
                                средний балл
                              </span>
                            </div>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default BookModal;
