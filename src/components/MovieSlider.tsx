import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { openModal } from "../store/openModal";
import Modal from "./Modal";
import type { RootState } from "../store/store";

import MovieCard from "./MovieCard";
import type { MovieRatings } from "../HooksExcelMovies/useGetMovies";
import type { MovieSheetEntry } from "../api/googleSheets";
import { getTmdbImageUrl } from "../api/tmdbImage";
import type { MovieSource } from "../api/movieSource";


type Movie = {

    media_type: 'movie' | 'tv'; // обязательно, что это фильм или сериал
    id: number; // айдишник
    backdrop_path: string; // постер на оригинальном языке
    original_title: string; // название на оригинальном языке (в частности английский)
    title: string; // название на русском
    overview: string; // описание
    poster_path: string | null; // постер на русском
    excelTitle?: string;
    isExcelFallback?: boolean;

};

type Person = {

    media_type: 'person'; // обязательно, что это человек
    id: number; // айдишник
    gender: number; // гендер в числовом эквиваленте (what)
    name: string; // имя на русском
    original_name: string; // имя на оригинальном языке (в частности английский)
    known_for: KnownForMovie[]; // массив из фильмов, в которых учавствовал актёр
    profile_path: string | null; // ссылка на фото актёра
    known_for_department: string // "описание", например "Актёр" (актёрская деятельность)

};

type Media = Movie | Person;


type KnownForMovie = {
  id: number;
};

type MovieSliderProps = {
  media: Media[];
  ratings: MovieRatings[];
  participantNames?: string[];
  onUpdateMovie?: (entry: MovieSheetEntry) => Promise<void>;
  isLoading?: boolean;
  highlightMovieTitle?: string | null;
};


