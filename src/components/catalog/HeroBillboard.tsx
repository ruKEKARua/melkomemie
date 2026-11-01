import { getTmdbImageUrl } from '../../api/tmdbImage';
import { getHeroRatingBadgeStyle } from '../../utils/ratings';
import type { MovieMedia } from '../../hooks/useCatalogMovies';

interface HeroBillboardProps {
  featuredMovie: MovieMedia;
  numericRating?: number;
  onOpenModal: (movie: MovieMedia) => void;
  onNavigateRoulette: () => void;
  onNavigateTournaments: () => void;
}

export const HeroBillboard = ({
  featuredMovie,
  numericRating,
  onOpenModal,
  onNavigateRoulette,
  onNavigateTournaments,
}: HeroBillboardProps) => {
  return (
    <div className="relative w-full h-[45vh] min-h-[22rem] max-h-[32rem] overflow-hidden bg-slate-900 dark:bg-[#0c0e17]">
      {/* Backdrop poster */}
      {featuredMovie.backdrop_path ? (
        <img
          src={getTmdbImageUrl('original', featuredMovie.backdrop_path)}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-top opacity-50 dark:opacity-40 scale-102"
        />
      ) : featuredMovie.poster_path ? (
        <img
          src={getTmdbImageUrl('w1280', featuredMovie.poster_path)}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-40 dark:opacity-30 blur-sm"
        />
      ) : null}

      {/* Cinematic Vignette Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#f4f6fa] dark:from-[#090a0f] via-slate-950/70 dark:via-[#090a0f]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 dark:from-[#090a0f] via-slate-950/70 dark:via-[#090a0f]/80 to-transparent" />

      {/* Billboard Content */}
      <div className="relative z-10 h-full max-w-7xl 2xl:max-w-[1600px] min-[1920px]:max-w-[1800px] min-[2560px]:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-10">
        <div className="max-w-2xl 2xl:max-w-3xl flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1 rounded-md bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30 backdrop-blur-sm">
              <span>★</span>
              <span>ВЫБОР КИНОКЛУБА</span>
            </span>
            {numericRating !== undefined && (
              <span className={`rounded-md px-2.5 py-0.5 text-xs font-extrabold border backdrop-blur-sm ${getHeroRatingBadgeStyle(numericRating)}`}>
                Рейтинг: {numericRating} / 10
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-none drop-shadow-md">
            {featuredMovie.title || featuredMovie.original_title}
          </h1>

          {featuredMovie.overview && (
            <p className="text-xs sm:text-sm md:text-base text-zinc-200 dark:text-zinc-300 line-clamp-3 leading-relaxed drop-shadow max-w-xl">
              {featuredMovie.overview}
            </p>
          )}

          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={() => onOpenModal(featuredMovie)}
              className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-105 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Подробнее и оценки</span>
            </button>

            <button
              onClick={onNavigateRoulette}
              className="flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2.5 text-sm backdrop-blur-md transition-all cursor-pointer border border-white/20"
            >
              <span>🎲</span>
              <span>Случайный фильм</span>
            </button>

            <button
              onClick={onNavigateTournaments}
              className="flex items-center gap-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold px-4 py-2.5 text-sm backdrop-blur-md border border-amber-500/30 transition-all cursor-pointer"
            >
              <span>🏆</span>
              <span>Турниры</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBillboard;
