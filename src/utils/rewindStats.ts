import type { MovieRatings } from './movieDataNormalizer';
import type { NormalizedMovie } from '../api/movieSource';
import type { Movie } from '../store/foundMovies';
import { normalizeMovieTitle } from './ratings';
import { agreeAdjective } from './nameGrammar';

/* ========================================================================== */
/*                             TYPES & INTERFACES                             */
/* ========================================================================== */

export type RewindParsedDate = {
  year: number;
  month: number; // 1-12
  day: number;
};

export type RewindParticipantRating = {
  userName: string;
  score: number;
};

export type RewindMovieGenre = {
  id?: number;
  name: string;
};

export type RewindMovie = {
  movieTitle: string; // Original title from Google Sheets / Excel
  excelTitle: string;
  date?: string;
  parsedDate?: RewindParsedDate;
  overallRating: number; // Rounded to 2 decimals, 0 if unavailable
  participantRatings: RewindParticipantRating[];
  tmdbId?: number;
  title: string;
  originalTitle: string;
  posterPath: string;
  backdropPath: string;
  releaseDate?: string;
  genres: RewindMovieGenre[];
  isFound: boolean;
};

export type RewindMovieSummary = {
  movieTitle: string;
  title: string;
  posterPath: string;
  backdropPath?: string;
  rating: number;
  clubRating?: number;
  genres: string[];
  date?: string;
  releaseDate?: string;
  id?: number;
};

export type RewindClubSummary = {
  totalMovies: number;
  avgRating: number;
  top3Best: RewindMovieSummary[];
  top3Worst: RewindMovieSummary[];
};

export type ParticipantStats = {
  userName: string;
  watchedCount: number;
  avgRating: number;
};

export type GenreRadarItem = {
  genre: string;
  count: number;
  weightedCount: number;
  avgRating: number;
  percentage: number; // 0-100% of watched movies by this user/club
  weightedPercentage: number; // 0-100% of weighted genre share
};

export type UserProfileStats = {
  userName: string;
  watchedCount: number;
  avgRating: number;
  radar: GenreRadarItem[];
  top5Best: RewindMovieSummary[];
  top3Worst: RewindMovieSummary[];
};

export type MovieComparisonItem = {
  movieTitle: string;
  posterPath: string;
  scoreA: number;
  scoreB: number;
  diff: number;
  overallRating: number;
};

export type PairCompatibility = {
  userA: string;
  userB: string;
  commonMoviesCount: number;
  compatibilityScore: number; // 0-100%
  avgDiff: number;
  top5Closest: MovieComparisonItem[];
  top5Disagreements: MovieComparisonItem[];
};

export type MonthlyActivityItem = {
  monthIndex: number; // 0-11
  monthNumber: number; // 1-12
  label: string; // Russian month name, e.g. "Январь"
  count: number;
  avgRating: number;
  movies: RewindMovieSummary[];
};

export type RewindAchievement = {
  id:
    | 'unanimous_top'
    | 'most_controversial'
    | 'frequent_pair'
    | 'top_genre'
    | 'top_moviegoer'
    | 'strictest_critic';
  title: string;
  badge: string;
  nominee: string;
  value: string | number;
  description: string;
  template: string;
  details?: Record<string, unknown>;
};

export type GenreRadarStructure = {
  topGenres: string[];
  profiles: Record<string, UserProfileStats>;
  getProfile: (userName: string) => UserProfileStats;
};

export type BuildRewindStatsParams = {
  usersRating: MovieRatings[];
  foundMovies: Array<NormalizedMovie | Movie>;
  participantNames?: string[];
  year: string | 'all';
};

export type RewindStatsResult = {
  year: string | 'all';
  totalLoadedMovies: number;
  clubSummary: RewindClubSummary;
  eligibleParticipants: string[];
  participantStats: ParticipantStats[];
  genreRadar: GenreRadarStructure;
  compatibilityMatrix: PairCompatibility[];
  compareTwoParticipants: (userA: string, userB: string) => PairCompatibility;
  monthlyActivity: MonthlyActivityItem[];
  achievements: RewindAchievement[];
  movies: RewindMovie[];
};

/* ========================================================================== */
/*                                CONSTANTS                                   */
/* ========================================================================== */

export const REWIND_MONTH_LABELS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
] as const;

export const MIN_ELIGIBLE_MOVIES_COUNT = 10;

/**
 * Umbrella genres that frequently appear on TMDB/Kinopoisk alongside specific genres.
 * When a movie has other specific genres, umbrella genres receive reduced weight (0.3)
 * so they don't dominate the genre radar chart.
 */
export const UMBRELLA_GENRES = new Set<string>(['драма']);

/* ========================================================================== */
/*                            HELPER UTILITIES                                */
/* ========================================================================== */

/**
 * Strips asterisks, tabs and trims whitespace from participant name.
 */
export function cleanParticipantName(name?: string): string {
  if (!name) return '';
  return name.replace(/[*]+/g, '').trim();
}

/**
 * Safe round to 2 decimals without floating point jitter.
 */
