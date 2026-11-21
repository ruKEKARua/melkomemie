import React from 'react';
import type { RewindMovie } from '../../utils/rewindStats';
import { getMovieImageUrl } from '../../api/tmdbImage';
import { aboutClubPlaceholders } from './rewindPlaceholders';

interface RewindHeroSectionProps {
  year: string | 'all';
  movies: RewindMovie[];
}

export const RewindHeroSection: React.FC<RewindHeroSectionProps> = ({ year, movies }) => {
  // Grab up to 27 posters for a rich ambient collage in the background
  const posterMovies = movies
    .filter((m) => Boolean(m.posterPath))
    .slice(0, 27);

  const yearLabel = year === 'all' ? 'всех лет' : `${year} года`;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-gradient-to-b from-amber-500/10 via-slate-100/50 dark:via-[#12141f] to-white dark:to-[#0d0f17] shadow-xl text-center py-14 sm:py-20 md:py-24 px-4 sm:px-6">
      {/* Background Poster Collage with Gradient Mask */}
      {posterMovies.length > 0 && (
        <div
          aria-hidden="true"
          className="absolute inset-0 grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 gap-2 opacity-25 dark:opacity-20 pointer-events-none select-none transform scale-105"
        >
          {posterMovies.map((movie, idx) => (
            <div
              key={`${movie.movieTitle}-${idx}`}
              className="aspect-[2/3] rounded-lg overflow-hidden bg-slate-300 dark:bg-zinc-800"
            >
              <img
                src={getMovieImageUrl(movie.posterPath, 'w500')}
                alt=""
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  const currentSrc = target.src;
                  if (currentSrc.includes('image.tmdb.org')) {
                    target.src = currentSrc.replace('https://image.tmdb.org/t/p', 'https://movies-tmdb-proxy.kekar.workers.dev/image');
                  } else {
                    target.style.opacity = '0';
                  }
                }}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            </div>
          ))}
        </div>
      )}

      {/* Radial soft spotlight overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-radial from-amber-500/15 via-transparent to-transparent pointer-events-none"
      />

      {/* Hero Content */}
      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
        {/* Big Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 sm:mb-4">
          Мелкомемье{' '}
          <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 bg-clip-text text-transparent drop-shadow-sm">
            Rewind
          </span>
        </h1>

        {/* Subtitle with year */}
        <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-slate-700 dark:text-zinc-200 mb-3 sm:mb-5">
          Итоги {yearLabel}
        </h2>

        {/* Description from community block */}
        <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
          {aboutClubPlaceholders.description}
        </p>
      </div>
    </section>
  );
};

export default RewindHeroSection;
