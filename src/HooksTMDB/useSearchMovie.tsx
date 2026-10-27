import { useEffect, useState } from 'react'
import { searchMoviesFromSource, type NormalizedMovie } from '../api/movieSource';



type Movie = {

    media_type: 'movie' | 'tv'; // обязательно, что это фильм или сериал
    id: number; // айдишник
    backdrop_path: string; // постер на оригинальном языке
    original_title: string; // название на оригинальном языке (в частности английский)
    title: string; // название на русском
    overview: string; // описание
    poster_path: string; // постер на русском

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
    results: (Media | NormalizedMovie)[];
};

const useSearchMovie = (searchValue: string, enabled: boolean) => {
    const isQueryActive = enabled && Boolean(searchValue.trim());
    const [data, setData] = useState<MovieSliderProps>();

    useEffect(() => {
        if (!isQueryActive) {
            return;
        }

        const timeoutId = window.setTimeout(() => searchMoviesFromSource(searchValue)
            .then(results => setData({ results }))
            .catch(err => console.error(err)), 500);

        return () => window.clearTimeout(timeoutId);
    }, [isQueryActive, searchValue]);

    return isQueryActive ? data : undefined;
}

export default useSearchMovie