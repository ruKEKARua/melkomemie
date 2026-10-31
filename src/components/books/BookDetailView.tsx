import React from 'react';
import type { BookClubBook } from '../../api/bookClubData';
import { ParticipantRatingRow } from '../shared/ParticipantRatingRow';
import { useBookDetails } from '../../hooks/useBookDetails';

interface BookDetailViewProps {
  books: BookClubBook[];
  selectedBook: BookClubBook;
  onSelectBook: (book: BookClubBook) => void;
  onBackToRoom: () => void;
}

export const BookDetailView: React.FC<BookDetailViewProps> = ({
  books,
  selectedBook,
  onSelectBook,
  onBackToRoom,
}) => {
  const {
    activeCover,
    onCoverError,
    publisherDisplay,
    publishedYearDisplay,
    descriptionDisplay,
    pageCountDisplay,
    genresDisplay,
  } = useBookDetails(selectedBook);

  return (
    <div className="flex-1 w-full max-w-7xl 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-6 animate-fade-in text-white">
      {/* Top Navigation Bar: ONLY clean back to room button */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/10">
        <button
          onClick={onBackToRoom}
          className="flex items-center gap-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 px-4 py-2 text-xs sm:text-sm font-bold transition cursor-pointer shadow-md hover:scale-105"
          title="Вернуться в интерактивную комнату"
        >
          <span>🚪</span>
          <span>← Вернуться в комнату</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span>Книга #{selectedBook.id} из {books.length}</span>
          <span>•</span>
          <span className="text-amber-400 font-bold">Оценка клуба: ★ {selectedBook.overallRating}</span>
        </div>
      </div>

      {/* Main Two-Panel Arena: Left Info & Compact Cover/Ratings | Right WIDE Book Spines List */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] 2xl:grid-cols-[1fr_450px] gap-8 items-start">
        {/* =========================================================================
            LEFT MAIN CONTENT AREA:
            - Left sub-column: Metadata, Edition, and Full Description
            - Right sub-column: Compact Book Cover + Full Ratings
            ========================================================================= */}
        <section className="rounded-3xl bg-[#0f121d]/90 border border-white/10 p-6 sm:p-8 md:p-9 shadow-2xl backdrop-blur-xl flex flex-col gap-8 relative overflow-hidden">
          {/* Subtle Ambient Background Hue based on book theme */}
          <div
            className="absolute top-0 right-0 w-80 h-80 opacity-15 filter blur-3xl pointer-events-none rounded-full"
            style={{ background: selectedBook.spineAccent }}
          />

          <div className="grid grid-cols-1 md:grid-cols-[1fr_210px] lg:grid-cols-[1fr_220px] gap-7 items-start relative z-10">
            {/* -------------------------------------------------------------
                LEFT SUB-COLUMN: Metadata, Edition, and Full Description
                ------------------------------------------------------------- */}
            <div className="flex flex-col gap-5 order-2 md:order-1 min-w-0">
              {/* Header Title & Author */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow-sm">
                    Книжный клуб
                  </span>
                  {selectedBook.date && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 border border-white/10 text-zinc-300">
                      📅 {selectedBook.date}
                    </span>
                  )}
                  {publishedYearDisplay && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Год: {publishedYearDisplay}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                  {selectedBook.title}
                </h1>

                <h2 className="text-base sm:text-lg font-bold text-amber-400 mt-0.5">
                  {selectedBook.author}
                </h2>

                {selectedBook.subtitle && (
                  <p className="text-xs text-zinc-400 italic">
                    {selectedBook.subtitle}
                  </p>
                )}
              </div>

              {/* Edition / Publisher (Издание) */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Издание и публикация
                </span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-200">
                  {publisherDisplay}
                  {publishedYearDisplay ? ` (${publishedYearDisplay} г.)` : ''}
                </span>
              </div>

              {/* Secondary Information Pills */}
              <div className="flex flex-wrap gap-2">
                {selectedBook.language && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-medium text-zinc-200">
                    <span className="text-amber-400">🌐</span>
                    <span>Язык: {selectedBook.language}</span>
                  </div>
                )}

                {selectedBook.translator && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-medium text-zinc-200">
                    <span className="text-amber-400">✍️</span>
                    <span>Перевод: {selectedBook.translator}</span>
                  </div>
                )}

                {pageCountDisplay && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-medium text-zinc-200">
                    <span className="text-amber-400">📄</span>
                    <span>{pageCountDisplay} стр.</span>
                  </div>
                )}

                {genresDisplay.map((genre, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium"
                  >
                    🏷️ {genre}
                  </span>
                ))}
              </div>

              {/* Full Description (Полное описание) */}
              <div className="flex flex-col gap-2.5 pt-3 border-t border-white/10">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <span>📖</span>
                  <span>Описание произведения</span>
                </h3>
                <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-3 font-normal">
                  {descriptionDisplay.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* -------------------------------------------------------------
                RIGHT SUB-COLUMN: Compact Cover & Full Ratings
                ------------------------------------------------------------- */}
            <div className="flex flex-col gap-4 order-1 md:order-2 items-center md:items-stretch w-full max-w-[220px] mx-auto">
              {/* Cover Image: Reduced size (max 200px) for razor-sharp quality */}
              <div className="relative group w-full">
                <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.8)] border border-white/15 bg-slate-900 group-hover:scale-[1.02] transition-transform duration-300">
                  <img
                    src={activeCover}
                    alt={selectedBook.title}
                    onError={onCoverError}
                    className="w-full h-full object-cover object-center opacity-100"
                  />

                  {/* Realistic Book Spine Edge Shadow on the Left */}
                  <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />
                  {/* Subtle Front Surface Glare */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                </div>
              </div>

              {/* Ratings Panel strictly styled in parity with movies, listing ALL participants */}
              <div className="w-full rounded-2xl bg-white/[0.04] p-3 sm:p-3.5 border border-white/10 flex flex-col gap-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex flex-col">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                      Оценки клуба
                    </h4>
                    <span className="text-[10px] text-zinc-400">
                      Оценили: {selectedBook.participants.length} чел.
                    </span>
                  </div>

                  <div className="flex items-center gap-1 rounded-lg bg-amber-500/20 px-2 py-0.5 text-xs font-black text-amber-300 border border-amber-500/30 shadow-xs">
                    <span className="text-amber-400">★</span>
                    <span>{selectedBook.overallRating} / 10</span>
                  </div>
                </div>

                {/* Participant list: lists ALL participants with no artificial truncation */}
                <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto pr-1">
                  {selectedBook.participants.map((participant, idx) => (
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
        </section>

        {/* =========================================================================
            RIGHT COLUMN: STACK OF HORIZONTAL BOOK SPINES
            ========================================================================= */}
        <aside className="w-full flex flex-col gap-3">
          <div className="flex items-center justify-between px-2 pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Полка книг ({books.length})
            </span>
            <span className="text-[10px] text-amber-400">
              Нажмите для выбора
            </span>
          </div>

          {/* Generous pl-7 padding ensures the shifted -translate-x-5 book is NEVER clipped */}
          <div className="flex flex-col gap-2.5 max-h-[calc(100vh-12rem)] overflow-y-auto overflow-x-visible py-2 pl-7 pr-2 pb-8">
            {books.map((book) => {
              const isSelected = selectedBook.id === book.id;

              return (
                <div
                  key={book.id}
                  onClick={() => onSelectBook(book)}
                  className={`group relative select-none cursor-pointer rounded-r-2xl rounded-l-md p-3 sm:p-3.5 border transition-all duration-200 ease-out flex items-center justify-between gap-3 shadow-md ${
                    isSelected
                      ? '-translate-x-5 bg-gradient-to-r from-amber-500/35 via-slate-900 to-[#161a29] border-amber-400 ring-2 ring-amber-400/40 shadow-[0_10px_25px_rgba(245,158,11,0.3)]'
                      : 'hover:-translate-x-3.5 bg-gradient-to-r from-slate-900 via-[#141724] to-[#121420] border-white/10 hover:border-amber-500/50 hover:shadow-xl'
                  }`}
                  style={{
                    borderLeftWidth: '6px',
                    borderLeftColor: book.spineAccent,
                  }}
                >
                  {/* Left Spine Headband Stripe Accent */}
                  <div
                    className="absolute inset-y-0 left-0 w-1.5 opacity-90"
                    style={{ backgroundColor: book.spineAccent }}
                  />

                  {/* Center Title and Author: fully legible, comfortable spacing */}
                  <div className="flex flex-col min-w-0 flex-1 pl-1.5 text-left">
                    <span
                      className={`text-xs sm:text-sm font-bold leading-snug transition-colors line-clamp-2 ${
                        isSelected ? 'text-amber-300' : 'text-white group-hover:text-amber-200'
                      }`}
                    >
                      {book.title}
                    </span>
                    <span className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {book.author}
                    </span>
                  </div>

                  {/* Right Score Pill or Selected Marker */}
                  <div className="shrink-0 flex items-center gap-1.5 pl-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-black border ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                          : 'bg-white/5 text-zinc-300 border-white/10 group-hover:border-amber-400/40 group-hover:text-amber-300'
                      }`}
                    >
                      ★ {book.overallRating}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BookDetailView;
