import './App.css'


import type { RootState } from "./store/store";

import Button from './components/UI/Button'
import { MovieSlider } from './components/MovieSlider'
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import BackgroundPosters from './components/BackgroundPosters';

import useGetMovies from './HooksExcelMovies/useGetMovies';
import useSearchMovie from './HooksTMDB/useSearchMovie';
import { setSearchBarValue } from './store/searchBar';
import useSetArrayOfSearchedMovies from './HooksTMDB/useSetArrayOfSearchedMovies';
import MovieEntryPage from './pages/MovieEntryPage';
import type { MovieRatings } from './HooksExcelMovies/useGetMovies';
import type { NormalizedMovie } from './api/movieSource';
import MovieRoulette from './components/MovieRoulette';


type PageMode = 'main' | 'entry' | 'roulette';
type SortOrder = 'added' | 'reverse' | 'top-rated' | 'low-rated' | 'alphabetical';

type SortableMedia = {
    title?: string;
    original_title?: string;
    name?: string;
    original_name?: string;
    excelTitle?: string;
};

const getRating = (movie: SortableMedia, ratings: MovieRatings[]) => {
    const movieTitle = (movie.excelTitle ?? movie.title ?? movie.original_title)?.trim().toLowerCase();
    const sheetRating = movieTitle
        ? ratings.find((rating) => rating.movie.trim().toLowerCase() === movieTitle)?.ratings[0]?.scores[1]
        : undefined;
    const ratingNumber = sheetRating?.replace(',', '.').match(/-?\d+(?:\.\d+)?/)?.[0];
    const parsedSheetRating = Number(ratingNumber);

    return Number.isFinite(parsedSheetRating) ? parsedSheetRating : undefined;
};

const sortMovies = <T extends SortableMedia>(movies: T[], sortOrder: SortOrder, ratings: MovieRatings[]) => {
    if (sortOrder === 'reverse') {
        return [...movies].reverse();
    }

    if (sortOrder === 'added') {
        return movies;
    }

    return [...movies].sort((firstMovie, secondMovie) => {
        if (sortOrder === 'alphabetical') {
            const firstTitle = firstMovie.title ?? firstMovie.name ?? firstMovie.original_title ?? firstMovie.original_name ?? '';
            const secondTitle = secondMovie.title ?? secondMovie.name ?? secondMovie.original_title ?? secondMovie.original_name ?? '';

            return firstTitle.localeCompare(secondTitle, 'ru', { sensitivity: 'base' });
        }

        const firstRating = getRating(firstMovie, ratings);
        const secondRating = getRating(secondMovie, ratings);

        if (firstRating === undefined && secondRating === undefined) return 0;
        if (firstRating === undefined) return 1;
        if (secondRating === undefined) return -1;

        return sortOrder === 'top-rated'
            ? secondRating - firstRating
            : firstRating - secondRating;
    });
};