export function safeRound(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Parses numeric score between 0 and 10 from strings like "8", "7.5", "7,5".
 */
export function parseScore(val: unknown): number | null {
  if (val === undefined || val === null || val === '') return null;
  const str = String(val).trim().replace(',', '.');
  const num = parseFloat(str);
  if (!Number.isFinite(num) || num < 0 || num > 10) return null;
  return safeRound(num);
}

/**
 * Robust date parser supporting YYYY-MM-DD, DD.MM.YYYY, DD.MM.YY and plain YYYY.
 */
export function parseMovieDate(dateStr?: string): RewindParsedDate | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // 1. ISO format: YYYY-MM-DD or YYYY.MM.DD or YYYY/MM/DD
  const isoMatch = trimmed.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }

  // 2. DMY format: DD.MM.YYYY or DD.MM.YY
  const dmyMatch = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    let year = parseInt(dmyMatch[3], 10);
    if (dmyMatch[3].length === 2) {
      year = 2000 + year;
    }
    if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }

  // 3. 4-digit year standalone
  const yearMatch = trimmed.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    return { year, month: 1, day: 1 };
  }

  return null;
}

/**
 * Extracts 4-digit year string from a date string.
 */
export function parseMovieYear(dateStr?: string): string | null {
  const parsed = parseMovieDate(dateStr);
  return parsed ? String(parsed.year) : null;
}

/**
 * Returns a sorted list of unique years present in usersRating (descending).
 */
export function getAvailableRewindYears(usersRating: MovieRatings[]): string[] {
  if (!Array.isArray(usersRating)) return [];
  const yearsSet = new Set<string>();

  for (const item of usersRating) {
    const year = parseMovieYear(item?.date);
    if (year) {
      yearsSet.add(year);
    }
  }

  return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
}

/**
 * Extracts array of normalized genre names from heterogeneous genre objects or strings.
 */
function extractGenreNames(genres?: unknown[]): string[] {
  if (!Array.isArray(genres)) return [];
  const names: string[] = [];
  for (const g of genres) {
    if (typeof g === 'string') {
      const trimmed = g.trim();
      if (trimmed) names.push(trimmed);
    } else if (g && typeof g === 'object' && 'name' in g) {
      const name = String((g as { name?: unknown }).name ?? '').trim();
      if (name) names.push(name);
    }
  }
  return names;
}

/**
 * Calculates normalized genre weights for a movie.
 * - If genres array is empty -> returns empty Map.
 * - If the movie has >= 1 genre NOT in UMBRELLA_GENRES, each genre in UMBRELLA_GENRES gets base weight 0.3, others 1.0.
 * - If all genres belong to UMBRELLA_GENRES (pure drama), base weight is 1.0.
 * - Normalizes weights within the movie so their sum always equals 1.0.
 */
export function getMovieGenreWeights(
  genres: Array<{ id?: number; name: string }>,
): Map<string, number> {
  const result = new Map<string, number>();
  if (!genres || !Array.isArray(genres) || genres.length === 0) {
    return result;
  }

  // Deduplicate genres by lowercase name, keeping trimmed original name
  const uniqueGenres = new Map<string, string>(); // lower -> original trimmed
  for (const g of genres) {
    const trimmed = g?.name ? g.name.trim() : '';
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (!uniqueGenres.has(lower)) {
      uniqueGenres.set(lower, trimmed);
    }
  }

  if (uniqueGenres.size === 0) {
    return result;
  }

  // Check if at least one non-umbrella genre is present
  let hasNonUmbrella = false;
  for (const lower of uniqueGenres.keys()) {
    if (!UMBRELLA_GENRES.has(lower)) {
      hasNonUmbrella = true;
      break;
    }
  }

  let totalBaseWeight = 0;
  const baseWeights = new Map<string, number>();

  for (const [lower, originalName] of uniqueGenres.entries()) {
    const isUmbrella = UMBRELLA_GENRES.has(lower);
    const baseWeight = hasNonUmbrella && isUmbrella ? 0.3 : 1.0;
    baseWeights.set(originalName, baseWeight);
    totalBaseWeight += baseWeight;
  }

  if (totalBaseWeight <= 0) {
    return result;
  }

  // Normalize weights so their sum equals 1.0
  for (const [originalName, baseWeight] of baseWeights.entries()) {
    result.set(originalName, baseWeight / totalBaseWeight);
  }

  return result;
}

/**
 * Normalizes title for loose matching.
 */
