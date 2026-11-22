export type MovieSheetEntry = {
  date: string;
  title: string;
  originalDate?: string;
  originalTitle?: string;
  number?: number;
  participants: Array<{ name: string; score: string }>;
};

/**
 * @deprecated Прямые запросы к Google Sheets REST API v4 устарели.
 * Добавление фильмов теперь выполняется через Google Apps Script (Code.gs).
 */
export async function appendMovieToSheet(..._args: unknown[]): Promise<void> {
  void _args;
  throw new Error('appendMovieToSheet устарел. Используйте бэкенд Google Apps Script.');
}

/**
 * @deprecated Прямые запросы к Google Sheets REST API v4 устарели.
 * Обновление фильмов теперь выполняется через Google Apps Script (Code.gs).
 */
export async function updateMovieInSheet(..._args: unknown[]): Promise<void> {
  void _args;
  throw new Error('updateMovieInSheet устарел. Используйте бэкенд Google Apps Script.');
}
