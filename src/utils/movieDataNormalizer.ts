import { roundRating, normalizeMovieTitle } from './ratings';

export type MovieRating = {
  userName: string;
  scores: string[];
};

export type MovieRatings = {
  movie: string;
  date?: string;
  cellColor?: string;
  ratings: MovieRating[];
};

export type LoadedMovieData = {
  movies: string[];
  movieComments: string[];
  movieColors: string[];
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

export const parseMovieRatings = (
  rows: string[][],
  colorMap?: Map<string, string>,
): MovieRatings[] => {
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

        const cellColor: string | undefined = colorMap?.get(normalizeMovieTitle(movieName));
        currentMovie = {
          movie: movieName,
          date,
          cellColor: cellColor || undefined,
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
      const cellColor: string | undefined = colorMap?.get(normalizeMovieTitle(movieOrUser));
      currentMovie = {
        movie: movieOrUser,
        cellColor: cellColor || undefined,
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
  participants: string[],
  movieColors?: string[],
): LoadedMovieData => {
  const colorMap = new Map<string, string>();

  // Track colors across rows so that any movie whose cell or row is colored gets that color
  let currentTitle = '';
  for (let i = 0; i < movies.length; i++) {
    const raw = movies[i];
    if (raw && raw !== '2025' && raw !== '2026') {
      currentTitle = raw;
    }
    const color = movieColors?.[i];
    if (currentTitle && color && color.toLowerCase() !== '#ffffff' && color.toLowerCase() !== '#434343') {
      colorMap.set(normalizeMovieTitle(currentTitle), color);
    }
  }

  const movieRows = movies
    .map((movie, index) => {
      const color = movieColors?.[index] ?? colorMap.get(normalizeMovieTitle(movie)) ?? '';
      return {
        movie,
        comment: movieComments[index] ?? '',
        color,
      };
    })
    .filter(({ movie }) => movie !== '' && movie !== '2025' && movie !== '2026');

  movieRows.forEach(({ movie, color }) => {
    if (movie && color) {
      colorMap.set(normalizeMovieTitle(movie), color);
    }
  });

  return {
    movies: movieRows.map(({ movie }) => movie),
    movieComments: movieRows.map(({ comment }) => comment),
    movieColors: movieRows.map(({ color }) => color),
    usersRating: parseMovieRatings(ratings, colorMap),
    participantNames: [...new Set(
      participants
        .filter((name) => name !== '' && name !== 'Участники')
        .map((name) => name.trim())
        .filter(Boolean)
    )],
  };
};
