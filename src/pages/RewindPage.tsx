import React, { useMemo, useState, useEffect } from 'react';
import type { MovieRatings } from '../utils/movieDataNormalizer';
import type { NormalizedMovie } from '../api/movieSource';
import type { Movie } from '../store/foundMovies';
import { buildRewindStats, getAvailableRewindYears } from '../utils/rewindStats';
import RewindHeaderControls from '../components/rewind/RewindHeaderControls';
import RewindHeroSection from '../components/rewind/RewindHeroSection';
import RewindAboutSection from '../components/rewind/RewindAboutSection';
import RewindClubSummarySection from '../components/rewind/RewindClubSummarySection';
import RewindAchievementsSection from '../components/rewind/RewindAchievementsSection';

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

  // Sync selected year if availableYears changes and selectedYear is not 'all'
  useEffect(() => {
    if (selectedYear !== 'all' && availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // Calculate rewind stats for the selected period
  const stats = useMemo(
    () =>
      buildRewindStats({
        usersRating,
        foundMovies,
        participantNames,
        year: selectedYear,
      }),
    [usersRating, foundMovies, participantNames, selectedYear],
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
          selectedYear={selectedYear}
          onSelectYear={setSelectedYear}
          onBack={onBack}
        />

        {/* Section 1: Hero Banner */}
        <RewindHeroSection year={selectedYear} movies={stats.movies} />

        {/* Section 2: About Melkomemie Community */}
        <RewindAboutSection
          totalClubMovies={usersRating.length}
          totalParticipants={participantNames.length}
        />

        {/* Section 3: Club Summary & Top 3 Best / Worst */}
        <RewindClubSummarySection
          clubSummary={stats.clubSummary}
          activeParticipantsCount={activeParticipantsCount}
        />

        {/* Section 4: Achievements in Steam Style */}
        <RewindAchievementsSection achievements={stats.achievements} year={selectedYear} />
      </div>
    </div>
  );
};

export default RewindPage;
