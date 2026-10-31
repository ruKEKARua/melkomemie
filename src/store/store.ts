import { configureStore } from '@reduxjs/toolkit';
import changeModalVisibleReducer from './openModal';
import searchBarReducer from './searchBar';
import excelMoviesReducer from './excelMovies';
import setFoundMoviesReducer from './foundMovies';

export const store = configureStore({
  reducer: {
    openModal: changeModalVisibleReducer,
    searchBarValue: searchBarReducer,
    setExcelMovies: excelMoviesReducer,
    foundMovies: setFoundMoviesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