function looseNormalizeTitle(title?: string): string {
  return (title ?? '')
    .toLocaleLowerCase('ru-RU')
    .replace(/[«»"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Standard deviation calculator with defensive division guards.
 */
export function computeStandardDeviation(numbers: number[]): {
  sd: number;
  avg: number;
  min: number;
  max: number;
} {
  if (numbers.length === 0) {
    return { sd: 0, avg: 0, min: 0, max: 0 };
  }
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const sum = numbers.reduce((acc, n) => acc + n, 0);
  const avg = safeRound(sum / numbers.length);

  if (numbers.length === 1) {
    return { sd: 0, avg, min, max };
  }

  const variance =
    numbers.reduce((acc, n) => acc + Math.pow(n - avg, 2), 0) / numbers.length;
  const sd = safeRound(Math.sqrt(variance));

  return { sd, avg, min, max };
}

/* ========================================================================== */
/*                          CORE LOGIC & MERGING                              */
/* ========================================================================== */

/**
 * Converts a RewindMovie into a concise summary object.
 */
export function toMovieSummary(
  movie: RewindMovie,
  overrideRating?: number,
): RewindMovieSummary {
  return {
    movieTitle: movie.movieTitle,
    title: movie.title || movie.movieTitle,
    posterPath: movie.posterPath,
    backdropPath: movie.backdropPath,
    rating: overrideRating !== undefined ? safeRound(overrideRating) : movie.overallRating,
    clubRating: movie.overallRating > 0 ? safeRound(movie.overallRating) : undefined,
    genres: movie.genres.map((g) => g.name).filter(Boolean),
    date: movie.date,
    releaseDate: movie.releaseDate,
    id: movie.tmdbId,
  };
}

/**
 * Compares two participants across their shared movie history.
 */
export function compareTwoParticipants(
  movies: RewindMovie[],
  userA: string,
  userB: string,
): PairCompatibility {
  const normA = cleanParticipantName(userA).toLowerCase();
  const normB = cleanParticipantName(userB).toLowerCase();

  const comparisonItems: MovieComparisonItem[] = [];

  for (const m of movies) {
    const ratingA = m.participantRatings.find(
      (p) => cleanParticipantName(p.userName).toLowerCase() === normA,
    );
    const ratingB = m.participantRatings.find(
      (p) => cleanParticipantName(p.userName).toLowerCase() === normB,
    );

    if (ratingA !== undefined && ratingB !== undefined) {
      const diff = safeRound(Math.abs(ratingA.score - ratingB.score));
      comparisonItems.push({
        movieTitle: m.movieTitle,
        posterPath: m.posterPath,
        scoreA: ratingA.score,
        scoreB: ratingB.score,
        diff,
        overallRating: m.overallRating,
      });
    }
  }

  const commonMoviesCount = comparisonItems.length;

  if (commonMoviesCount === 0) {
    return {
      userA,
      userB,
      commonMoviesCount: 0,
      compatibilityScore: 0,
      avgDiff: 0,
      top5Closest: [],
      top5Disagreements: [],
    };
  }

  const sumDiff = comparisonItems.reduce((acc, item) => acc + item.diff, 0);
  const avgDiff = safeRound(sumDiff / commonMoviesCount);
  // Scale 0-100%: 0 diff = 100%, 1 diff = 82%, 2 diff = 64%, etc.
  const compatibilityScore = Math.round(Math.max(0, Math.min(100, 100 - avgDiff * 18)));

  // 5 films with lowest score difference (closest taste)
  const sortedClosest = [...comparisonItems].sort((a, b) => {
    if (a.diff !== b.diff) return a.diff - b.diff;
    return b.overallRating - a.overallRating;
  });

  // 5 films with highest score difference (greatest disagreement)
  const sortedDisagreements = [...comparisonItems].sort((a, b) => {
    if (a.diff !== b.diff) return b.diff - a.diff;
    return b.overallRating - a.overallRating;
  });

  return {
    userA,
    userB,
    commonMoviesCount,
    compatibilityScore,
    avgDiff,
    top5Closest: sortedClosest.slice(0, 5),
    top5Disagreements: sortedDisagreements.slice(0, 5),
  };
}

/**
 * Builds user genre radar & top best/worst lists for either 'all' or a specific participant.
 */
function buildUserProfileStats(
  movies: RewindMovie[],
  topGenres: string[],
  userName: string,
): UserProfileStats {
  const isClub = userName === 'all';
  const normUser = cleanParticipantName(userName).toLowerCase();

  const userMoviesWithScore: Array<{ movie: RewindMovie; score: number }> = [];

  for (const movie of movies) {
    if (isClub) {
      if (movie.overallRating > 0) {
        userMoviesWithScore.push({ movie, score: movie.overallRating });
      }
    } else {
      const pRating = movie.participantRatings.find(
        (p) => cleanParticipantName(p.userName).toLowerCase() === normUser,
      );
      if (pRating && pRating.score >= 0) {
        userMoviesWithScore.push({ movie, score: pRating.score });
      }
    }
  }

  const watchedCount = userMoviesWithScore.length;
  const sumScores = userMoviesWithScore.reduce((acc, item) => acc + item.score, 0);
  const avgRating = watchedCount > 0 ? safeRound(sumScores / watchedCount) : 0;

  // Radar for top genres
  const radar: GenreRadarItem[] = topGenres.map((genre) => {
    const genreLower = genre.toLowerCase();

    let rawCount = 0;
    let weightedCount = 0;
    let sumScore = 0;

    for (const { movie, score } of userMoviesWithScore) {
      const weights = getMovieGenreWeights(movie.genres);
      let matchWeight = 0;
      let hasGenre = false;

      for (const [gName, weight] of weights.entries()) {
        if (gName.toLowerCase() === genreLower) {
          hasGenre = true;
          matchWeight += weight;
        }
      }

      if (!hasGenre) {
        hasGenre = movie.genres.some((g) => g.name?.trim().toLowerCase() === genreLower);
      }

      if (hasGenre) {
        rawCount += 1;
        weightedCount += matchWeight;
        sumScore += score;
      }
    }

    const gAvg = rawCount > 0 ? safeRound(sumScore / rawCount) : 0;
    const percentage = watchedCount > 0 ? Math.round((rawCount / watchedCount) * 100) : 0;
    const weightedPercentage =
      watchedCount > 0 ? Math.min(100, Math.round((weightedCount / watchedCount) * 100)) : 0;

    return {
      genre,
      count: rawCount,
      weightedCount: safeRound(weightedCount),
      avgRating: gAvg,
      percentage,
      weightedPercentage,
    };
  });

  // Top 5 Best
  const sortedBest = [...userMoviesWithScore].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.movie.overallRating - a.movie.overallRating;
  });
  const top5Best = sortedBest.slice(0, 5).map(({ movie, score }) => toMovieSummary(movie, score));

  // Top 3 Worst (among movies with a valid non-zero rating)
  const sortedWorst = [...userMoviesWithScore]
    .filter((it) => it.score > 0)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return a.movie.overallRating - b.movie.overallRating;
    });
  const top3Worst = sortedWorst.slice(0, 3).map(({ movie, score }) => toMovieSummary(movie, score));

  return {
    userName,
    watchedCount,
    avgRating,
    radar,
    top5Best,
    top3Worst,
  };
}

