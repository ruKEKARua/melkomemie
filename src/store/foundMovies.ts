import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type Movie = {

    media_type: 'movie' | 'tv'; // обязательно, что это фильм или сериал
    id: number; // айдишник
    backdrop_path: string; // постер на оригинальном языке
    original_title: string; // название на оригинальном языке (в частности английский)
    title: string; // название на русском
    overview: string; // описание
    poster_path: string; // постер на русском
    excelTitle?: string;
    isExcelFallback?: boolean;
    release_date?: string;
    genre_ids?: number[];
    genres?: { id: number; name: string }[];
    source?: 'tmdb' | 'kinopoisk';
    vote_average?: number;
    vote_count?: number;

};

type Person = {

    media_type: 'person'; // обязательно, что это человек
    id: number; // айдишник
    gender: number; // гендер в числовом эквиваленте (what)
    name: string; // имя на русском
    original_name: string; // имя на оригинальном языке (в частности английский)
    known_for: KnownForMovie[]; // массив из фильмов, в которых учавствовал актёр
    profile_path: string; // ссылка на фото актёра
    known_for_department: string // "описание", например "Актёр" (актёрская деятельность)

};

type Media = Movie | Person;


type KnownForMovie = {
  id: number;
};

type MovieSliderProps = {
  value: Media[];
};


const initialState: MovieSliderProps = {
  value: [],
};

const foundMoviesSlice = createSlice({
  name: 'foundMovies',
  initialState,
  reducers: {
    setFoundMovies: (state, action: PayloadAction<Movie[]>) => {
      state.value = action.payload;
    },
  },
});

export const { setFoundMovies } = foundMoviesSlice.actions;
export default foundMoviesSlice.reducer;