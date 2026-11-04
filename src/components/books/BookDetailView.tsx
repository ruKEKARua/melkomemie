import { roundRating } from '../../utils/ratings';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { BookClubBook } from '../../api/bookClubData';
import { ParticipantRatingRow } from '../shared/ParticipantRatingRow';
import { useBookDetails } from '../../hooks/useBookDetails';

// Палитра глубоких библиотечных оттенков для 3D-корешков
const SPINE_COLORS = [
  '#2b5b4e', // №1 Изумрудный (Скотный двор)
  '#243b67', // №2 Кобальтовый синий (Пиковая дама)
  '#3b532f', // №3 Оливково-зеленый (Странная история...)
  '#8e4728', // №4 Терракотово-кожаный (На дне)
  '#553860', // №5 Пыльно-фиолетовый (Москва-Петушки)
  '#6e2238', // №6 Бордовый / винный (Страх и отвращение...)
  '#846823', // №7 Горчично-охристый (Гобсек)
  '#296e73', // №8 Глубокий бирюзовый (Если все кошки в мире исчезнут)
  '#4a3228', // №9 Темный шоколад
  '#2d4c3e', // №10 Темно-хвойный
  '#632c24', // №11 Красное дерево
  '#363b59', // №12 Сумеречный индиго
  '#6e5226', // №13 Старая бронза
  '#4d273f', // №14 Сливовый бархат
  '#2c4957', // №15 Морская глубина
];

// Декоративный SVG-уголок (золотая филигрань) для блока номера книги
const FiligreeCorner = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={`w-3.5 h-3.5 text-[#e6cf8b]/65 pointer-events-none select-none ${className}`}
  >
    <path
      d="M2 22V6C2 3.79086 3.79086 2 6 2H22"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M5 16V7.5C5 6.11929 6.11929 5 7.5 5H16"
      stroke="currentColor"
      strokeWidth="1"
      strokeOpacity="0.7"
      strokeLinecap="round"
    />
    <circle cx="5.5" cy="5.5" r="1.3" fill="currentColor" />
    <path
      d="M9 2.5C9 4.5 7.5 6 5.5 6C7.5 6 9 7.5 9 9.5"
      stroke="currentColor"
      strokeWidth="1"
      strokeOpacity="0.75"
    />
  </svg>
);

interface BookDetailViewProps {
  books: BookClubBook[];
  selectedBook: BookClubBook;
  isMobile?: boolean;
  onSelectBook: (book: BookClubBook) => void;
  onBackToRoom: () => void;
  onBack?: () => void;
}

