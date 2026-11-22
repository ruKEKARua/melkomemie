import { useState } from 'react';
import type { NormalizedMovie } from '../api/movieSource';
import { getMovieImageUrl } from '../api/tmdbImage';
import type { MovieSheetEntry } from '../api/googleSheets';
import { useMovieEntrySearch } from '../hooks/useMovieEntrySearch';

type ParticipantScore = {
  name: string;
  score: string;
};

type MovieEntryForm = {
  date: string;
  title: string;
  participants: ParticipantScore[];
  isCinema: boolean;
};

type SearchResultsView = 'list' | 'grid';

type MovieEntryPageProps = {
  participantNames: string[];
  onSave: (entry: MovieSheetEntry) => Promise<void>;
  onSaveSuccess: (title: string) => void;
};

const createEmptyParticipant = (): ParticipantScore => ({
  name: '',
  score: '',
});

const MovieEntryPage = ({
  participantNames,
  onSave,
  onSaveSuccess,
}: MovieEntryPageProps) => {
  const [form, setForm] = useState<MovieEntryForm>({
    date: '',
    title: '',
    participants: [createEmptyParticipant()],
    isCinema: false,
  });
  const [searchResultsView, setSearchResultsView] = useState<SearchResultsView>('list');
  const [errors, setErrors] = useState<{
    date?: string;
    title?: string;
    participants?: string;
  }>({});
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [savedMovieTitle, setSavedMovieTitle] = useState('');

  const {
    results,
    isSearching,
    selectedMovie,
    setSelectedMovie,
    placeholder,
    searchMovies,
    clearSearch,
  } = useMovieEntrySearch();

  const handleTitleChange = (value: string) => {
    setForm((current) => ({ ...current, title: value }));
    searchMovies(value);
  };

  const isValidScore = (score: string): boolean => {
    const trimmed = score.trim().replace(',', '.');
    if (!trimmed) return false;
    const num = Number(trimmed);
    return Number.isFinite(num) && num >= 1 && num <= 10;
  };

  const sanitizeScoreInput = (rawVal: string): string => {
    const val = rawVal.replace(',', '.');
    if (val === '') return '';
    // Block leading 0 (e.g. "0", "0.", "0.5") since range is strictly 1 to 10
    if (val === '0' || val.startsWith('0')) {
      return '';
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      if (num < 0) return '';
      if (num > 10) return '10';
    }
    return val;
  };

  const hasParticipantErrors = (participants: ParticipantScore[]) =>
    participants.some(
      (participant) => !participant.name.trim() || !isValidScore(participant.score)
    );

  const validateForm = () => {
    const nextErrors: { date?: string; title?: string; participants?: string } = {};

    if (!form.date.trim()) {
      nextErrors.date = 'Выберите дату просмотра';
    }

    if (!form.title.trim()) {
      nextErrors.title = 'Введите название фильма';
    }

    const selectedNames = form.participants.map((p) => p.name.trim()).filter(Boolean);
    if (selectedNames.length === 0) {
      nextErrors.participants = 'Добавьте хотя бы одного участника';
    } else if (new Set(selectedNames).size !== selectedNames.length) {
      nextErrors.participants = 'Один участник не может быть добавлен дважды';
    } else if (hasParticipantErrors(form.participants)) {
      nextErrors.participants =
        'Для каждого участника укажите имя и оценку от 1 до 10 (разрешены десятичные значения)';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    setSaveError('');
    setIsSaving(true);

    try {
      const savedTitle = form.title;
      await onSave({
        date: form.date,
        title: form.title,
        isCinema: form.isCinema,
        color: form.isCinema ? '#B4A7D6' : undefined,
        participants: form.participants.map((participant) => ({
          name: participant.name,
          score: participant.score,
        })),
      });
      setForm({
        date: '',
        title: '',
        participants: [createEmptyParticipant()],
        isCinema: false,
      });
      clearSearch();
      setErrors({});
      setSavedMovieTitle(savedTitle);
      setIsSuccessModalOpen(true);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Не удалось сохранить запись'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const applySelectedMovie = (movie: NormalizedMovie) => {
    setSelectedMovie(movie);
    const title = movie.title || movie.original_title;
    setForm((current) => ({
      ...current,
      title: title || current.title,
    }));
    if (title?.trim()) {
      setErrors((current) => ({ ...current, title: undefined }));
    }
  };

  const updateDate = (date: string) => {
    setForm((current) => ({ ...current, date }));
    if (date.trim()) {
      setErrors((current) => ({ ...current, date: undefined }));
    }
  };

  const addParticipantRow = () => {
    setForm((current) => ({
      ...current,
      participants: [...current.participants, createEmptyParticipant()],
    }));
  };

  const updateParticipantRow = (
    index: number,
    field: keyof ParticipantScore,
    value: string
  ) => {
    const finalValue = field === 'score' ? sanitizeScoreInput(value) : value;
    const updatedParticipants = form.participants.map(
      (participant, participantIndex) =>
        participantIndex === index
          ? { ...participant, [field]: finalValue }
          : participant
    );
    setForm((current) => ({
      ...current,
      participants: updatedParticipants,
    }));
    if (!hasParticipantErrors(updatedParticipants)) {
      setErrors((current) => ({ ...current, participants: undefined }));
    }
  };

  const handleScoreBlur = (index: number) => {
    const rawScore = form.participants[index]?.score ?? '';
    if (rawScore.trim() !== '') {
      const num = parseFloat(rawScore.replace(',', '.'));
      if (!isNaN(num)) {
        if (num < 1) {
          updateParticipantRow(index, 'score', '1');
        } else if (num > 10) {
          updateParticipantRow(index, 'score', '10');
        }
      }
    }
  };

  const removeParticipantRow = (index: number) => {
    const participants =
      form.participants.length > 1
        ? form.participants.filter(
            (_, participantIndex) => participantIndex !== index
          )
        : [createEmptyParticipant()];
    setForm((current) => ({
      ...current,
      participants,
    }));
    if (!hasParticipantErrors(participants)) {
      setErrors((current) => ({ ...current, participants: undefined }));
    }
  };

  const selectedParticipantNames = new Set(
    form.participants.map((participant) => participant.name).filter(Boolean)
  );

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 text-zinc-100 pb-16 animate-fade-in">
      {/* Page Title */}
      <div className="flex flex-col gap-2 pb-6 border-b border-white/10">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
          <span>Таблица Google Sheets</span>
          <span>•</span>
          <span>База данных киноклуба</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Добавить фильм в коллекцию
        </h1>
        <p className="text-sm text-slate-600 dark:text-zinc-400">
          Заполните дату совместного просмотра, выберите фильм и укажите оценки участников.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-8 lg:grid-cols-[1.1fr_1fr] items-start"
      >
        {/* Left Column: Date & Live Search Results */}
        <div className="flex flex-col gap-6">
          {/* Date Picker & Cinema Checkbox Box */}
          <div
            className={`rounded-2xl border p-4 sm:p-5 shadow-xs dark:shadow-xl transition-all duration-300 ${
              form.isCinema
                ? 'border-purple-400/50 dark:border-purple-400/40 bg-purple-500/[0.04] dark:bg-purple-950/25'
                : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#121420]'
            }`}
          >
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <input
                type="date"
                aria-label="Дата просмотра"
                value={form.date}
                onChange={(event) => updateDate(event.target.value)}
                className="rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#090a10] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition"
              />
              <button
                type="button"
                onClick={() => updateDate(new Date().toLocaleDateString('sv-SE'))}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:hover:bg-white/15 dark:text-zinc-200 px-3.5 py-2.5 text-xs font-semibold transition cursor-pointer"
              >
                Сегодня
              </button>

              <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition sm:ml-2">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={form.isCinema}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isCinema: event.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="h-5 w-5 rounded-lg border-2 border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-[#090a10] peer-checked:border-[#B4A7D6] peer-checked:bg-[#B4A7D6] peer-focus-visible:ring-2 peer-focus-visible:ring-purple-400 transition-all flex items-center justify-center shadow-xs">
                    <svg
                      className={`h-3.5 w-3.5 text-slate-950 transition-transform duration-150 ${
                        form.isCinema ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <span>просмотр был в кинотеатре</span>
              </label>
            </div>
            {errors.date && (
              <span className="text-xs text-rose-500 dark:text-rose-400 mt-2 block">
                {errors.date}
              </span>
            )}
          </div>

          {/* Search Autocomplete / Live Results */}
          <aside className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121420] p-5 shadow-xs dark:shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Результаты поиска фильма
              </h2>
              <div
                className="flex gap-1 rounded-lg bg-slate-100 dark:bg-[#090a10] p-0.5 border border-slate-200 dark:border-white/10"
                role="group"
              >
                <button
                  type="button"
                  onClick={() => setSearchResultsView('list')}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    searchResultsView === 'list'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Списком
                </button>
                <button
                  type="button"
                  onClick={() => setSearchResultsView('grid')}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    searchResultsView === 'grid'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Плиткой
                </button>
              </div>
            </div>

            {!form.title.trim() && (
              <p className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 p-6 text-center text-xs text-slate-500 dark:text-zinc-500">
                Начните вводить название фильма справа, чтобы увидеть варианты из TMDB и Кинопоиска.
              </p>
            )}

            {form.title.trim() && isSearching && (
              <div className="flex items-center justify-center gap-3 rounded-xl bg-slate-100 dark:bg-white/5 p-6 text-xs text-slate-600 dark:text-zinc-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                <span>Ищем фильм в базе данных...</span>
              </div>
            )}

            {form.title.trim() && !isSearching && results.length === 0 && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-5 text-center text-xs text-amber-800 dark:text-amber-300">
                По названию ничего не найдено. Вы можете продолжить добавление с введённым названием вручную.
              </div>
            )}

            <div
              className={`max-h-96 overflow-y-auto pr-1 ${
                searchResultsView === 'grid'
                  ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 items-stretch'
                  : 'flex flex-col gap-2'
              }`}
            >
              {results.map((movie) => {
                const poster = movie.poster_path
                  ? getMovieImageUrl(movie.poster_path, 'w185')
                  : 'https://placehold.co/185x278/131620/94a3b8?text=No+Poster';

                const isSelected =
                  selectedMovie?.id === movie.id &&
                  selectedMovie?.source === movie.source;

                return (
                  <button
                    key={`${movie.source}-${movie.id}`}
                    type="button"
                    onClick={() => applySelectedMovie(movie)}
                    className={`rounded-xl border p-2 text-left transition-all cursor-pointer ${
                      searchResultsView === 'grid'
                        ? 'flex flex-col gap-2 h-full'
                        : 'flex items-center gap-3'
                    } ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/15 shadow-sm'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] hover:border-amber-500/50 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    <img
                      src={poster}
                      alt={movie.title || movie.original_title}
                      className={
                        searchResultsView === 'grid'
                          ? 'aspect-[2/3] w-full rounded-lg object-cover shrink-0'
                          : 'h-16 w-11 shrink-0 rounded-lg object-cover'
                      }
                      onError={(event) => {
                        event.currentTarget.src =
                          'https://placehold.co/185x278/131620/94a3b8?text=No+Poster';
                      }}
                    />
                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">
                          {movie.title || movie.original_title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                          {movie.original_title || movie.title}
                        </p>
                      </div>
                      <span className="inline-block mt-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        {movie.source === 'tmdb' ? 'TMDB' : 'Кинопоиск'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>

        {/* Right Column: Title input & Participant Ratings */}
        <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121420] p-6 shadow-xs dark:shadow-xl">
          {/* Title Input */}
          <label className="flex flex-col gap-2 text-left text-sm font-semibold text-slate-800 dark:text-zinc-200">
            <span>Название фильма</span>
            <input
              type="text"
              value={form.title}
              onChange={(event) => {
                const title = event.target.value;
                handleTitleChange(title);
                if (title.trim())
                  setErrors((c) => ({ ...c, title: undefined }));
              }}
              placeholder={placeholder}
              className="rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#090a10] px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition"
            />
            {errors.title && (
              <span className="text-xs text-rose-500 dark:text-rose-400">
                {errors.title}
              </span>
            )}
          </label>

          {/* Participants & Scores Section */}
          <div className="flex flex-col gap-3 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
              <span className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Оценки участников
              </span>
              <button
                type="button"
                onClick={addParticipantRow}
                className="rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 px-3 py-1 text-xs font-semibold transition"
              >
                Добавить участника
              </button>
            </div>

            {errors.participants && (
              <div className="rounded-xl bg-rose-500/15 border border-rose-500/30 p-2.5 text-xs text-rose-600 dark:text-rose-300">
                {errors.participants}
              </div>
            )}

            <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto pr-1">
              {form.participants.map((participant, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_5rem_2.5rem] gap-2 items-center"
                >
                  <select
                    value={participant.name}
                    onChange={(event) =>
                      updateParticipantRow(index, 'name', event.target.value)
                    }
                    className="rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#090a10] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">
                      {participantNames.length > 0
                        ? 'Выберите участника'
                        : 'Участники не загружены'}
                    </option>
                    {participantNames
                      .filter(
                        (name) =>
                          name === participant.name ||
                          !selectedParticipantNames.has(name)
                      )
                      .map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="any"
                    value={participant.score}
                    onChange={(event) =>
                      updateParticipantRow(index, 'score', event.target.value)
                    }
                    onBlur={() => handleScoreBlur(index)}
                    placeholder="1-10"
                    className="rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#090a10] px-2 py-2 text-xs text-center font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />

                  <button
                    type="button"
                    onClick={() => removeParticipantRow(index)}
                    aria-label="Удалить строку"
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/30 text-xs transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex flex-col gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-save-movie group relative w-full flex items-center justify-center gap-2 rounded-xl text-slate-950 font-extrabold px-6 py-3 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden transition-all duration-300 hover:scale-[1.02]"
            >
              {/* Default Amber Background */}
              <span className="btn-save-movie-default-bg absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-400 transition-opacity duration-300 group-hover:opacity-0" />

              {/* Hover Gradient Background (90deg, #C5C757 0%, #53ED68 50%, #C5C757 100%) */}
              <span className="btn-save-movie-hover-bg absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Surfacing / Floating Green Bloom in Center */}
              <span className="btn-save-movie-center-bloom" aria-hidden="true" />

              {/* Button Content */}
              <span className="relative z-10 flex items-center justify-center gap-2 drop-shadow-sm">
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    <span>Сохраняем в Google Sheets...</span>
                  </>
                ) : (
                  'Сохранить фильм в таблицу'
                )}
              </span>
            </button>
            {saveError && (
              <span className="text-xs text-rose-500 dark:text-rose-400 text-center">
                {saveError}
              </span>
            )}
          </div>
        </div>
      </form>

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <section
            aria-labelledby="movie-save-success-title"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl border border-emerald-500/30 bg-white dark:bg-[#131622] p-8 text-center text-slate-900 dark:text-white shadow-2xl animate-modal-enter"
            role="dialog"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-4 border border-emerald-500/40 text-2xl">
              ✓
            </div>
            <h2
              id="movie-save-success-title"
              className="text-xl font-bold text-slate-900 dark:text-white"
            >
              Фильм успешно добавлен!
            </h2>
            <p className="mt-2 text-xs text-slate-600 dark:text-zinc-300">
              «{savedMovieTitle}» успешно записан в таблицу Google Sheets и скоро появится в каталоге.
            </p>
            <button
              type="button"
              onClick={() => onSaveSuccess(savedMovieTitle)}
              className="mt-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 text-xs transition"
            >
              Вернуться к каталогу
            </button>
          </section>
        </div>
      )}
    </div>
  );
};

export default MovieEntryPage;
