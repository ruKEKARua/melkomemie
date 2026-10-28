import { useMemo } from 'react';
import usePopularMovies from '../HooksTMDB/usePopularMovies';
import { getTmdbImageUrl } from '../api/tmdbImage';

interface BackgroundPostersProps {
  page: number;
  direction?: boolean;
}

const BackgroundPosters = ({ page, direction }: BackgroundPostersProps) => {
  const popularMoviesArray = usePopularMovies(page);
  const posterSize = 'w92';

  const postersURL = useMemo(() => {
    return popularMoviesArray
      .map((image) => getTmdbImageUrl(posterSize, image.poster_path))
      .filter((url): url is string => Boolean(url && url.trim().length > 0));
  }, [popularMoviesArray]);

  return (
    <div
      className="size-full flex items-center gap-5 mt-2 mb-2 select-none"
      style={{
        transform: `translateX(${direction ? 150 : -150}px)`,
      }}
    >
      {postersURL.map((poster, index) => (
        <img
          key={popularMoviesArray[index]?.id ? `${popularMoviesArray[index].id}-${index}` : index}
          src={poster}
          alt=""
          decoding="async"
          width="200"
          height="300"
          className="h-full w-40 rounded-4xl shrink-0 object-cover pointer-events-none"
        />
      ))}
    </div>
  );
};

export default BackgroundPosters;