/* ========================================================================== */
/*                              ACHIEVEMENTS                                  */
/* ========================================================================== */

function buildAchievements(
  movies: RewindMovie[],
  eligibleParticipants: string[],
  compatibilityMatrix: PairCompatibility[],
): RewindAchievement[] {
  // 1. Unanimous Top ("Рождественское перемирие")
  let unanimousNominee = '—';
  let unanimousRating = '—';
  const moviesWithRatings = movies.filter(
    (m) => m.overallRating > 0 && m.participantRatings.length >= 2,
  );

  if (moviesWithRatings.length > 0) {
    // Find movie with highest score and minimal difference between max and min participant scores
    const bestUnanimous = [...moviesWithRatings].sort((a, b) => {
      const aScores = a.participantRatings.map((p) => p.score);
      const bScores = b.participantRatings.map((p) => p.score);
      const aDiff = Math.max(...aScores) - Math.min(...aScores);
      const bDiff = Math.max(...bScores) - Math.min(...bScores);

      // Prioritize films with high rating (>= 7.5) and diff <= 1.5
      const aIsUnanimous = a.overallRating >= 7.0 && aDiff <= 1.5;
      const bIsUnanimous = b.overallRating >= 7.0 && bDiff <= 1.5;

      if (aIsUnanimous && !bIsUnanimous) return -1;
      if (!aIsUnanimous && bIsUnanimous) return 1;

      if (aIsUnanimous && bIsUnanimous) {
        if (aDiff !== bDiff) return aDiff - bDiff;
        return b.overallRating - a.overallRating;
      }

      return b.overallRating - a.overallRating;
    })[0];

    if (bestUnanimous) {
      unanimousNominee = bestUnanimous.movieTitle;
      unanimousRating = String(bestUnanimous.overallRating);
    }
  } else if (movies.length > 0) {
    const highest = [...movies].sort((a, b) => b.overallRating - a.overallRating)[0];
    if (highest) {
      unanimousNominee = highest.movieTitle;
      unanimousRating = String(highest.overallRating);
    }
  }

  const unanimousTemplate =
    'Фильм «{movie}» объединил клуб: единогласный балл {rating} при минимальных разногласиях.';
  const unanimousDesc = unanimousTemplate
    .replace('{movie}', unanimousNominee)
    .replace('{rating}', unanimousRating);

  // 2. Most Controversial ("Яблоко раздора")
  let controversialMovie = '—';
  let controversialMin = '—';
  let controversialMax = '—';
  let controversialSd = '—';

  const multiScoreMovies = movies.filter((m) => m.participantRatings.length >= 2);
  if (multiScoreMovies.length > 0) {
    const sortedBySd = multiScoreMovies
      .map((m) => {
        const scores = m.participantRatings.map((p) => p.score);
        const stats = computeStandardDeviation(scores);
        return { movie: m, ...stats };
      })
      .sort((a, b) => b.sd - a.sd);

    const mostSplit = sortedBySd[0];
    if (mostSplit && mostSplit.sd > 0) {
      controversialMovie = mostSplit.movie.movieTitle;
      controversialMin = String(mostSplit.min);
      controversialMax = String(mostSplit.max);
      controversialSd = String(mostSplit.sd);
    }
  }

  const controversialTemplate =
    'Фильм «{movie}» вызвал самые ожесточенные споры: разброс оценок от {minScore} до {maxScore} (SD: {sd}).';
  const controversialDesc = controversialTemplate
    .replace('{movie}', controversialMovie)
    .replace('{minScore}', controversialMin)
    .replace('{maxScore}', controversialMax)
    .replace('{sd}', controversialSd);

  // 3. Most Frequent Pair ("Неразлучники")
  let pairNominee = '—';
  let pairCount = 0;

  if (compatibilityMatrix.length > 0) {
    const sortedPairs = [...compatibilityMatrix].sort(
      (a, b) => b.commonMoviesCount - a.commonMoviesCount,
    );
    const topPair = sortedPairs[0];
    if (topPair && topPair.commonMoviesCount > 0) {
      pairNominee = `${topPair.userA} и ${topPair.userB}`;
      pairCount = topPair.commonMoviesCount;
    }
  }

  const pairTemplate =
    '{userA} и {userB} провели вместе больше всего сеансов: {count} совместных просмотров.';
  const pairDesc = pairNominee.includes(' и ')
    ? pairTemplate
        .replace('{userA}', pairNominee.split(' и ')[0])
        .replace('{userB}', pairNominee.split(' и ')[1])
        .replace('{count}', String(pairCount))
    : 'В этом периоде совместных киносеансов не зафиксировано.';

  // 4. Top Genre ("Жанровый фаворит" / "Жанровый триумф")
  let topGenreName = '—';
  let topGenreCount = 0;
  let topGenreWeight = 0;

  if (movies.length > 0) {
    const genreWeights = new Map<string, number>();
    const genreRawCounts = new Map<string, number>();
    const canonicalGenreNames = new Map<string, string>();

    for (const m of movies) {
      const weights = getMovieGenreWeights(m.genres);

      const seenInMovie = new Set<string>();
      for (const g of m.genres) {
        if (!g.name) continue;
        const trimmed = g.name.trim();
        if (!trimmed) continue;
        const lower = trimmed.toLowerCase();
        if (!canonicalGenreNames.has(lower)) {
          canonicalGenreNames.set(lower, trimmed);
        }
        if (!seenInMovie.has(lower)) {
          seenInMovie.add(lower);
          genreRawCounts.set(lower, (genreRawCounts.get(lower) ?? 0) + 1);
        }
      }

      for (const [gName, weight] of weights.entries()) {
        const lower = gName.trim().toLowerCase();
        genreWeights.set(lower, (genreWeights.get(lower) ?? 0) + weight);
      }
    }

    const sortedByWeight = Array.from(genreWeights.entries()).sort((a, b) => {
      if (Math.abs(b[1] - a[1]) > 0.0001) {
        return b[1] - a[1];
      }
      return (genreRawCounts.get(b[0]) ?? 0) - (genreRawCounts.get(a[0]) ?? 0);
    });

    if (sortedByWeight[0]) {
      const bestLower = sortedByWeight[0][0];
      topGenreName = canonicalGenreNames.get(bestLower) || bestLower;
      topGenreWeight = safeRound(sortedByWeight[0][1]);
      topGenreCount = genreRawCounts.get(bestLower) ?? 0;
    }
  }

  const genreTemplate =
    'Жанр «{genre}» стал безоговорочным лидером клуба — {count} просмотренных картин (вес {weight}).';
  const genreDesc =
    topGenreName !== '—'
      ? genreTemplate
          .replace('{genre}', topGenreName)
          .replace('{count}', String(topGenreCount))
          .replace('{weight}', String(topGenreWeight.toFixed(1)))
      : 'В этом периоде не удалось определить преобладающий жанр.';

  // 5. Top Moviegoer ("Главный киноман")
  const participantMovieCounts = new Map<string, number>();
  for (const m of movies) {
    for (const p of m.participantRatings) {
      const name = cleanParticipantName(p.userName);
      if (!name || name.toLowerCase() === 'участники') continue;
      participantMovieCounts.set(name, (participantMovieCounts.get(name) ?? 0) + 1);
    }
  }

  let topGoerName = '—';
  let topGoerCount = 0;
  const sortedGoers = Array.from(participantMovieCounts.entries()).sort(
    (a, b) => b[1] - a[1],
  );
  if (sortedGoers[0]) {
    topGoerName = sortedGoers[0][0];
    topGoerCount = sortedGoers[0][1];
  }

  const goerTemplate =
    '{userName} не пропускает ни одного сеанса: {count} просмотренных фильмов за период.';
  const goerDesc = goerTemplate
    .replace('{userName}', topGoerName)
    .replace('{count}', String(topGoerCount));

  // 6. Strictest Critic ("Гроза кинематографа")
  const eligibleUsersSet = new Set(
    eligibleParticipants
      .filter((p) => p !== 'all')
      .map((p) => cleanParticipantName(p).toLowerCase()),
  );

  const participantScoresMap = new Map<string, number[]>();
  for (const m of movies) {
    for (const p of m.participantRatings) {
      const name = cleanParticipantName(p.userName);
      if (!name || name.toLowerCase() === 'участники') continue;
      const list = participantScoresMap.get(name) ?? [];
      list.push(p.score);
      participantScoresMap.set(name, list);
    }
  }

  // Filter participants with meaningful participation (prefer eligible participants, then >= 3 films)
  const candidateCritics: Array<{ name: string; avg: number; count: number }> = [];
  for (const [name, scores] of participantScoresMap.entries()) {
    if (eligibleUsersSet.has(name.toLowerCase()) || scores.length >= 3) {
      const avg = safeRound(scores.reduce((a, b) => a + b, 0) / scores.length);
      candidateCritics.push({ name, avg, count: scores.length });
    }
  }

  // If no candidates with >= 3, fall back to any participant
  if (candidateCritics.length === 0) {
    for (const [name, scores] of participantScoresMap.entries()) {
      if (scores.length > 0) {
        const avg = safeRound(scores.reduce((a, b) => a + b, 0) / scores.length);
        candidateCritics.push({ name, avg, count: scores.length });
      }
    }
  }

  candidateCritics.sort((a, b) => a.avg - b.avg);
  const strictest = candidateCritics[0];
  const criticName = strictest ? strictest.name : '—';
  const criticAvg = strictest ? String(strictest.avg) : '—';

  const criticAdjective = agreeAdjective(criticName, 'беспощаден', 'беспощадна');
  const criticTemplate =
    `{userName} ${criticAdjective} к проходному кино: средняя оценка за период составила всего {avgRating}.`;
  const criticDesc = criticTemplate
    .replace('{userName}', criticName)
    .replace('{avgRating}', criticAvg);

  return [
    {
      id: 'unanimous_top',
      title: 'Рождественское перемирие',
      badge: '🕊️',
      nominee: unanimousNominee,
      value: unanimousRating,
      description: unanimousDesc,
      template: unanimousTemplate,
    },
    {
      id: 'most_controversial',
      title: 'Яблоко раздора',
      badge: '⚡',
      nominee: controversialMovie,
      value: controversialSd !== '—' ? `SD: ${controversialSd}` : '—',
      description: controversialDesc,
      template: controversialTemplate,
    },
    {
      id: 'frequent_pair',
      title: 'Неразлучники',
      badge: '👥',
      nominee: pairNominee,
      value: pairCount > 0 ? `${pairCount} фильмов` : '—',
      description: pairDesc,
      template: pairTemplate,
    },
    {
      id: 'top_genre',
      title: 'Жанровый триумф',
      badge: '🎭',
      nominee: topGenreName,
      value: topGenreCount > 0 ? `${topGenreCount} фильмов (вес ${topGenreWeight.toFixed(1)})` : '—',
      description: genreDesc,
      template: genreTemplate,
      details: {
        rawCount: topGenreCount,
        weightedCount: topGenreWeight,
      },
    },
    {
      id: 'top_moviegoer',
      title: 'Главный киноман',
      badge: '🍿',
      nominee: topGoerName,
      value: topGoerCount > 0 ? `${topGoerCount} фильмов` : '—',
      description: goerDesc,
      template: goerTemplate,
    },
    {
      id: 'strictest_critic',
      title: 'Гроза кинематографа',
      badge: '🧐',
      nominee: criticName,
      value: criticAvg,
      description: criticDesc,
      template: criticTemplate,
    },
  ];
}

