import React, { useState, useEffect } from 'react';
import {
  searchGoogleBooks,
  DEFAULT_SKOTNY_DVOR_VOLUME,
  SKOTNY_DVOR_CLUB_RATINGS,
  type GoogleBookVolume,
  type BookClubData,
} from '../api/googleBooks';
import BookCard from '../components/BookCard';
import BookModal from '../components/BookModal';

interface BookClubPageProps {
  onBack: () => void;
  isAuthorized?: boolean;
  userName?: string;
  userPicture?: string;
}

export const BookClubPage: React.FC<BookClubPageProps> = ({ onBack }) => {
  const [featuredBook, setFeaturedBook] = useState<GoogleBookVolume>(DEFAULT_SKOTNY_DVOR_VOLUME);
  const [clubData] = useState<BookClubData>(SKOTNY_DVOR_CLUB_RATINGS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBookForModal, setSelectedBookForModal] = useState<GoogleBookVolume>(DEFAULT_SKOTNY_DVOR_VOLUME);

  // Google Books API Search state
  const [searchQuery, setSearchQuery] = useState('Скотный двор');
  const [apiKey, setApiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('google_books_api_key') ||
        (import.meta.env.VITE_GOOGLE_BOOKS_API_KEY ?? '')
      );
    }
    return '';
  });
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const handleUpdateApiKey = (newKey: string) => {
    setApiKey(newKey);
    if (typeof window !== 'undefined') {
      if (newKey.trim()) {
        localStorage.setItem('google_books_api_key', newKey.trim());
      } else {
        localStorage.removeItem('google_books_api_key');
      }
    }
  };
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GoogleBookVolume[]>([DEFAULT_SKOTNY_DVOR_VOLUME]);
  const [apiStatusMessage, setApiStatusMessage] = useState<string>('');
  const [apiSource, setApiSource] = useState<'google-api' | 'cache-fallback'>('google-api');

  // Presentation view mode for participant ratings
  const [ratingsViewMode, setRatingsViewMode] = useState<'cards' | 'sheets'>('cards');

  // Initial load with Google Books API
  useEffect(() => {
    let isMounted = true;
    const runSearch = async () => {
      setIsSearching(true);
      const res = await searchGoogleBooks('Скотный двор', apiKey || undefined);
      if (isMounted) {
        setFeaturedBook(res.book);
        setSearchResults(res.allResults.length > 0 ? res.allResults : [res.book]);
        setApiStatusMessage(res.apiStatus);
        setApiSource(res.source);
        setIsSearching(false);
      }
    };
    runSearch();
    return () => {
      isMounted = false;
    };
  }, [apiKey]);

  const handleManualSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const res = await searchGoogleBooks(searchQuery, apiKey || undefined);
    setSearchResults(res.allResults);
    setApiStatusMessage(res.apiStatus);
    setApiSource(res.source);
    setIsSearching(false);
  };

  const openBookDetails = (book: GoogleBookVolume) => {
    setSelectedBookForModal(book);
    setIsModalOpen(true);
  };

  const getScoreColor = (scoreStr: string) => {
    const num = parseFloat(scoreStr.replace(',', '.'));
    if (isNaN(num)) return 'bg-zinc-700 text-zinc-200 border-zinc-600';
    if (num >= 7.5) return 'bg-emerald-500/90 text-white border-emerald-400/50 shadow-xs';
    if (num >= 6.0) return 'bg-amber-500/90 text-slate-950 border-amber-400/50 shadow-xs';
    return 'bg-[#78350f]/95 text-amber-100 border-[#92400e]/70 shadow-xs';
  };

  const featuredCover =
    featuredBook.volumeInfo.imageLinks?.medium ||
    featuredBook.volumeInfo.imageLinks?.large ||
    featuredBook.volumeInfo.imageLinks?.thumbnail ||
    'https://upload.wikimedia.org/wikipedia/commons/f/fb/Animal_Farm_-_1st_edition.jpg';

  const presets = [
    'Скотный двор',
    '1984',
    'Мастер и Маргарита',
    'Цветы для Элджернона',
    'О дивный новый мир',
    '451 градус по Фаренгейту',
  ];

  return (
    <div className="flex-1 w-full max-w-7xl 2xl:max-w-[1600px] min-[1920px]:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-8">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white transition cursor-pointer border border-slate-300/80 dark:border-white/10 shadow-xs"
            title="Вернуться к киноклубу"
          >
            <span>← Вернуться к фильмам</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">📚</span>
            <div className="flex flex-col">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                Книжный клуб
              </h1>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                Тестовая страница • Google Books API
              </span>
            </div>
          </div>
        </div>

        {/* API Status Pill */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              apiSource === 'google-api'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
            }`}
            title={apiStatusMessage}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                apiSource === 'google-api' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="truncate max-w-[200px] sm:max-w-xs">
              {apiSource === 'google-api' ? 'Google Books API (Онлайн)' : 'Google Books API (Кэш при квоте)'}
            </span>
          </div>

          <button
            onClick={() => setShowApiKeyInput((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 transition cursor-pointer"
            title="Настройка API ключа Google Books"
          >
            ⚙️ Ключ API
          </button>
        </div>
      </div>

      {/* Optional API Key Input Accordion */}
      {showApiKeyInput && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center gap-3 animate-fade-in text-xs">
          <div className="flex-1">
            <span className="font-bold text-slate-900 dark:text-white">
              Google Books API Key (опционально):
            </span>
            <p className="text-slate-600 dark:text-zinc-400 mt-0.5">
              Google Books API работает публично, но при исчерпании глобальной дневной квоты Google возвращает 429. Вы можете вставить личный бесплатный ключ из Google Cloud Console.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={apiKey}
              onChange={(e) => handleUpdateApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#181a25] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-xs w-full sm:w-56 focus:outline-none focus:border-amber-500"
            />
            {apiKey && (
              <button
                onClick={() => handleUpdateApiKey('')}
                className="px-2 py-1.5 text-xs text-rose-500 hover:text-rose-600 cursor-pointer font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          HERO BILLBOARD SHOWCASE: "Скотный двор"
          Designed in exact visual parity with the movie club's featured billboard
          ========================================================================= */}
      <section className="relative w-full rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-2xl bg-gradient-to-br from-slate-900 via-[#101424] to-[#0c0e18] text-white">
        {/* Background Ambient Glow */}
        <div
          className="absolute inset-0 opacity-20 filter blur-3xl scale-125 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 75% 30%, rgba(245, 158, 11, 0.4), transparent 60%), radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.25), transparent 50%)`,
          }}
        />

        <div className="relative z-10 p-6 sm:p-8 md:p-10 lg:p-12 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 lg:gap-12 items-center">
          {/* Left Text / Info Area */}
          <div className="flex flex-col gap-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-amber-500 text-slate-950 shadow-md">
                Тестовая книга клуба
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/15 text-zinc-200 backdrop-blur-md">
                📖 Повесть-притча
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                1945 год
              </span>
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-none text-white drop-shadow-md">
                {featuredBook.volumeInfo.title || 'Скотный двор'}
              </h2>
              <p className="text-base sm:text-lg font-bold text-amber-400 mt-2">
                {featuredBook.volumeInfo.authors?.join(', ') || 'Джордж Оруэлл'}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Оригинал: Animal Farm: A Fairy Story
              </p>
            </div>

            {/* Synopsis */}
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed line-clamp-3 sm:line-clamp-4 max-w-xl">
              {featuredBook.volumeInfo.description ||
                DEFAULT_SKOTNY_DVOR_VOLUME.volumeInfo.description}
            </p>

            {/* Club Overall Rating Banner */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/90 text-white font-black text-lg sm:text-xl border border-emerald-400/50 shadow-lg shadow-emerald-950/40">
                <span>★</span>
                <span>{clubData.overallRating}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">
                  Общая оценка книжного клуба
                </span>
                <span className="text-[11px] text-zinc-400">
                  {clubData.participants.length} участников выставили оценки
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                onClick={() => openBookDetails(featuredBook)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition cursor-pointer shadow-lg hover:scale-105 active:scale-95"
              >
                <span>🔍 Открыть карточку книги</span>
              </button>

              <button
                onClick={() => setRatingsViewMode((m) => (m === 'cards' ? 'sheets' : 'cards'))}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white transition cursor-pointer border border-white/15 backdrop-blur-md"
              >
                <span>📊 {ratingsViewMode === 'cards' ? 'Смотреть таблицу Sheets' : 'Смотреть карточки участников'}</span>
              </button>
            </div>
          </div>

          {/* Right: Featured Book Cover Poster */}
          <div className="flex justify-center md:justify-end">
            <div
              onClick={() => openBookDetails(featuredBook)}
              className="relative w-44 sm:w-52 md:w-60 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 hover:border-amber-400 transition-all duration-300 hover:scale-105 cursor-pointer group bg-slate-800"
            >
              <img
                src={featuredCover}
                alt="Скотный двор"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
              <div className="absolute bottom-3 inset-x-3 text-center">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-slate-950 shadow-md">
                  Нажмите для деталей
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION: УЧАСТНИКИ И ОЦЕНКИ (В ТОЧНОСТИ КАК У ФИЛЬМОВ, СМ СКРИНШОТ 1)
          ========================================================================= */}
      <section className="flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">👥</span>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Участники и оценки клуба
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
              Оценки по книге «Скотный двор» (в точности по скриншоту 1 с сохранением стилей)
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs">
            <button
              onClick={() => setRatingsViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                ratingsViewMode === 'cards'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Вид как у фильмов
            </button>
            <button
              onClick={() => setRatingsViewMode('sheets')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                ratingsViewMode === 'sheets'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Сводка Google Sheets
            </button>
          </div>
        </div>

        {/* View Mode 1: Cards like in Movie Club (Modal / Movie details style) */}
        {ratingsViewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Prominent Overall Score Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/5 dark:from-emerald-500/20 dark:to-teal-500/10 border border-emerald-500/30 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Общая оценка
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold">
                  {clubData.participants.length} оценок
                </span>
              </div>
              <div className="my-3 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white font-mono">
                  {clubData.overallRating}
                </span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  из 10
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Итоговый балл книги на основе мнений всех участников.
              </p>
            </div>

            {/* Individual Participant Cards */}
            {clubData.participants.map((p, idx) => {
              const isHighlight = p.hasAsterisk;
              const userInitial = p.name.trim()[0].toUpperCase();

              return (
                <div
                  key={`${p.name}-${idx}`}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between shadow-xs ${
                    isHighlight
                      ? 'bg-amber-100 hover:bg-amber-200/80 border-amber-300 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:border-amber-500/40 ring-1 ring-amber-500/30'
                      : 'bg-white dark:bg-[#131620] hover:bg-slate-50 dark:hover:bg-white/[0.04] border-slate-200/80 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border shrink-0 ${
                        isHighlight
                          ? 'bg-amber-400/40 text-amber-950 dark:bg-amber-400/25 dark:text-amber-200 border-amber-400/70 font-black'
                          : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {userInitial}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span
                        className={`text-sm font-bold truncate ${
                          isHighlight
                            ? 'text-amber-950 dark:text-amber-100 font-extrabold'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {p.name}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                        {isHighlight ? 'Участник со звёздочкой (*)' : 'Участник клуба'}
                      </span>
                    </div>
                  </div>

                  {/* Score Badge */}
                  <div
                    className={`px-3 py-1 rounded-lg text-sm font-black border ${getScoreColor(
                      p.score,
                    )}`}
                  >
                    {p.score}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* View Mode 2: Recreated Google Sheets Table from Screenshot 1 */
          <div className="rounded-2xl border border-slate-300 dark:border-zinc-700 bg-white overflow-hidden shadow-lg text-slate-900">
            <div className="p-3 bg-slate-100 dark:bg-zinc-800 border-b border-slate-300 dark:border-zinc-700 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-zinc-300">
                Google Sheets • Киноклуб / Книжный клуб
              </span>
              <span className="font-mono text-slate-500 dark:text-zinc-400">
                Колонки E, F, G
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-sans text-sm select-none">
                <thead>
                  <tr className="bg-[#f0f2f5] text-zinc-600 text-xs font-bold border-b border-slate-300">
                    <th className="w-10 py-1.5 border-r border-slate-300 text-center font-normal text-zinc-400">
                      #
                    </th>
                    <th className="py-2 px-6 border-r border-slate-300 text-center font-bold">
                      E
                    </th>
                    <th className="py-2 px-6 border-r border-slate-300 text-center font-bold">
                      F
                    </th>
                    <th className="py-2 px-6 text-center font-bold">
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
                      className={`border-b border-slate-300 ${
                        p.hasAsterisk ? 'bg-[#ffff00] font-medium' : 'bg-white'
                      }`}
                    >
                      <td className="w-10 py-2 border-r border-slate-300 text-center text-xs text-zinc-400 font-mono">
                        {idx + 2}
                      </td>
                      <td className="py-2.5 px-6 border-r border-slate-400 text-left font-medium">
                        {p.name}
                      </td>
                      <td className="py-2.5 px-6 border-r border-slate-400 text-right font-medium font-mono">
                        {p.score}
                      </td>

                      {/* Merged cell for G (Overall rating: 7,3) */}
                      {idx === 0 ? (
                        <td
                          rowSpan={clubData.participants.length}
                          className="py-4 px-6 text-center font-bold text-lg align-middle bg-white border-l border-slate-300"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-2xl sm:text-3xl font-black text-slate-950 font-mono">
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
      </section>

      {/* =========================================================================
          SECTION: GOOGLE BOOKS API LIVE TESTER & CATALOG SEARCH
          ========================================================================= */}
      <section className="flex flex-col gap-5 pt-4 border-t border-slate-200 dark:border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🔍</span>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Каталог и поиск в Google Books API
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
              Проверьте работу Google Books API на других книгах или выполните новый поиск
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleManualSearch} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-zinc-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Введите название книги (например: Скотный двор, 1984, Мастер и Маргарита)..."
              className="w-full rounded-2xl bg-white dark:bg-[#181a25] border border-slate-300 dark:border-white/10 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-xs"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm transition cursor-pointer shadow-md shrink-0 flex items-center justify-center gap-2"
          >
            {isSearching ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Поиск...</span>
              </>
            ) : (
              <span>Найти в Google Books</span>
            )}
          </button>
        </form>

        {/* Preset search chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 dark:text-zinc-400 font-semibold mr-1">
            Быстрый выбор:
          </span>
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={async () => {
                setSearchQuery(p);
                setIsSearching(true);
                const res = await searchGoogleBooks(p, apiKey || undefined);
                setSearchResults(res.allResults);
                setApiStatusMessage(res.apiStatus);
                setApiSource(res.source);
                setIsSearching(false);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 transition cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Search Results Grid */}
        <div className="mt-2">
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {searchResults.map((book) => {
                const isSkotny =
                  book.volumeInfo?.title?.toLowerCase().includes('скотный') ||
                  book.volumeInfo?.title?.toLowerCase().includes('animal farm');

                return (
                  <BookCard
                    key={book.id || book.volumeInfo.title}
                    book={book}
                    overallRating={isSkotny ? clubData.overallRating : undefined}
                    onClick={() => openBookDetails(book)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
              По вашему запросу книг не найдено. Попробуйте изменить запрос.
            </div>
          )}
        </div>
      </section>

      {/* Book Modal */}
      <BookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        book={selectedBookForModal}
        clubData={clubData}
      />
    </div>
  );
};

export default BookClubPage;
