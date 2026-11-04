import { roundRating } from './ratings';

export type MovieRating = {
  userName: string;
  scores: string[];
};

export type MovieRatings = {
  movie: string;
  date?: string;
  ratings: MovieRating[];
};

export type LoadedMovieData = {
  movies: string[];
  movieComments: string[];
  usersRating: MovieRatings[];
  participantNames: string[];
};

export type GoogleSheetsResponse = {
  values?: string[][];
};

export type GoogleSheetsNotesResponse = {
  sheets?: Array<{
    data?: Array<{
      rowData?: Array<{
        values?: Array<{ note?: string }>;
      }>;
    }>;
  }>;
};

export type GoogleUserResponse = {
  name?: string;
  email?: string;
  picture?: string;
};

export type CloudflareSessionResponse = {
  userName: string;
  userPicture: string;
  movies: string[];
  movieComments?: string[];
  ratings: string[][];
  participants: string[];
};

export const parseMovieRatings = (rows: string[][]): MovieRatings[] => {
  const movies: MovieRatings[] = [];
  let currentMovie: MovieRatings | null = null;

  for (const row of rows) {
    if (row.length === 0) {
      if (currentMovie) {
        movies.push(currentMovie);
        currentMovie = null;
      }
      continue;
    }

    const values = row.filter((value) => value !== '' && value !== '2025' && value !== '2026');
    if (values.length === 0) {
      continue;
    }

    const isMovieHeader = /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/.test(String(values[0] ?? ''))
      || /^\d{4}[./-]\d{1,2}[./-]\d{1,2}$/.test(String(values[0] ?? ''));

    if (isMovieHeader) {
      const [date, movieName, userName, ...scores] = values;

      if (!currentMovie || currentMovie.movie !== movieName) {
        if (currentMovie) {
          movies.push(currentMovie);
        }

        currentMovie = {
          movie: movieName,
          date,
          ratings: [],
        };
      }

      if (userName) {
        currentMovie.ratings.push({
          userName,
          scores: scores.filter(Boolean).map(roundRating),
        });
      }

      continue;
    }

    const [movieOrUser, userOrScore, ...scores] = values;

    if (!currentMovie) {
      currentMovie = {
        movie: movieOrUser,
        ratings: userOrScore
          ? [{ userName: userOrScore, scores: scores.map(roundRating) }]
          : [],
      };
    } else {
      currentMovie.ratings.push({
        userName: movieOrUser,
        scores: [userOrScore, ...scores].filter(Boolean).map(roundRating),
      });
    }
  }

  if (currentMovie) {
    movies.push(currentMovie);
  }

  return movies;
};

export const normalizeMovieData = (
  movies: string[],
  movieComments: string[],
  ratings: string[][],
  participants: string[]
): LoadedMovieData => {
  const movieRows = movies
    .map((movie, index) => ({ movie, comment: movieComments[index] ?? '' }))
    .filter(({ movie }) => movie !== '' && movie !== '2025' && movie !== '2026');

  return {
    movies: movieRows.map(({ movie }) => movie),
    movieComments: movieRows.map(({ comment }) => comment),
    usersRating: parseMovieRatings(ratings),
    participantNames: [...new Set(
      participants
        .filter((name) => name !== '' && name !== 'Участники')
        .map((name) => name.trim())
        .filter(Boolean)
    )],
  };
};