export function MovieSlider({
    media,
    ratings,
    participantNames = [],
    onUpdateMovie,
    isLoading = false,
    highlightMovieTitle,
}: MovieSliderProps ) {
    
    const dispatch = useDispatch();
    const sliderRef = useRef<HTMLDivElement>(null);
    
    const isModalOpen = useSelector((state: RootState) => state.openModal.value)

    const [movie_ID, setMovie_ID] = useState<number | null>(null);
    const [excelMovieTitle, setExcelMovieTitle] = useState<string | undefined>();
    const [movieSource, setMovieSource] = useState<MovieSource>('tmdb');
    const [fallbackMovieTitle, setFallbackMovieTitle] = useState<string | undefined>();

    const posterSize = 'w780';
    const openDescription = (
        movieID: number,
        sourceTitle?: string,
        source: MovieSource = 'tmdb',
        fallbackTitle?: string,
    ) => {
        
        setMovie_ID(movieID)
        setExcelMovieTitle(sourceTitle)
        setMovieSource(source)
        setFallbackMovieTitle(fallbackTitle)
        
        
        dispatch(openModal())

    }

    useEffect(() => {
        if (!highlightMovieTitle || isLoading) {
            return;
        }

        const targetSlide = Array.from(
            sliderRef.current?.querySelectorAll<HTMLElement>('.movie-slide[data-excel-title]') ?? [],
        ).find((slide) => slide.dataset.excelTitle === highlightMovieTitle);

        targetSlide?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [highlightMovieTitle, isLoading, media]);


    return (
        !isLoading && media.length > 0 ? <div className="movie-slider">

            {/* <div>
                <h1 className="">Номер страницы: {page}</h1>

                <SearchBar/> <br></br>
            </div>         */}
                <div ref={sliderRef} className="movie-slider-frame relative rounded-3xl shadow-[inset-20] select-auto page-enter">
                    <div className="movie-grid rounded-3xl bg-gray-600/0">

                        {
                            media.map((media, key) => {

                                if (media.media_type != 'person') {
                                    
                                    const movieVariables: Movie = {
                                        
                                        media_type: media.media_type,
                                        poster_path: 'source' in media && media.source === 'kinopoisk'
                                            ? media.poster_path
                                            : getTmdbImageUrl(posterSize, media.poster_path),
                                        title: media.title,
                                        original_title: media.original_title,
                                        overview: media.overview,
                                        id: media.id,
                                        backdrop_path: media.backdrop_path,
                                    }

                                    const title = movieVariables.title ? movieVariables.title : movieVariables.original_title;
                                    const id = movieVariables.id;
                                    const posterPath = movieVariables.poster_path ?? '';
                                    const overallRating = media.excelTitle
                                        ? ratings.find((movie) => movie.movie.trim().toLowerCase() === media.excelTitle?.trim().toLowerCase())?.ratings[0]?.scores[1]
                                        : undefined;

                                    return (

                                        
                                        <div
                                            key={key}
                                            className={`movie-slide p-2${media.excelTitle === highlightMovieTitle ? ' movie-slide-highlight' : ''}`}
                                            data-excel-title={media.excelTitle}
                                        >
                                        
                                            <MovieCard
                                                id={id}
                                                title={title}
                                                posterPath={posterPath}
                                                overallRating={overallRating}
                                                func={(movieID) => openDescription(
                                                    movieID,
                                                    media.excelTitle,
                                                    'source' in media && (media.source === 'tmdb' || media.source === 'kinopoisk')
                                                        ? media.source
                                                        : 'tmdb',
                                                    media.isExcelFallback ? title : undefined,
                                                )}
                                            />

                                        </div>

                                    )

                                }

                                const personVariables: Person = {

                                    media_type: 'person',
                                    id: media.id,
                                    gender: media.gender,
                                    name: media.name,
                                    original_name: media.original_name,
                                    known_for: media.known_for,
                                    profile_path: getTmdbImageUrl(posterSize, media.profile_path),
                                    known_for_department: media.known_for_department

                                }

                                const russianName = personVariables.name;
                                const originalName = personVariables.original_name;
                                //const knownFor = personVariables.known_for_department;
                                const image = personVariables.profile_path;
                                const movieId = personVariables.known_for[0]?.id;

                                const placeholderImage = `https://placehold.co/780x1170?text=${russianName}`;

                                return(
                                    <div key={key} className="movie-slide p-2">

                                        <div className="movie-card w-60 m-auto gap-5 flex flex-col justify-center items-center" key={media.id} >

                                            <p className="movie-title text-white">
                                                {russianName ? russianName : originalName}
                                            </p>

                                            <div
                                            className={`movie-poster poster-clickable m-auto rounded-2xl ${movieId === undefined ? 'poster-disabled' : ''}`}
                                            role={movieId !== undefined ? 'button' : undefined}
                                            tabIndex={movieId !== undefined ? 0 : undefined}
                                            aria-label={movieId !== undefined ? `Открыть описание: ${russianName || originalName}` : undefined}
                                            onClick={() => movieId !== undefined && openDescription(movieId)}
                                            onKeyDown={(event) => {
                                                if (movieId !== undefined && (event.key === 'Enter' || event.key === ' ')) {
                                                    event.preventDefault();
                                                    openDescription(movieId);
                                                }
                                            }}
                                            >
                                                <img src={image || placeholderImage} alt={russianName || originalName} className="movie-poster-image m-auto rounded-2xl"/>
                                            
                                            </div>

                                        </div>

                                    </div>
                                )
                            })
                        }

                    </div>


                    {/* если true, то класс hidden снимается, иначе происходит отображение модального окна */}
                    {isModalOpen && movie_ID !== null && (
                    <Modal
                        key={movie_ID}
                        isHidden=""
                        movie_ID={movie_ID}
                        source={movieSource}
                        ratings={ratings}
                        excelMovieTitle={excelMovieTitle}
                        fallbackTitle={fallbackMovieTitle}
                        participantNames={participantNames}
                        onUpdateMovie={onUpdateMovie}
                    />
                    )}
                </div>
            </div>  

        :   <div className="empty-slider flex items-center justify-center">
                {isLoading ? (
                    <div className="flex items-center gap-3" role="status" aria-live="polite">
                        <span className="text-4xl font-bold">Загружаем фильмы</span>
                        <span
                            aria-label="Загрузка"
                            className="w-10 h-10 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600"
                        />
                    </div>
                ) : (
                    <h1>Ничего не найдено</h1>
                )}
            </div>
    );
}