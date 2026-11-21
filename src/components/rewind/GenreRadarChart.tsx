import React from 'react';
import type { GenreRadarItem } from '../../utils/rewindStats';

export type RadarMode = 'frequency' | 'rating';

interface GenreRadarChartProps {
  topGenres: string[];
  activeRadar: GenreRadarItem[];
  clubRadar: GenreRadarItem[];
  isParticipantSelected: boolean;
  participantName?: string;
  mode?: RadarMode;
}

export const GenreRadarChart: React.FC<GenreRadarChartProps> = ({
  topGenres,
  activeRadar,
  clubRadar,
  isParticipantSelected,
  participantName,
  mode = 'frequency',
}) => {
  const size = 380;
  const center = size / 2;
  const radius = 115;
  const numAxes = topGenres.length;

  if (numAxes < 3) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-slate-400 dark:text-zinc-500">
        Недостаточно данных по жанрам за выбранный период
      </div>
    );
  }

  // Calculate angles for each genre axis (start at top -PI/2)
  const angles = topGenres.map((_, i) => -Math.PI / 2 + (2 * Math.PI * i) / numAxes);

  // Helper to extract value depending on mode
  const getVal = (item?: GenreRadarItem): number => {
    if (!item) return 0;
    return mode === 'rating' ? item.avgRating : item.weightedPercentage;
  };

  // Determine scaling ceiling across club and active radar
  const allValues = [
    ...activeRadar.map((r) => getVal(r)),
    ...clubRadar.map((r) => getVal(r)),
  ];
  const maxVal = mode === 'rating' ? 10 : Math.max(...allValues, 25);

  const getCoordinates = (value: number, angle: number): [number, number] => {
    // Keep minimum distance 0.05 so zero-values don't collapse into a single point
    const normalized = Math.min(1, Math.max(0.05, value / maxVal));
    const r = radius * normalized;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return [x, y];
  };

  // Club polygon points
  const clubPoints = angles.map((angle, i) => {
    const genre = topGenres[i];
    const item = clubRadar.find((r) => r.genre.toLowerCase() === genre.toLowerCase());
    return getCoordinates(getVal(item), angle);
  });
  const clubPolygonStr = clubPoints.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  // Active participant polygon points
  const activePoints = angles.map((angle, i) => {
    const genre = topGenres[i];
    const item = activeRadar.find((r) => r.genre.toLowerCase() === genre.toLowerCase());
    return getCoordinates(getVal(item), angle);
  });
  const activePolygonStr = activePoints.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  // Grid concentric rings (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="flex flex-col items-center w-full">
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 mb-2 text-xs font-semibold flex-wrap">
        {isParticipantSelected ? (
          <>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1.5 rounded-full bg-amber-500 shadow-xs" />
              <span className="text-slate-900 dark:text-white truncate max-w-[140px]">
                {participantName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-0.5 border-t-2 border-dashed border-slate-400 dark:border-zinc-500" />
              <span className="text-slate-500 dark:text-zinc-400">
                Среднее по клубу
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 rounded-full bg-amber-500 shadow-xs" />
            <span className="text-slate-900 dark:text-white">
              Профиль клуба
            </span>
          </div>
        )}
      </div>

      {/* SVG Chart */}
      <div className="relative w-full max-w-[380px] aspect-square flex items-center justify-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full overflow-visible select-none"
        >
          {/* Background Concentric Grid Polygons */}
          {gridLevels.map((level) => {
            const levelPoints = angles.map((angle) => {
              const r = radius * level;
              const x = center + r * Math.cos(angle);
              const y = center + r * Math.sin(angle);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            });
            return (
              <polygon
                key={level}
                points={levelPoints.join(' ')}
                fill="none"
                className="stroke-slate-200 dark:stroke-white/10"
                strokeWidth={level === 1.0 ? 1.5 : 1}
              />
            );
          })}

          {/* Radial Axis Rays from Center */}
          {angles.map((angle, idx) => {
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            return (
              <line
                key={`axis-${idx}`}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                className="stroke-slate-200 dark:stroke-white/10"
                strokeWidth={1}
              />
            );
          })}

          {/* 1. Club Polygon (Dashed outline if participant selected, solid if club) */}
          {isParticipantSelected ? (
            <polygon
              points={clubPolygonStr}
              fill="rgba(148, 163, 184, 0.12)"
              stroke="rgba(148, 163, 184, 0.75)"
              strokeWidth={2}
              strokeDasharray="4,4"
              className="transition-all duration-300"
            />
          ) : (
            <polygon
              points={clubPolygonStr}
              fill="rgba(245, 158, 11, 0.22)"
              stroke="#f59e0b"
              strokeWidth={2.5}
              className="transition-all duration-300"
            />
          )}

          {/* 2. Active Participant Polygon (if participant selected) */}
          {isParticipantSelected && (
            <polygon
              points={activePolygonStr}
              fill="rgba(245, 158, 11, 0.3)"
              stroke="#f59e0b"
              strokeWidth={2.5}
              className="transition-all duration-300"
            />
          )}

          {/* Active Points Vertices */}
          {activePoints.map(([x, y], idx) => {
            const genre = topGenres[idx];
            const item = activeRadar.find(
              (r) => r.genre.toLowerCase() === genre.toLowerCase(),
            );
            const tooltip = item
              ? `${genre}: ${item.count} фильмов (вес ${item.weightedCount.toFixed(1)}) • ср. ${item.avgRating > 0 ? item.avgRating.toFixed(1) : '—'}`
              : genre;

            return (
              <circle
                key={`vertex-${idx}`}
                cx={x}
                cy={y}
                r={4}
                fill="#f59e0b"
                className="stroke-white dark:stroke-[#131620] shadow-sm transition-all duration-300 cursor-pointer"
                strokeWidth={2}
              >
                <title>{tooltip}</title>
              </circle>
            );
          })}

          {/* Genre Labels around the Chart Perimeter */}
          {angles.map((angle, idx) => {
            const genre = topGenres[idx];
            // Label offset outside the outer radius
            const labelDist = radius + 24;
            const x = center + labelDist * Math.cos(angle);
            const y = center + labelDist * Math.sin(angle);

            // Determine text anchor based on angle
            const cos = Math.cos(angle);
            let textAnchor: 'start' | 'middle' | 'end' = 'middle';
            if (cos > 0.3) textAnchor = 'start';
            else if (cos < -0.3) textAnchor = 'end';

            const activeItem = activeRadar.find(
              (r) => r.genre.toLowerCase() === genre.toLowerCase(),
            );
            const labelValue =
              mode === 'rating'
                ? activeItem && activeItem.avgRating > 0
                  ? `★ ${activeItem.avgRating.toFixed(1)}`
                  : '—'
                : `${activeItem?.weightedPercentage ?? 0}%`;

            const fullTooltip = activeItem
              ? `${genre}: ${activeItem.count} фильмов (вес ${activeItem.weightedCount.toFixed(1)}) • ср. ${activeItem.avgRating > 0 ? activeItem.avgRating.toFixed(1) : '—'}`
              : genre;

            return (
              <g key={`label-${idx}`} className="transition-all duration-200 cursor-pointer">
                <title>{fullTooltip}</title>
                <text
                  x={x}
                  y={y - 5}
                  textAnchor={textAnchor}
                  dominantBaseline="central"
                  className="fill-slate-800 dark:fill-zinc-200 text-[11px] sm:text-xs font-bold"
                >
                  {genre}
                </text>
                <text
                  x={x}
                  y={y + 8}
                  textAnchor={textAnchor}
                  dominantBaseline="central"
                  className="fill-slate-400 dark:fill-zinc-500 text-[9px] sm:text-[10px] font-semibold"
                >
                  {labelValue}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default GenreRadarChart;