export const BookDetailView: React.FC<BookDetailViewProps> = ({
  books,
  selectedBook,
  onSelectBook,
  onBackToRoom,
}) => {
  const cardRef = useRef<HTMLElement>(null);
  const descRef = useRef<HTMLDivElement>(null);
  const ratingsRef = useRef<HTMLDivElement>(null);
  const [hoveredBookId, setHoveredBookId] = useState<number | null>(null);

  // Cinematic 1.5s immersion in darkness & 1.5s emergence
  const [displayedBook, setDisplayedBook] = useState<BookClubBook>(selectedBook);
  const [targetBook, setTargetBook] = useState<BookClubBook | null>(null);
  const [phase, setPhase] = useState<'idle' | 'sinking' | 'emerging'>('idle');

  const targetBookRef = useRef<BookClubBook | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ANIM_DURATION_MS = 500;

  const {
    activeCover,
    onCoverError,
    publisherDisplay,
    publishedYearDisplay,
    descriptionDisplay,
    pageCountDisplay,
    genresDisplay,
  } = useBookDetails(displayedBook);

  // Synchronize silently when selectedBook changes externally and we are idle
  useEffect(() => {
    if (phase === 'idle' && !targetBookRef.current) {
      setDisplayedBook(selectedBook);
    }
  }, [selectedBook, phase]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const completeSinkToEmergence = useCallback(() => {
    const next = targetBookRef.current;
    if (!next) {
      setPhase('idle');
      return;
    }

    // Switch data in 100% total darkness
    setDisplayedBook(next);

    // Reset scroll positions of text containers
    if (descRef.current) descRef.current.scrollTop = 0;
    if (ratingsRef.current) ratingsRef.current.scrollTop = 0;

    // Begin 1.5s emergence out of the darkness
    setPhase('emerging');

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPhase('idle');
      setTargetBook(null);
      targetBookRef.current = null;
    }, ANIM_DURATION_MS);
  }, []);

  const handleBookClick = (book: BookClubBook) => {
    // If clicking current book while idle, nothing to do
    if (book.id === displayedBook.id && phase === 'idle') return;
    // If clicking current target while sinking, nothing to do
    if (book.id === targetBookRef.current?.id && phase === 'sinking') return;

    // Update bookshelf immediately
    onSelectBook(book);

    if (typeof window !== 'undefined' && window.innerWidth < 768 && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    targetBookRef.current = book;
    setTargetBook(book);

    if (phase === 'sinking') {
      // Already sinking: keep plunge timer running to finish into total darkness,
      // where it will seamlessly reveal the newest target
      return;
    }

    // Phase was idle or emerging -> plunge into darkness (1.5s)
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setPhase('sinking');
    timerRef.current = setTimeout(() => {
      completeSinkToEmergence();
    }, ANIM_DURATION_MS);
  };

  return (
    <div className="flex-1 w-full max-w-[1700px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 flex flex-col gap-3 md:gap-2.5 animate-fade-in text-slate-900 dark:text-white md:h-full md:min-h-0 md:overflow-hidden select-none">
      {/* Top Navigation Bar: Clean back action suited for desktop and mobile */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10 shrink-0">
        <button
          onClick={onBackToRoom}
          className="flex items-center gap-2 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 hover:bg-amber-500/25 dark:hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-200 border border-amber-500/35 dark:border-amber-500/40 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold transition cursor-pointer shadow-xs dark:shadow-md hover:scale-105 active:scale-95"
          title="Вернуться в интерактивную комнату"
        >
          <span>🚪</span>
          <span>← Вернуться в комнату</span>
        </button>
      </div>

      {/* Main Arena:
          - Desktop (>= md / 768px): Strict 2-panel arena side-by-side fitting viewport (Screenshot 1)
          - Mobile (< md / 768px): Clean vertical stacked layout with full-width cards
      */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[1fr_clamp(310px,calc(29vw-25px),420px)] xl:grid-cols-[1fr_clamp(350px,calc(27vw-25px),450px)] gap-5 md:gap-4 lg:gap-5 items-start md:items-stretch md:overflow-hidden pb-8 md:pb-0">
        {/* =========================================================================
            LEFT MAIN CONTENT AREA (BOOK DETAIL CARD):
            - Desktop: Proportional dimensions fitting viewport height seamlessly
            - Mobile: Full width card with readable text and natural spacing
            ========================================================================= */}
        <section
          ref={cardRef}
          className={`w-full rounded-2xl sm:rounded-3xl border p-4 sm:p-5 md:p-5 xl:p-6 shadow-xl dark:shadow-2xl backdrop-blur-xl flex flex-col relative overflow-hidden md:h-full md:min-h-0 transition-colors duration-[1500ms] ease-in-out ${
            phase !== 'idle'
              ? 'bg-[#030407] border-white/5'
              : 'bg-white/95 dark:bg-[#0f121d]/90 border-slate-200 dark:border-white/10'
          }`}
        >
          {/* Animated Content Wrapper: sinks into total darkness (5s) and emerges (5s) */}
          <div
            className={`w-full h-full flex flex-col relative z-10 ${
              phase === 'sinking'
                ? 'book-sink-content'
                : phase === 'emerging'
                ? 'book-emerge-content'
                : ''
            }`}
          >
            {/* Ambient Background Hue */}
            <div
              className="absolute top-0 right-0 w-80 h-80 opacity-10 dark:opacity-15 filter blur-3xl pointer-events-none rounded-full transition-opacity duration-1000"
              style={{ background: displayedBook.spineAccent }}
            />

            <div className="grid grid-cols-1 md:grid-cols-[1fr_clamp(160px,18vw,220px)] xl:grid-cols-[1fr_clamp(180px,18vw,235px)] gap-4 md:gap-4 lg:gap-6 items-stretch relative z-10 md:h-full md:min-h-0">
              {/* -------------------------------------------------------------
                  LEFT SUB-COLUMN: Metadata, Edition, and Full Description
                  ------------------------------------------------------------- */}
              <div className="flex flex-col gap-3 md:gap-2.5 min-w-0 md:h-full md:min-h-0">
                {/* Header Title & Author */}
                <div className="flex flex-col gap-1 sm:gap-1.5 shrink-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow-sm">
                      Книжный клуб
                    </span>
                    {displayedBook.date && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-300">
                        📅 {displayedBook.date}
                      </span>
                    )}
                    {publishedYearDisplay && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                        Год: {publishedYearDisplay}
                      </span>
                    )}
                  </div>

                  <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight drop-shadow-xs dark:drop-shadow-md break-words">
                    {displayedBook.title}
                  </h1>

                  <h2 className="text-sm sm:text-base lg:text-lg font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                    {displayedBook.author}
                  </h2>

                  {displayedBook.subtitle && (
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 italic line-clamp-2">
                      {displayedBook.subtitle}
                    </p>
                  )}
                </div>

                {/* MOBILE ONLY: Compact Cover + Key Stats Row (hidden on md+) */}
                <div className="flex md:hidden items-start gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 my-1">
                  <div className="relative aspect-[2/3] w-24 sm:w-28 shrink-0 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-slate-900">
                    <img
                      src={activeCover}
                      alt={displayedBook.title}
                      onError={onCoverError}
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />
                  </div>

                  <div className="flex-1 flex flex-col gap-2 min-w-0">
                    <div className="flex items-center gap-1.5 self-start rounded-lg bg-amber-500/15 dark:bg-amber-500/20 px-2 py-0.5 text-xs font-black text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      <span className="text-amber-600 dark:text-amber-400">★</span>
                      <span>{roundRating(displayedBook.overallRating)} / 10</span>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                        Издание
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200 line-clamp-2">
                        {publisherDisplay}
                        {publishedYearDisplay ? ` (${publishedYearDisplay} г.)` : ''}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {pageCountDisplay && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-[10px] text-slate-600 dark:text-zinc-300">
                          📄 {pageCountDisplay} стр.
                        </span>
                      )}
                      {displayedBook.language && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-[10px] text-slate-600 dark:text-zinc-300">
                          🌐 {displayedBook.language}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* DESKTOP ONLY: Edition / Publisher (hidden on mobile, shown on md+) */}
                <div className="hidden md:flex px-3 py-1.5 sm:py-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 flex-col gap-0.5 shrink-0">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Издание и публикация
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-200 truncate">
                    {publisherDisplay}
                    {publishedYearDisplay ? ` (${publishedYearDisplay} г.)` : ''}
                  </span>
                </div>

                {/* DESKTOP ONLY: Secondary Information Pills (hidden on mobile, shown on md+) */}
                <div className="hidden md:flex flex-wrap gap-1.5 sm:gap-2 shrink-0">
                  {displayedBook.language && (
                    <div className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-[10px] sm:text-xs font-medium text-slate-700 dark:text-zinc-200">
                      <span className="text-amber-600 dark:text-amber-400">🌐</span>
                      <span>Язык: {displayedBook.language}</span>
                    </div>
                  )}

                  {displayedBook.translator && (
                    <div className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-[10px] sm:text-xs font-medium text-slate-700 dark:text-zinc-200">
                      <span className="text-amber-600 dark:text-amber-400">✍️</span>
                      <span>Перевод: {displayedBook.translator}</span>
                    </div>
                  )}

                  {pageCountDisplay && (
                    <div className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-[10px] sm:text-xs font-medium text-slate-700 dark:text-zinc-200">
                      <span className="text-amber-600 dark:text-amber-400">📄</span>
                      <span>{pageCountDisplay} стр.</span>
                    </div>
                  )}

                  {genresDisplay.map((genre, idx) => (
                    <span
                      key={idx}
                      className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/25 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-[10px] sm:text-xs font-medium"
                    >
                      🏷️ {genre}
                    </span>
                  ))}
                </div>

                {/* Mobile Genre tags (if any) */}
                <div className="flex md:hidden flex-wrap gap-1.5 my-0.5">
                  {genresDisplay.map((genre, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/25 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-medium"
                    >
                      🏷️ {genre}
                    </span>
                  ))}
                  {displayedBook.translator && (
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-[10px] text-slate-600 dark:text-zinc-300">
                      ✍️ {displayedBook.translator}
                    </span>
                  )}
                </div>

                {/* Full Description:
                    - Desktop: flex-1 min-h-0 with internal scrollbar
                    - Mobile: Natural readable flow
                */}
                <div className="flex flex-col gap-1.5 sm:gap-2 pt-2.5 sm:pt-3 border-t border-slate-200/80 dark:border-white/10 md:flex-1 md:min-h-0 md:overflow-hidden">
                  <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5 shrink-0">
                    <span>📖</span>
                    <span>Описание произведения</span>
                  </h3>
                  <div
                    ref={descRef}
                    className="text-sm sm:text-base xl:text-[17px] text-slate-700 dark:text-zinc-200 leading-relaxed space-y-3 italic font-semibold md:flex-1 md:min-h-0 md:overflow-y-auto md:pr-2 select-text"
                  >
                    {descriptionDisplay.split('\n\n').map((paragraph, idx) => (
                      <p key={idx} className="leading-relaxed italic font-semibold">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------------------
                  RIGHT SUB-COLUMN: Compact Cover & Full Ratings
                  ------------------------------------------------------------- */}
              <div className="flex flex-col gap-3 md:gap-2.5 items-stretch w-full md:h-full md:min-h-0 justify-start">
                {/* DESKTOP ONLY Cover Image (hidden on mobile, shown on md+) */}
                <div className="hidden md:flex relative group w-full shrink-0 items-center justify-center">
                  <div className="relative aspect-[2/3] w-full max-w-[170px] sm:max-w-[185px] xl:max-w-[210px] h-auto max-h-[25vh] sm:max-h-[27vh] lg:max-h-[30vh] xl:max-h-[33vh] rounded-xl sm:rounded-2xl overflow-hidden shadow-lg dark:shadow-[0_12px_30px_rgba(0,0,0,0.8)] border border-slate-200/80 dark:border-white/15 bg-slate-100 dark:bg-slate-900 group-hover:scale-[1.02] transition-transform duration-300">
                    <img
                      src={activeCover}
                      alt={displayedBook.title}
                      onError={onCoverError}
                      className="w-full h-full object-cover object-center opacity-100"
                    />
                    <div className="absolute inset-y-0 left-0 w-2 sm:w-2.5 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                  </div>
                </div>

                {/* Ratings Panel:
                    - Desktop: fills remaining height with internal scroll
                    - Mobile: clean card with full participant list
                */}
                <div className="w-full rounded-xl sm:rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] p-3 sm:p-3.5 border border-slate-200/90 dark:border-white/10 flex flex-col gap-2 md:flex-1 md:min-h-0 md:overflow-hidden shadow-xs dark:shadow-none">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10 shrink-0">
                    <div className="flex flex-col">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                        Оценки клуба
                      </h4>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                        Оценили: {displayedBook.participants.length} чел.
                      </span>
                    </div>

                    <div className="flex items-center gap-1 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 px-2 py-0.5 text-xs font-black text-amber-700 dark:text-amber-300 border border-amber-500/35 dark:border-amber-500/30 shadow-xs">
                      <span className="text-amber-600 dark:text-amber-400">★</span>
                      <span>{roundRating(displayedBook.overallRating)} / 10</span>
                    </div>
                  </div>

                  <div
                    ref={ratingsRef}
                    className="flex flex-col gap-1.5 md:flex-1 md:min-h-0 md:overflow-y-auto pr-1 max-h-60 md:max-h-none overflow-y-auto"
                  >
                    {displayedBook.participants.map((participant, idx) => (
                      <ParticipantRatingRow
                        key={`${participant.name}-${idx}`}
                        name={participant.name}
                        score={participant.score}
                        index={idx}
                        hasAsterisk={participant.hasAsterisk}
                        variant="book"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Deep Darkness Overlay Veil (1.5s sink / 1.5s emerge) */}
          {phase !== 'idle' && (
            <div
              className={`absolute inset-0 z-30 pointer-events-none ${
                phase === 'sinking' ? 'book-sink-overlay' : 'book-emerge-overlay'
              }`}
              style={{
                background:
                  'radial-gradient(ellipse at 50% 45%, rgba(4, 5, 8, 0.96) 0%, rgba(2, 3, 5, 0.99) 65%, #000000 100%)',
              }}
            />
          )}
        </section>

        {/* =========================================================================
            RIGHT COLUMN: REDESIGNED WOODEN BOOKSHELF WITH 3D SPINES & PAPER CUT
            Mechanics from 3d.tsx and Sketch 2: 3D paper cut on hover or selection
            ========================================================================= */}
        <aside className="w-full flex flex-col md:h-full md:min-h-0 md:overflow-hidden rounded-t-xl rounded-b-lg overflow-hidden bg-[#1b100a] border border-[#382214]/60 dark:border-[#4a2e1b] shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.95)] transition-colors duration-200">
          {/* Шапка полки */}
          <div
            className="flex items-center justify-between px-4 py-2.5 border-b border-[#3d2516] shrink-0"
            style={{
              background: 'linear-gradient(180deg, #21140c 0%, #140c07 100%)',
            }}
          >
            <span className="font-serif font-bold text-sm sm:text-[15px] tracking-wider uppercase text-[#e6d29e] drop-shadow">
              ПОЛКА КНИГ ({books.length})
            </span>
            <span className="text-[11px] font-medium text-[#d49b35] tracking-wide">
              Нажмите для выбора
            </span>
          </div>

          {/* Деревянный короб стеллажа */}
          <div
            className="relative flex-1 min-h-0 flex flex-col bg-[#160d08] border-x-[11px] sm:border-x-[13px] border-b-[12px] border-[#382214] overflow-hidden"
            style={{
              boxShadow:
                'inset 0 12px 28px rgba(0,0,0,0.95), inset 0 0 16px rgba(0,0,0,0.85)',
            }}
          >
            {/* Текстура волокон дерева и внутренние фаски стенок шкафа */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-[2px] bg-[#6b442a]/35 z-20" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-[2px] bg-black/75 z-20" />

            {/* Скролл-контейнер стопки книг */}
            <div className="flex flex-col gap-[7px] md:flex-1 md:min-h-0 md:overflow-y-auto overflow-x-visible py-2.5 pl-3.5 sm:pl-4 pr-2.5 custom-shelf-scrollbar">
              {books.map((book, index) => {
                const isSelected = (targetBook?.id ?? selectedBook.id) === book.id;
                const isHovered = hoveredBookId === book.id;
                const bookNumber = book.id ?? index + 1;
                const baseColor =
                  SPINE_COLORS[(bookNumber - 1) % SPINE_COLORS.length] ||
                  book.spineAccent ||
                  '#2b5b4e';

                return (
                  <div
                    key={book.id}
                    onClick={() => handleBookClick(book)}
                    onMouseEnter={() => setHoveredBookId(book.id)}
                    onMouseLeave={() => setHoveredBookId(null)}
                    className="relative select-none cursor-pointer shrink-0 h-[58px] sm:h-[62px] outline-none focus:outline-none [-webkit-tap-highlight-color:transparent]"
                    style={{
                      perspective: '1800px',
                    }}
                  >
                    {/* =========================================================
                        3D КНИЖНЫЙ ТОМ:
                        - В обычном состоянии и при ховере: неподвижен (rotateY: 0deg)
                        - При выборе (isSelected): поворачивается на 20°, левый край
                          остается на месте, а справа открывается удлиненный срез страниц в 3D!
                        ========================================================= */}
                    <div
                      className="relative w-full h-full transition-all duration-300 ease-out"
                      style={{
                        transformStyle: 'preserve-3d',
                        transformOrigin: 'left center',
                        transform: isSelected ? 'rotateY(-35deg)' : 'rotateY(0deg)',
                        boxShadow: isSelected
                          ? '0 10px 24px rgba(0,0,0,0.85), 0 0 16px rgba(245,158,11,0.25)'
                          : isHovered
                          ? '0 6px 18px rgba(0,0,0,0.75), 0 0 12px rgba(212,175,55,0.15)'
                          : '0 2px 4px rgba(0,0,0,0.5)',
                        zIndex: isSelected ? 30 : isHovered ? 20 : 10,
                      }}
                    >
                      {/* =====================================================
                          FACE 1: ОСНОВНОЙ КОРЕШОК КНИГИ ("вид сбоку")
                          - При выборе правый край становится абсолютно прямым (borderRadius: 8px 0 0 8px),
                            чтобы срез страниц примыкал строго заподлицо без зазоров и выступов
                          - При isSelected используется overflow-visible, чтобы Chromium не растеризовал
                            текст в растровую 2D текстуру и не размывал цифры при 3D перспективе
                          ===================================================== */}
                      <div
                        className={`relative flex items-center w-full h-full transition-all duration-200 ${
                          isSelected ? 'overflow-visible' : 'overflow-hidden'
                        }`}
                        style={{
                          backgroundColor: baseColor,
                          borderRadius: isSelected ? '8px 0px 0px 8px' : '8px',
                          borderRight: 'none',
                          transformStyle: 'preserve-3d',
                          backfaceVisibility: 'hidden',
                          WebkitFontSmoothing: 'antialiased',
                          // Пятиступенчатый цилиндрический градиент для 3D-выпуклости корешка
                          backgroundImage: `
                            linear-gradient(
                              180deg,
                              rgba(255, 255, 255, 0.27) 0%,
                              rgba(255, 255, 255, 0.08) 22%,
                              rgba(0, 0, 0, 0.0) 48%,
                              rgba(0, 0, 0, 0.30) 78%,
                              rgba(0, 0, 0, 0.64) 100%
                            )
                          `,
                          boxShadow: isSelected
                            ? 'inset 0 2px 3px rgba(255,255,255,0.4), inset 0 -5px 8px rgba(0,0,0,0.7)'
                            : isHovered
                            ? 'inset 0 2px 3px rgba(255,255,255,0.35), inset 0 -4px 7px rgba(0,0,0,0.65)'
                            : 'inset 0 2px 2px rgba(255,255,255,0.25), inset 0 -4px 7px rgba(0,0,0,0.65)',
                        }}
                      >
                        {/* Левый блок с номером тома (№1 .. №15) и филигранными уголками */}
                        <div className="relative flex items-center justify-center w-[46px] sm:w-[50px] self-stretch shrink-0 bg-black/15 my-1 ml-1 rounded-sm">
                          <FiligreeCorner className="absolute top-1 left-1" />
                          <FiligreeCorner className="absolute bottom-1 left-1 scale-y-[-1]" />
                          <FiligreeCorner className="absolute top-1 right-1 scale-x-[-1] opacity-75" />
                          <FiligreeCorner className="absolute bottom-1 right-1 scale-[-1] opacity-75" />

                          {/* Номер тома */}
                          <span className="font-serif font-bold text-[13px] sm:text-[15px] text-[#f5e7b8] tracking-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)] z-10">
                            №{bookNumber}
                          </span>
                        </div>

                        {/* Рельефная двойная полоска (биговка переплёта во всю высоту) */}
                        <div className="self-stretch flex items-stretch gap-[3px] ml-2.5 mr-2 shrink-0 my-0 py-0">
                          <div className="w-[1.5px] h-full min-h-[36px] sm:min-h-[40px] bg-black/60 border-r border-white/30 shadow-xs" />
                          <div className="w-[1.5px] h-full min-h-[36px] sm:min-h-[40px] bg-black/60 border-r border-white/30 shadow-xs" />
                        </div>

                        {/* Центральная часть: Только название книги крупным шрифтом с засечками */}
                        <div className="flex-1 px-3 sm:px-3.5 py-1 min-w-0 text-left flex items-center">
                          <span className="font-serif font-bold text-[#fcf6e8] text-[13.5px] sm:text-[15.5px] leading-snug line-clamp-2 drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
                            {book.title}
                          </span>
                        </div>

                        {/* Правая часть: Вдавленный шильдик рейтинга */}
                        <div className="pr-3 sm:pr-3.5 pl-1 shrink-0 flex items-center">
                          <div
                            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-[7px] ${
                              isSelected
                                ? 'bg-black/55 border border-[#d4af37]/75 text-[#fff1c2]'
                                : 'bg-black/38 border border-[#d4af37]/40 text-[#f5e7b8]'
                            }`}
                            style={{
                              transform: isSelected ? 'translateZ(0.5px)' : 'none',
                              WebkitFontSmoothing: 'antialiased',
                              boxShadow:
                                'inset 0 1.5px 3px rgba(0,0,0,0.75), 0 1px 0 rgba(255,255,255,0.14)',
                            }}
                          >
                            <span className="text-[#eab308] text-[11px] leading-none">
                              ★
                            </span>
                            <span
                              className="font-serif font-bold text-xs sm:text-[13px] tracking-wide"
                              style={{
                                textRendering: 'geometricPrecision',
                                WebkitFontSmoothing: 'antialiased',
                              }}
                            >
                              {roundRating(book.overallRating)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* =====================================================
                          FACE 2: СРЕЗ СТРАНИЦ СПРАВА (Толщина и глубина книги)
                          - Прикреплен строго под углом 90° к правому краю корешка заподлицо (left: 100%)
                          - Увеличенная протяженность (200px) создает впечатляющую глубину книги
                          - Глубокие тени справа визуализируют погружение задней части в тень шкафа
                          ===================================================== */}
                      <div
                        className="absolute top-0 bottom-0 overflow-hidden select-none pointer-events-none rounded-r-[2px]"
                        style={{
                          left: '100%',
                          width: '200px',
                          transformOrigin: 'left center',
                          transform: 'rotateY(90deg)',
                          backfaceVisibility: 'hidden',
                          visibility: isSelected ? 'visible' : 'hidden',
                          opacity: isSelected ? 1 : 1,
                          transition: isSelected
                            ? 'opacity 180ms ease-out 80ms, visibility 0s 0ms'
                            : 'opacity 100ms ease-in 0ms, visibility 0s 100ms',
                          backgroundColor: '#120b06',
                          boxShadow: 'inset 3px 0 5px rgba(0, 0, 0, 0.85)',
                        }}
                      >
                        {/* Верхний кант твердой обложки (бесшовно продолжает корешок) */}
                        <div
                          className="absolute top-0 left-0 right-0 h-[3.5px] z-20 pointer-events-none"
                          style={{
                            backgroundColor: baseColor,
                            backgroundImage:
                              'linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 2px, rgba(255,255,255,0.2) 8px, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0.95) 100%)',
                          }}
                        />

                        {/* Нижний кант твердой обложки (бесшовно продолжает нижнюю тень корешка) */}
                        <div
                          className="absolute bottom-0 left-0 right-0 h-[3.5px] z-20 pointer-events-none"
                          style={{
                            backgroundColor: baseColor,
                            backgroundImage:
                              'linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.98) 100%)',
                            boxShadow: 'inset 0 -1px 1px rgba(0,0,0,0.6)',
                          }}
                        />

                        {/* Текстура слоёной бумаги книжного блока с глубокой тенью переплёта у основания */}
                        <div
                          className="w-full h-full flex flex-col justify-center"
                          style={{
                            padding: '3.5px 0',
                            backgroundImage: `
                              linear-gradient(
                                90deg,
                                rgba(0,0,0,0.95) 0%,
                                rgba(0,0,0,0.7) 2px,
                                rgba(0,0,0,0.2) 5px,
                                transparent 12px
                              ),
                              linear-gradient(
                                90deg,
                                rgba(0,0,0,0.3) 0%,
                                rgba(0,0,0,0.06) 5%,
                                rgba(0,0,0,0.02) 12%,
                                rgba(0,0,0,0.2) 30%,
                                rgba(15,8,4,0.65) 55%,
                                rgba(8,4,2,0.9) 78%,
                                rgba(2,1,0,0.99) 100%
                              ),
                              repeating-linear-gradient(180deg, #d8ccb0 0px, #d8ccb0 1.5px, #b5a688 1.5px, #b5a688 2.5px)
                            `,
                          }}
                        />

                        {/* Глубокая тень книжного шкафа: правая часть книги погружена во тьму полки */}
                        <div
                          className="absolute inset-0 pointer-events-none z-10"
                          style={{
                            background: `
                              linear-gradient(
                                90deg,
                                transparent 0%,
                                transparent 12%,
                                rgba(0, 0, 0, 0.18) 28%,
                                rgba(18, 10, 5, 0.6) 50%,
                                rgba(10, 5, 2, 0.88) 72%,
                                rgba(2, 1, 0, 0.99) 100%
                              ),
                              linear-gradient(
                                180deg,
                                rgba(0, 0, 0, 0.45) 0%,
                                transparent 22%,
                                transparent 78%,
                                rgba(0, 0, 0, 0.55) 100%
                              )
                            `,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Стилизация скроллбара полки под тёмное дерево и кинематографичной анимации погружения во тьму */}
        <style>{`
          .custom-shelf-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-shelf-scrollbar::-webkit-scrollbar-track {
            background: rgba(15, 9, 5, 0.6);
            border-radius: 4px;
          }
          .custom-shelf-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(120, 78, 45, 0.55);
            border-radius: 4px;
            border: 1px solid rgba(212, 175, 55, 0.2);
          }
          .custom-shelf-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(160, 105, 60, 0.8);
          }

          /* Погружение информации о книге во тьму (1.5с) */
          @keyframes bookSinkContent {
            0% {
              opacity: 1;
              filter: brightness(1) blur(0px);
              transform: scale(1) translateY(0px);
            }
            100% {
              opacity: 0;
              filter: brightness(0) blur(4px);
              transform: scale(0.98) translateY(8px);
            }
          }

          /* Выход новой информации о книге из тьмы (1.5с) */
          @keyframes bookEmergeContent {
            0% {
              opacity: 0;
              filter: brightness(0) blur(4px);
              transform: scale(0.98) translateY(8px);
            }
            100% {
              opacity: 1;
              filter: brightness(1) blur(0px);
              transform: scale(1) translateY(0px);
            }
          }

          /* Надвигающаяся тьма (оверлей погружения 1.5с) */
          @keyframes bookSinkOverlay {
            0% {
              opacity: 0;
            }
            100% {
              opacity: 1;
            }
          }

          /* Рассеивающаяся тьма (оверлей выхода 1.5с) */
          @keyframes bookEmergeOverlay {
            0% {
              opacity: 1;
            }
            100% {
              opacity: 0;
            }
          }

          .book-sink-content {
            animation: bookSinkContent 1500ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
            will-change: opacity, filter, transform;
          }
          .book-emerge-content {
            animation: bookEmergeContent 1500ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            will-change: opacity, filter, transform;
          }
          .book-sink-overlay {
            animation: bookSinkOverlay 1500ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
            will-change: opacity;
          }
          .book-emerge-overlay {
            animation: bookEmergeOverlay 1500ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            will-change: opacity;
          }
        `}</style>
      </div>
    </div>
  );
};

export default BookDetailView;
