import { useState } from 'react';
import type { MovieRatings } from './useGetMovies';
import type { MovieSheetEntry } from '../api/googleSheets';
import { parseDateInput } from '../utils/dateFormat';

type EditableParticipant = {
  name: string;
  score: string;
};

type UseEditMovieOptions = {
  movie?: MovieRatings;
  participantNames: string[];
  onSave?: (entry: MovieSheetEntry) => Promise<void>;
};

const emptyParticipant = (): EditableParticipant => ({ name: '', score: '' });

export const useEditMovie = ({
  movie,
  participantNames,
  onSave,
}: UseEditMovieOptions) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [participants, setParticipants] = useState<EditableParticipant[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const startEditing = () => {
    if (!movie || !onSave) {
      return;
    }

    const existingParticipants = movie.ratings.map((rating) => ({
      name: rating.userName,
      score: String(rating.scores[0] ?? '').trim().replace(',', '.'),
    }));
    setParticipants(existingParticipants.length > 0 ? existingParticipants : [emptyParticipant()]);
    setError('');
    setIsConfirmationOpen(false);
    setIsEditing(true);
  };

  const updateParticipant = (
    participantIndex: number,
    field: keyof EditableParticipant,
    value: string,
  ) => {
    setParticipants((current) => current.map((participant, index) =>
      index === participantIndex ? { ...participant, [field]: value } : participant,
    ));
    setError('');
  };

  const addParticipant = () => {
    setParticipants((current) => [...current, emptyParticipant()]);
    setError('');
  };

  const removeParticipant = (participantIndex: number) => {
    setParticipants((current) => current.length > 1
      ? current.filter((_, index) => index !== participantIndex)
      : current);
    setError('');
  };

  const requestConfirmation = () => {
    if (participants.length === 0) {
      setError('У фильма должен остаться хотя бы один участник');
      return;
    }

    const selectedNames = participants.map((participant) => participant.name);
    const hasInvalidName = selectedNames.some((name) =>
      !name || !participantNames.includes(name),
    );
    if (hasInvalidName) {
      setError('Выберите участника из списка для каждой строки');
      return;
    }

    if (new Set(selectedNames).size !== selectedNames.length) {
      setError('Один участник не может быть добавлен дважды');
      return;
    }

    const hasInvalidScore = participants.some(({ score }) => {
      const parsedScore = Number(score.trim().replace(',', '.'));
      return !score.trim() || !Number.isFinite(parsedScore) || parsedScore < 0 || parsedScore > 10;
    });
    if (hasInvalidScore) {
      setError('Укажите для каждого участника оценку от 0 до 10');
      return;
    }

    if (!movie?.date || !parseDateInput(movie.date)) {
      setError('Не удалось определить дату просмотра фильма');
      return;
    }

    setError('');
    setIsConfirmationOpen(true);
  };

  const confirmSave = async () => {
    if (!movie || !onSave) {
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      await onSave({
        date: parseDateInput(movie.date ?? ''),
        title: movie.movie,
        participants: participants.map(({ name, score }) => ({ name, score })),
      });
      setIsConfirmationOpen(false);
      setIsEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Не удалось сохранить изменения');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setIsConfirmationOpen(false);
    setError('');
  };

  return {
    canEdit: Boolean(movie && onSave),
    isEditing,
    isConfirmationOpen,
    participants,
    isSaving,
    error,
    startEditing,
    updateParticipant,
    addParticipant,
    removeParticipant,
    requestConfirmation,
    confirmSave,
    cancelEditing,
  };
};