function App() {

    const dispatch = useDispatch();
    const [page, setPage] = useState<PageMode>('main');
    const [isAddMovieRequested, setIsAddMovieRequested] = useState(false);
    const [sortOrder, setSortOrder] = useState<SortOrder>('added');
    const [searchAllMovies, setSearchAllMovies] = useState(false);
    const [highlightMovieTitle, setHighlightMovieTitle] = useState<string | null>(null);

    const searchBarValue = useSelector((state: RootState) => state.searchBarValue.value);
    const moviesFromExcel = useSelector((state: RootState) => state.setExcelMovies.value)
    const foundMovies = useSelector((state: RootState) => state.foundMovies.value);
    
    const searchValueArray = useSearchMovie(searchBarValue, searchAllMovies);

    const normalizedSearchValue = searchBarValue.trim().toLowerCase();
    const filteredSliderMovies = normalizedSearchValue
        ? foundMovies.filter((movie) => {
            if (movie.media_type === 'person') {
                return false;
            }

            return [movie.title, movie.original_title].some((title) =>
                title?.toLowerCase().includes(normalizedSearchValue)
            );
        })
        : foundMovies;

    const { login, logout, isAuthorized, isLoading, userName, userPicture, authError, usersRating, participantNames, saveMovie, updateMovie } = useGetMovies();
    const areMoviesLoaded = useSetArrayOfSearchedMovies(moviesFromExcel);

    const sortedFoundMovies = sortMovies(foundMovies, sortOrder, usersRating);
    const sortedFilteredMovies = sortMovies(filteredSliderMovies, sortOrder, usersRating);
    const sortedSearchMovies = sortMovies(searchValueArray?.results ?? [], sortOrder, usersRating);
    const displayedMovies = searchBarValue.trim() === ''
        ? sortedFoundMovies
        : searchAllMovies
            ? sortedSearchMovies
            : sortedFilteredMovies;
    const isCatalogLoading = isLoading || !areMoviesLoaded;

    

    useEffect(() => {
        if (page !== 'main' || !highlightMovieTitle || isCatalogLoading) {
            return;
        }

        const matchingMovie = foundMovies.some((movie) =>
            movie.media_type !== 'person'
            && movie.excelTitle?.trim().toLocaleLowerCase('ru-RU')
                === highlightMovieTitle.trim().toLocaleLowerCase('ru-RU'),
        );

        if (!matchingMovie) {
            return;
        }

        const timeoutId = window.setTimeout(() => setHighlightMovieTitle(null), 3500);
        return () => window.clearTimeout(timeoutId);
    }, [foundMovies, highlightMovieTitle, isCatalogLoading, page]);

    const randomNumber = (min:number, max:number) => {

        return Math.floor(min + Math.random() * (max + 1 - min));
        
        
    }
    
    const [sliderPages] = useState(() => ({
        first: randomNumber(1, 3),
        second: randomNumber(4, 7),
        third: randomNumber(8, 11),
        fourth: randomNumber(12, 15),
    }));

    

    useEffect(() => {

        //console.log('moviesArray = ', moviesArray)
        // console.log('searchBar = ', searchValueArray)
        // console.log('Кино с экселя = ', moviesFromExcel)
        // console.log('Тест = ', foundMovies)
        // console.log('Оценили: ', usersRating);

    }, [foundMovies, moviesFromExcel, searchValueArray, usersRating])


    if (page === 'roulette') {
        return <MovieRoulette
            excelMovies={foundMovies.filter((movie) => movie.media_type !== 'person') as unknown as NormalizedMovie[]}
            isAuthorized={isAuthorized}
            login={login}
            ratings={usersRating}
            participantNames={participantNames}
            onUpdateMovie={updateMovie}
            onClose={() => setPage('main')}
        />;
    }

    if (page === 'entry' || (isAddMovieRequested && isAuthorized)) {
        return (
            <div className='app-entry-screen min-h-screen bg-slate-950 text-white'>
                <div className='flex justify-end pt-5'>
                    <Button
                        className='rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700'
                        onClick={() => {
                            setPage('main');
                            setIsAddMovieRequested(false);
                        }}
                        label='Вернуться к каталогу'
                    />
                </div>
                <MovieEntryPage
                    participantNames={participantNames}
                    onSave={saveMovie}
                    onSaveSuccess={(title) => {
                        setHighlightMovieTitle(title);
                        dispatch(setSearchBarValue(''));
                        setSearchAllMovies(false);
                        setPage('main');
                        setIsAddMovieRequested(false);
                    }}
                />
            </div>
        );
    }

    return (
        <>
            <div className='auth-panel bg-sky-700 z-10 rounded-br-full absolute'>
                {!isAuthorized ? (
                    <div>
                        <Button className='text-amber-50' onClick={login} label='Авторизоваться с помощью Google' />
                        {authError && <p role='alert' className='max-w-xs px-4 pb-2 text-xs text-red-100'>{authError}</p>}
                    </div>
                ) : (
                    <div className='flex items-center gap-2 text-amber-50 px-4 py-2'>
                        {userPicture && (
                            <img
                                src={userPicture}
                                alt='Аватар пользователя'
                                referrerPolicy='no-referrer'
                                className='w-8 h-8 rounded-full object-cover'
                            />
                        )}
                        <p className='auth-label'>
                            {userName ? (
                                <>
                                    Вы вошли как: <span className='text-amber-400'>{userName}</span>
                                </>
                            ) : 'Вы вошли в аккаунт Google'}
                        </p>
                        <Button className='text-amber-50' onClick={() => void logout()} label='Выйти' />
                    </div>
                )}
            </div>

            <div className='top-actions absolute right-4 top-4 z-20 flex gap-2'>
                <Button
                    className='rounded-xl bg-orange-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-orange-300'
                    onClick={() => setPage('roulette')}
                    label='Рулетка фильмов'
                />
                <Button
                    className='rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400'
                    onClick={() => {
                        if (isAuthorized) {
                            setPage('entry');
                            return;
                        }

                        setIsAddMovieRequested(true);
                        login();
                    }}
                    label={isAuthorized ? 'Добавить фильм' : 'Войти и добавить фильм'}
                />
            </div>
        <div className="background-layer w-screen h-screen overflow-hidden flex items-center justify-center absolute select-none">
            <section className="
                absolute left-1/2 top-1/2 
                flex w-[160%] h-size
                -translate-x-1/2 -translate-y-1/2 rotate-[-4deg] 
                flex-col items-center justify-center select-none opacity-25">
                
                <BackgroundPosters page={sliderPages.first} direction={false} />
                <BackgroundPosters page={sliderPages.second} direction />
                <BackgroundPosters page={sliderPages.third} direction={false} />
                <BackgroundPosters page={sliderPages.fourth} direction />

            </section>
        </div>
        {isAuthorized ? (
        <>

        <section id="center" className='app-content relative z-1 flex flex-col justify-center items-center w-screen h-screen'>

            <header className='app-header'>
                <div className='search-section text-center justify-center items-center'>
                    <h2>Поиск по названию</h2>
                    <div className='search-control-row'>
                        <input type="search" name="search" id="search" aria-label="Поиск по названию" onChange={(event) => {
                            dispatch(setSearchBarValue(event.target.value))
                        }} className="search-input m-auto
                            flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white 
                            shadow-sm transition-all duration-200
                            hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-4
                            focus:ring-blue-300 active:scale-98" />
                        <label className='search-all-label' htmlFor='search-all-movies'>
                            <input
                                id='search-all-movies'
                                className='rounded-2xl'
                                type='checkbox'
                                checked={searchAllMovies}
                                onChange={(event) => setSearchAllMovies(event.target.checked)}
                            />
                            Вся база
                        </label>
                    </div>
                </div>
            </header>

            <section className='slider-section w-full'>
            <div 
              className='catalog-layout' 
                            style={{
                                    gridTemplateColumns: !isCatalogLoading && displayedMovies.length > 0
                                            ? 'minmax(13rem, 16rem) minmax(0, 1fr)'
                                            : '1fr',
                            }}>                    
                {!isCatalogLoading && displayedMovies.length > 0 && (
                        <aside className='sort-settings' aria-label='Настройки сортировки фильмов'>
                            <p className='sort-settings-title'>Настройки</p>
                            <label className='sort-settings-label' htmlFor='movie-sort'>
                                Сортировка фильмов
                            </label>
                            <select
                                className='sort-settings-select'
                                id='movie-sort'
                                value={sortOrder}
                                onChange={(event) => setSortOrder(event.target.value as SortOrder)}
                            >
                                <option value='added'>По порядку добавления</option>
                                <option value='reverse'>С конца</option>
                                <option value='top-rated'>Сначала топовые</option>
                                <option value='low-rated'>Сначала худшие</option>
                                <option value='alphabetical'>По алфавиту</option>
                            </select>
                        </aside>
                    )}

                    <div className='movie-slider-container '>
                        {
                            <MovieSlider
                                media={displayedMovies}
                                ratings={usersRating}
                                participantNames={participantNames}
                                onUpdateMovie={updateMovie}
                                isLoading={isCatalogLoading}
                                highlightMovieTitle={highlightMovieTitle}
                            />
                        }
                    </div>
                </div>
            </section>
                
            {/* <section>
                
                <Button onClick={() => previousPage()} label='предыдущая страница' className='
                rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2'/>
                <Button onClick={() => nextPage()} label='следующая страница' className='
                rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2'/> 
                
                
            </section> */}
              
         
        </section>
                </>
                ) : (
                        <div className='login-prompt'>Войдите в учётную запись</div>
                )}
      
      </>
    )
}

export default App
