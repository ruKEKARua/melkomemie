import React, { useMemo, useState } from 'react';
import type { MovieRatings } from '../utils/movieDataNormalizer';
import type { NormalizedMovie } from '../api/movieSource';
import type { Movie } from '../store/foundMovies';
import { buildRewindStats, getAvailableRewindYears } from '../utils/rewindStats';
import RewindHeaderControls from '../components/rewind/RewindHeaderControls';
import RewindHeroSection from '../components/rewind/RewindHeroSection';
import RewindClubSummarySection from '../components/rewind/RewindClubSummarySection';
import RewindAchievementsSection from '../components/rewind/RewindAchievementsSection';
import GenreRadarSection from '../components/rewind/GenreRadarSection';
import HeadToHeadSection from '../components/rewind/HeadToHeadSection';
import ClubActivitySection from '../components/rewind/ClubActivitySection';

export interface RewindPageProps {
  usersRating: MovieRatings[];
  foundMovies: Array<NormalizedMovie | Movie>;
  participantNames?: string[];
  onBack: () => void;
}

export const RewindPage: React.FC<RewindPageProps> = ({
  usersRating,
  foundMovies,
  participantNames = [],
  onBack,
}) => {
  // Available years from date field in sheets
  const availableYears = useMemo(() => getAvailableRewindYears(usersRating), [usersRating]);

  // Default to the most recent year available (e.g. 2026), or fallback to 'all'
  const defaultYear = availableYears[0] ?? '2026';
  const [selectedYear, setSelectedYear] = useState<string | 'all'>(defaultYear);

  // Derive effectively active year: if selected year not in list (and not 'all'), use default
  const activeYear = useMemo(() => {
    if (selectedYear === 'all') return 'all';
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      return availableYears[0];
    }
    return selectedYear;
  }, [availableYears, selectedYear]);

  // Calculate rewind stats for the selected period
  const stats = useMemo(
    () =>
      buildRewindStats({
        usersRating,
        foundMovies,
        participantNames,
        year: activeYear,
      }),
    [usersRating, foundMovies, participantNames, activeYear],
  );

  const activeParticipantsCount = useMemo(() => {
    return stats.participantStats.filter((p) => p.watchedCount > 0).length;
  }, [stats.participantStats]);

  return (
    <div className="w-full flex-1 flex flex-col bg-[var(--bg-main)] text-[var(--text-main)] transition-colors animate-fade-in pb-16">
      <div className="max-w-7xl 2xl:max-w-[1600px] min-[1920px]:max-w-[1800px] min-[2560px]:max-w-[2200px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex flex-col gap-6 sm:gap-8">
        {/* Top Header Navigation & Year Controls */}
        <RewindHeaderControls
          availableYears={availableYears}
          selectedYear={activeYear}
          onSelectYear={setSelectedYear}
          onBack={onBack}
        />

        {/* Section 1: Hero Banner */}
        <RewindHeroSection year={activeYear} movies={stats.movies} />

        {/* Section 2: Club Summary & Top 3 Best / Worst */}
        <RewindClubSummarySection
          clubSummary={stats.clubSummary}
          activeParticipantsCount={activeParticipantsCount}
        />

        {/* Section 4: Achievements in Steam Style */}
        <RewindAchievementsSection achievements={stats.achievements} year={activeYear} />

        {/* Section 5: Genre Radar & Personal Tops */}
        <GenreRadarSection
          genreRadar={stats.genreRadar}
          eligibleParticipants={stats.eligibleParticipants}
          participantStats={stats.participantStats}
        />

        {/* Section 6: Head to Head & Compatibility Matrix */}
        <HeadToHeadSection
          eligibleParticipants={stats.eligibleParticipants}
          participantStats={stats.participantStats}
          compareTwoParticipants={stats.compareTwoParticipants}
          compatibilityMatrix={stats.compatibilityMatrix}
        />

        {/* Section 7: Club Monthly Activity */}
        <ClubActivitySection
          monthlyActivity={stats.monthlyActivity}
          year={activeYear}
        />
      </div>
    </div>
  );
};

export default RewindPage;