/* ========================================================================== */
/*                             MAIN FUNCTION                                  */
/* ========================================================================== */

/**
 * Builds comprehensive, UI-independent analytics for the Rewind page.
 * Safely handles any year or 'all', division-by-zero guards on all calculations.
 */
export function buildRewindStats({
  usersRating,
  foundMovies,
  participantNames = [],
  year,
}: BuildRewindStatsParams): RewindStatsResult {
  // 1. Build lookup Map for foundMovies (by excelTitle, title, original_title)
  const foundLookup = new Map<string, NormalizedMovie | Movie>();
  for (const m of foundMovies ?? []) {
    if (!m) continue;
    if (m.excelTitle) {
      foundLookup.set(looseNormalizeTitle(m.excelTitle), m);
      foundLookup.set(normalizeMovieTitle(m.excelTitle), m);
    }
    if (m.title) {
      const loose = looseNormalizeTitle(m.title);
      if (!foundLookup.has(loose)) foundLookup.set(loose, m);
    }
    if (m.original_title) {
      const loose = looseNormalizeTitle(m.original_title);
      if (!foundLookup.has(loose)) foundLookup.set(loose, m);
    }
  }

  // 2. Normalize and merge usersRating with foundMovies
  const allMergedMovies: RewindMovie[] = [];

  for (const item of usersRating ?? []) {
    if (!item?.movie) continue;

    const rawTitle = item.movie.trim();
    if (!rawTitle || rawTitle === '2025' || rawTitle === '2026') continue;

    const found =
      foundLookup.get(looseNormalizeTitle(rawTitle)) ??
      foundLookup.get(normalizeMovieTitle(rawTitle));

    const parsedDate = parseMovieDate(item.date);

    // Parse participant scores
    const participants: RewindParticipantRating[] = [];
    for (const r of item.ratings ?? []) {
      const cleanName = cleanParticipantName(r.userName);
      if (!cleanName || cleanName.toLowerCase() === 'участники') continue;

      const score = parseScore(r.scores?.[0]);
      if (score !== null) {
        participants.push({ userName: cleanName, score });
      }
    }

    // Determine overall rating: from sheet column (ratings[0]?.scores[1]) or participants avg
    let overallRating = 0;
    const rawSheetAvg = item.ratings?.[0]?.scores?.[1];
    const parsedSheetAvg = parseScore(rawSheetAvg);
    if (parsedSheetAvg !== null && parsedSheetAvg > 0) {
      overallRating = parsedSheetAvg;
    } else if (participants.length > 0) {
      const sum = participants.reduce((acc, p) => acc + p.score, 0);
      overallRating = safeRound(sum / participants.length);
    }

    // Extract genres
    const genreNames = extractGenreNames(found?.genres);
    const genres: RewindMovieGenre[] =
      genreNames.length > 0
        ? genreNames.map((name, idx) => ({ id: idx, name }))
        : (found?.genres as RewindMovieGenre[]) ?? [];

    allMergedMovies.push({
      movieTitle: rawTitle,
      excelTitle: rawTitle,
      date: item.date,
      parsedDate: parsedDate ?? undefined,
      overallRating,
      participantRatings: participants,
      tmdbId: found?.id,
      title: found?.title || rawTitle,
      originalTitle: found?.original_title || rawTitle,
      posterPath: found?.poster_path || '',
      backdropPath: found?.backdrop_path || '',
      releaseDate: found?.release_date,
      genres,
      isFound: Boolean(found),
    });
  }

  // 3. Filter movies by selected year
  const isAllYears = year === 'all';
  const targetYearNum = !isAllYears ? parseInt(year, 10) : null;

  const filteredMovies = allMergedMovies.filter((movie) => {
    if (isAllYears) return true;
    if (targetYearNum === null || !Number.isInteger(targetYearNum)) return true;
    return movie.parsedDate?.year === targetYearNum;
  });

  const totalLoadedMovies = filteredMovies.length;

  // 4. Calculate clubSummary
  const moviesWithRating = filteredMovies.filter((m) => m.overallRating > 0);
  const sumClubRating = moviesWithRating.reduce((acc, m) => acc + m.overallRating, 0);
  const avgClubRating =
    moviesWithRating.length > 0 ? safeRound(sumClubRating / moviesWithRating.length) : 0;

  // Top 3 Best (highest overallRating)
  const sortedBestClub = [...filteredMovies]
    .filter((m) => m.overallRating > 0)
    .sort((a, b) => {
      if (b.overallRating !== a.overallRating) return b.overallRating - a.overallRating;
      return b.participantRatings.length - a.participantRatings.length;
    });
  const top3Best: RewindMovieSummary[] = sortedBestClub.slice(0, 3).map((m) => toMovieSummary(m));

  // Top 3 Worst (lowest non-zero overallRating)
  const sortedWorstClub = [...filteredMovies]
    .filter((m) => m.overallRating > 0)
    .sort((a, b) => {
      if (a.overallRating !== b.overallRating) return a.overallRating - b.overallRating;
      return b.participantRatings.length - a.participantRatings.length;
    });
  const top3Worst: RewindMovieSummary[] = sortedWorstClub.slice(0, 3).map((m) => toMovieSummary(m));

  const clubSummary: RewindClubSummary = {
    totalMovies: totalLoadedMovies,
    avgRating: avgClubRating,
    top3Best,
    top3Worst,
  };

  // 5. Eligible participants (>= 10 watched movies in the period)
  const participantWatchCounts = new Map<string, number>();
  const participantScoreSums = new Map<string, number>();

  for (const movie of filteredMovies) {
    for (const p of movie.participantRatings) {
      const name = cleanParticipantName(p.userName);
      if (!name || name.toLowerCase() === 'участники') continue;

      participantWatchCounts.set(name, (participantWatchCounts.get(name) ?? 0) + 1);
      participantScoreSums.set(name, (participantScoreSums.get(name) ?? 0) + p.score);
    }
  }

  // Also include any explicitly passed participantNames if active
  for (const name of participantNames) {
    const clean = cleanParticipantName(name);
    if (clean && !participantWatchCounts.has(clean)) {
      participantWatchCounts.set(clean, 0);
      participantScoreSums.set(clean, 0);
    }
  }

  const allParticipantStats: ParticipantStats[] = [];
  const eligibleNamesList: string[] = [];

  for (const [userName, watchedCount] of participantWatchCounts.entries()) {
    const sum = participantScoreSums.get(userName) ?? 0;
    const avgRating = watchedCount > 0 ? safeRound(sum / watchedCount) : 0;
    allParticipantStats.push({ userName, watchedCount, avgRating });

    if (watchedCount >= MIN_ELIGIBLE_MOVIES_COUNT) {
      eligibleNamesList.push(userName);
    }
  }

  // Sort eligible participants by watchedCount descending
  eligibleNamesList.sort((a, b) => {
    const countA = participantWatchCounts.get(a) ?? 0;
    const countB = participantWatchCounts.get(b) ?? 0;
    return countB - countA;
  });

  // Always prepend 'all' for club-wide profile
  const eligibleParticipants = ['all', ...eligibleNamesList];

  // 6. Top Genres (top 6..8 most frequent genres in the period, sorted by weightedCount)
  const genreFrequency = new Map<string, number>();
  const genreWeightedSum = new Map<string, number>();
  const canonicalGenreName = new Map<string, string>();

  for (const movie of filteredMovies) {
    const movieWeights = getMovieGenreWeights(movie.genres);

    const seenInMovie = new Set<string>();
    for (const g of movie.genres) {
      if (!g.name) continue;
      const trimmed = g.name.trim();
      if (!trimmed) continue;
      const lower = trimmed.toLowerCase();
      if (!canonicalGenreName.has(lower)) {
        canonicalGenreName.set(lower, trimmed);
      }
      if (!seenInMovie.has(lower)) {
        seenInMovie.add(lower);
        genreFrequency.set(lower, (genreFrequency.get(lower) ?? 0) + 1);
      }
    }

    for (const [gName, weight] of movieWeights.entries()) {
      const lower = gName.trim().toLowerCase();
      genreWeightedSum.set(lower, (genreWeightedSum.get(lower) ?? 0) + weight);
    }
  }

  const sortedGenres = Array.from(genreWeightedSum.entries())
    .sort((a, b) => {
      if (Math.abs(b[1] - a[1]) > 0.0001) {
        return b[1] - a[1];
      }
      return (genreFrequency.get(b[0]) ?? 0) - (genreFrequency.get(a[0]) ?? 0);
    })
    .map(([lower]) => canonicalGenreName.get(lower) || lower);

  for (const lower of genreFrequency.keys()) {
    const name = canonicalGenreName.get(lower) || lower;
    if (!sortedGenres.includes(name)) {
      sortedGenres.push(name);
    }
  }

  // Take top 6..8 genres (or all if fewer)
  const topGenreCount = Math.min(8, Math.max(6, sortedGenres.length));
  const topGenres = sortedGenres.slice(0, topGenreCount);

  // 7. Genre Radar profiles
  const profiles: Record<string, UserProfileStats> = {};

  // Pre-calculate profile for 'all' and each eligible participant
  for (const pName of eligibleParticipants) {
    profiles[pName] = buildUserProfileStats(filteredMovies, topGenres, pName);
  }

  const getProfile = (userName: string): UserProfileStats => {
    if (profiles[userName]) {
      return profiles[userName];
    }
    return buildUserProfileStats(filteredMovies, topGenres, userName);
  };

  const genreRadar: GenreRadarStructure = {
    topGenres,
    profiles,
    getProfile,
  };

  // 8. Compatibility Matrix
  // Compare pairs among eligible participants (excluding 'all'); if too few, compare all active
  const candidateUsersForMatrix =
    eligibleNamesList.length >= 2
      ? eligibleNamesList
      : allParticipantStats.filter((p) => p.watchedCount >= 3).map((p) => p.userName);

  const compatibilityMatrix: PairCompatibility[] = [];

  for (let i = 0; i < candidateUsersForMatrix.length; i++) {
    for (let j = i + 1; j < candidateUsersForMatrix.length; j++) {
      const uA = candidateUsersForMatrix[i];
      const uB = candidateUsersForMatrix[j];
      const comparison = compareTwoParticipants(filteredMovies, uA, uB);
      if (comparison.commonMoviesCount > 0) {
        compatibilityMatrix.push(comparison);
      }
    }
  }

  // Sort matrix by commonMoviesCount descending
  compatibilityMatrix.sort((a, b) => b.commonMoviesCount - a.commonMoviesCount);

  const boundCompareTwoParticipants = (userA: string, userB: string): PairCompatibility => {
    return compareTwoParticipants(filteredMovies, userA, userB);
  };

  // 9. Monthly Activity (12 months array)
  const monthlyActivity: MonthlyActivityItem[] = REWIND_MONTH_LABELS.map((label, monthIndex) => {
    const monthNumber = monthIndex + 1;
    const monthMovies = filteredMovies.filter((m) => m.parsedDate?.month === monthNumber);
    const count = monthMovies.length;
    const ratedMonthMovies = monthMovies.filter((m) => m.overallRating > 0);
    const sumRating = ratedMonthMovies.reduce((acc, m) => acc + m.overallRating, 0);
    const avgRating =
      ratedMonthMovies.length > 0 ? safeRound(sumRating / ratedMonthMovies.length) : 0;

    return {
      monthIndex,
      monthNumber,
      label,
      count,
      avgRating,
      movies: monthMovies.map((m) => toMovieSummary(m)),
    };
  });

  // 10. Achievements
  const achievements = buildAchievements(
    filteredMovies,
    eligibleParticipants,
    compatibilityMatrix,
  );

  return {
    year,
    totalLoadedMovies,
    clubSummary,
    eligibleParticipants,
    participantStats: allParticipantStats,
    genreRadar,
    compatibilityMatrix,
    compareTwoParticipants: boundCompareTwoParticipants,
    monthlyActivity,
    achievements,
    movies: filteredMovies,
  };
}

export default buildRewindStats;
