import React from 'react';

interface EditableParticipant {
  name: string;
  score: string;
}

interface MovieEditFormProps {
  participants: EditableParticipant[];
  participantNames: string[];
  updateParticipant: (index: number, field: keyof EditableParticipant, value: string) => void;
  addParticipant: () => void;
  removeParticipant: (index: number) => void;
  error?: string;
  cancelEditing: () => void;
  requestConfirmation: () => void;
  isConfirmationOpen: boolean;
  isSaving: boolean;
  confirmSave: () => void;
  movieTitle?: string;
}

export const MovieEditForm: React.FC<MovieEditFormProps> = ({
  participants,
  participantNames,
  updateParticipant,
  addParticipant,
  removeParticipant,
  error,
  cancelEditing,
  requestConfirmation,
  isConfirmationOpen,
  isSaving,
  confirmSave,
  movieTitle = '',
}) => {
  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
          {participants.map((participant, index) => {
            const selectedNames = new Set(
              participants.map((item) => item.name).filter(Boolean)
            );

            return (
              <div key={index} className="grid grid-cols-[1fr_4.5rem_2rem] gap-2 items-center">
                <select
                  aria-label={`Участник ${index + 1}`}
                  value={participant.name}
                  onChange={(event) => updateParticipant(index, 'name', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#10121a] px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Выберите участника</option>
                  {participantNames
                    .filter((name) => name === participant.name || !selectedNames.has(name))
                    .map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                </select>
                <input
                  aria-label={`Оценка участника ${index + 1}`}
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={participant.score}
                  onChange={(event) => updateParticipant(index, 'score', event.target.value)}
                  placeholder="0-10"
                  className="w-full rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#10121a] px-2.5 py-2 text-xs text-slate-900 dark:text-white text-center font-bold focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  disabled={participants.length === 1}
                  onClick={() => removeParticipant(index)}
                  aria-label={`Удалить участника ${index + 1}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/30 text-rose-500 dark:text-rose-400 hover:bg-rose-500/15 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addParticipant}
          className="self-start text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 transition-colors py-1"
        >
          + Добавить участника
        </button>

        {error && (
          <p role="alert" className="text-xs text-rose-500 dark:text-rose-400">
            {error}
          </p>
        )}

        <div className="mt-3 flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={cancelEditing}
            className="rounded-lg bg-slate-200 dark:bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-white/20"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={requestConfirmation}
            className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
          >
            Сохранить
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Edit Save */}
      {isConfirmationOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 dark:bg-black/75 p-4 animate-fade-in">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-movie-confirm-title"
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#161925] p-6 text-center text-slate-900 dark:text-white shadow-2xl border border-slate-200 dark:border-white/15 animate-modal-enter"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-500 mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 id="edit-movie-confirm-title" className="text-lg font-bold">
              Сохранить изменения?
            </h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
              Оценки участников для фильма «{movieTitle}» будут обновлены в базе киноклуба.
            </p>
            {error && (
              <p role="alert" className="mt-3 text-xs text-rose-500 dark:text-rose-400">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                disabled={isSaving}
                onClick={cancelEditing}
                className="rounded-xl bg-slate-100 dark:bg-white/10 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-white/20 disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={confirmSave}
                className="rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    <span>Сохранение...</span>
                  </>
                ) : (
                  <span>Да, сохранить</span>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default MovieEditForm;
