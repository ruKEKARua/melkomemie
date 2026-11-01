import { searchMoviesFromSource, type NormalizedMovie } from './movieSource';

export async function searchMoviesWithTmdbFallback(query: string): Promise<NormalizedMovie[]> {
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  return searchMoviesFromSource(trimmed);
}
