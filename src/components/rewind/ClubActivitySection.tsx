import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Chart,
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  type ChartConfiguration,
  type ChartDataset,
} from 'chart.js';
import type { MonthlyActivityItem } from '../../utils/rewindStats';
import { getMovieImageUrl } from '../../api/tmdbImage';
import { getRatingBadgeColor } from '../../utils/ratings';

// Register required Chart.js controllers, scales and plugins
Chart.register(
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

interface ClubActivitySectionProps {
  monthlyActivity: MonthlyActivityItem[];
  year: string | 'all';
}

const SHORT_MONTH_NAMES = [
  'Янв',
  'Фев',
  'Мар',
  'Апр',
  'Май',
  'Июн',
  'Июл',
  'Авг',
  'Сен',
  'Окт',
  'Ноя',
  'Дек',
];

/** Build per-bar fill and border colors highlighting the selected month. */
function getBarColors(count: number, selectedIndex: number | null) {
  const backgroundColor: string[] = [];
  const borderColor: string[] = [];

  for (let idx = 0; idx < count; idx++) {
    const isSelected = selectedIndex === idx;
    backgroundColor.push(
      isSelected ? 'rgba(245, 158, 11, 0.75)' : 'rgba(99, 102, 241, 0.55)',
    );
    borderColor.push(isSelected ? '#f59e0b' : 'rgb(99, 102, 241)');
  }

  return { backgroundColor, borderColor };
}

/** Return theme-dependent chart colors for light and dark modes. */
function getThemePalette(isDark: boolean) {
  return {
    gridColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
    textColor: isDark ? '#94a3b8' : '#64748b',
    legendColor: isDark ? '#f1f5f9' : '#0f172a',
    pointBorderColor: isDark ? '#131620' : '#ffffff',
    tooltipBg: isDark ? '#131620' : '#ffffff',
    tooltipTitle: isDark ? '#f1f5f9' : '#0f172a',
    tooltipBody: isDark ? '#cbd5e1' : '#334155',
    tooltipBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.12)',
  };
}

export const ClubActivitySection: React.FC<ClubActivitySectionProps> = ({
  monthlyActivity,
  year,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const latestCallbacksRef = useRef<{
    monthlyActivity: MonthlyActivityItem[];
    year: string | 'all';
    toggleMonth: (idx: number) => void;
  } | null>(null);
  const prevChartStateRef = useRef<{
    monthlyActivity: MonthlyActivityItem[];
    isDark: boolean;
    year: string | 'all';
    selectedMonthIndex: number | null;
  } | null>(null);

  // Selected month state paired with year to automatically reset on year change without effect cascades
  const [selectedMonthState, setSelectedMonthState] = useState<{
    year: string | 'all';
    monthIndex: number | null;
  }>({ year, monthIndex: null });

  const selectedMonthIndex =
    selectedMonthState.year === year ? selectedMonthState.monthIndex : null;

  const toggleMonth = useCallback((idx: number) => {
    setSelectedMonthState((prev) => ({
      year,
      monthIndex: prev.year === year && prev.monthIndex === idx ? null : idx,
    }));
  }, [year]);

  // Track light/dark theme to dynamically style chart axes, grid lines, and labels
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Calculate total movies in the period
  const totalMoviesYear = useMemo(() => {
    return monthlyActivity.reduce((acc, m) => acc + m.count, 0);
  }, [monthlyActivity]);

  // Calculate longest streak of consecutive active months (count > 0)
  const longestStreak = useMemo(() => {
    let maxStreak = 0;
    let currentStreak = 0;
    for (const m of monthlyActivity) {
      if (m.count > 0) {
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
      } else {
        currentStreak = 0;
      }
    }
    return maxStreak;
  }, [monthlyActivity]);

  // Active month data if a month is expanded
  const activeMonth = selectedMonthIndex !== null ? monthlyActivity[selectedMonthIndex] : null;
  const yearLabel = year === 'all' ? 'всех сезонов' : `${year} года`;

  // Destroy Chart.js instance only on unmount so selecting a bar never re-creates or re-animates the chart
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      prevChartStateRef.current = null;
    };
  }, []);

  // Initialize Chart.js instance once and update changed datasets, selection colors, or theme in-place
  useEffect(() => {
    latestCallbacksRef.current = { monthlyActivity, year, toggleMonth };

    const canvas = canvasRef.current;
    if (!canvas) return;

    const palette = getThemePalette(isDark);
    const countsData = monthlyActivity.map((m) => m.count);
    const ratingsData = monthlyActivity.map((m) =>
      m.count > 0 && m.avgRating > 0 ? m.avgRating : null,
    );
    const { backgroundColor, borderColor } = getBarColors(
      countsData.length,
      selectedMonthIndex,
    );

    const existingChart = chartInstanceRef.current;

    if (!existingChart) {
      const config: ChartConfiguration = {
        type: 'bar',
        data: {
          labels: SHORT_MONTH_NAMES,
          datasets: [
            // Dataset 1: Number of movies (Bar chart, Y axis left)
            {
              type: 'bar',
              label: 'Просмотров',
              data: countsData,
              backgroundColor,
              borderColor,
              borderWidth: 1,
              borderRadius: 6,
              yAxisID: 'y',
              order: 2,
            },
            // Dataset 2: Average rating (Line chart, Y1 axis right)
            {
              type: 'line',
              label: 'Средняя оценка',
              data: ratingsData,
              borderColor: '#f59e0b',
              backgroundColor: '#f59e0b',
              pointBackgroundColor: '#f59e0b',
              pointBorderColor: palette.pointBorderColor,
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
              borderWidth: 2.5,
              tension: 0.35,
              spanGaps: true,
              yAxisID: 'y1',
              order: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          onClick: (_event, elements) => {
            if (elements && elements.length > 0) {
              const dataIndex = elements[0].index;
              if (typeof dataIndex === 'number') {
                latestCallbacksRef.current?.toggleMonth(dataIndex);
              }
            }
          },
          onHover: (event, chartElement) => {
            const target = event.native?.target as HTMLElement | undefined;
            if (target) {
              target.style.cursor = chartElement.length > 0 ? 'pointer' : 'default';
            }
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              align: 'end',
              labels: {
                color: palette.legendColor,
                font: {
                  size: 12,
                  weight: 600,
                },
                boxWidth: 14,
                boxHeight: 8,
                useBorderRadius: true,
                borderRadius: 3,
              },
            },
            tooltip: {
              backgroundColor: palette.tooltipBg,
              titleColor: palette.tooltipTitle,
              bodyColor: palette.tooltipBody,
              borderColor: palette.tooltipBorder,
              borderWidth: 1,
              padding: 10,
              boxPadding: 4,
              usePointStyle: true,
              callbacks: {
                title: (tooltipItems) => {
                  const idx = tooltipItems[0]?.dataIndex ?? 0;
                  const latest = latestCallbacksRef.current;
                  const currentActivity = latest?.monthlyActivity ?? monthlyActivity;
                  const currentYear = latest?.year ?? year;
                  const monthItem = currentActivity[idx];
                  return `${monthItem?.label || SHORT_MONTH_NAMES[idx]} ${
                    currentYear === 'all' ? '' : currentYear
                  }`;
                },
                label: (context) => {
                  if (context.datasetIndex === 0) {
                    const count = context.parsed.y ?? 0;
                    return ` Просмотров: ${count} ${
                      count === 1 ? 'фильм' : count < 5 ? 'фильма' : 'фильмов'
                    }`;
                  }
                  if (context.datasetIndex === 1) {
                    const rating = context.parsed.y;
                    return rating !== null && rating !== undefined
                      ? ` Средняя оценка: ★ ${rating.toFixed(2)}`
                      : ' Средняя оценка: нет данных';
                  }
                  return '';
                },
              },
            },
          },
          scales: {
            x: {
              grid: {
                display: false,
              },
              ticks: {
                color: palette.textColor,
                font: {
                  size: 11,
                  weight: 600,
                },
              },
            },
            // Left Y Axis (Movie counts)
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                color: palette.textColor,
                font: {
                  size: 11,
                  weight: 600,
                },
                precision: 0,
              },
              grid: {
                color: palette.gridColor,
              },
            },
            // Right Y1 Axis (Average rating)
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              min: 3,
              max: 10,
              ticks: {
                stepSize: 1,
                color: '#f59e0b',
                font: {
                  size: 11,
                  weight: 700,
                },
                callback: (val) => `★ ${val}`,
              },
              grid: {
                display: false,
              },
            },
          },
        },
      };

      chartInstanceRef.current = new Chart(canvas, config);
      prevChartStateRef.current = {
        monthlyActivity,
        isDark,
        year,
        selectedMonthIndex,
      };
      return;
    }

    const prev = prevChartStateRef.current;
    const dataChanged =
      !prev || prev.monthlyActivity !== monthlyActivity || prev.year !== year;
    const themeChanged = !prev || prev.isDark !== isDark;
    const selectionChanged =
      !prev || prev.selectedMonthIndex !== selectedMonthIndex;

    if (dataChanged) {
      existingChart.data.datasets[0].data = countsData;
      existingChart.data.datasets[1].data = ratingsData;
    }

    if (dataChanged || selectionChanged) {
      existingChart.data.datasets[0].backgroundColor = backgroundColor;
      existingChart.data.datasets[0].borderColor = borderColor;
    }

    if (themeChanged) {
      const lineDataset = existingChart.data.datasets[1] as ChartDataset<
        'line',
        (number | null)[]
      >;
      lineDataset.pointBorderColor = palette.pointBorderColor;

      const { plugins, scales } = existingChart.options;
      if (plugins?.legend?.labels) {
        plugins.legend.labels.color = palette.legendColor;
      }
      if (plugins?.tooltip) {
        plugins.tooltip.backgroundColor = palette.tooltipBg;
        plugins.tooltip.titleColor = palette.tooltipTitle;
        plugins.tooltip.bodyColor = palette.tooltipBody;
        plugins.tooltip.borderColor = palette.tooltipBorder;
      }
      if (scales?.x?.ticks) {
        scales.x.ticks.color = palette.textColor;
      }
      if (scales?.y?.ticks) {
        scales.y.ticks.color = palette.textColor;
      }
      if (scales?.y?.grid) {
        scales.y.grid.color = palette.gridColor;
      }
    }

    prevChartStateRef.current = {
      monthlyActivity,
      isDark,
      year,
      selectedMonthIndex,
    };

    if (dataChanged) {
      existingChart.update();
    } else if (themeChanged || selectionChanged) {
      existingChart.update('none');
    }
  }, [monthlyActivity, isDark, year, selectedMonthIndex, toggleMonth]);

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131620] p-5 sm:p-7 md:p-8 shadow-sm transition-colors">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-white/5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 mb-2">
            <span>📈</span>
            <span>Сезонная динамика</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Общая активность киноклуба по месяцам
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Сколько фильмов смотрел клуб в каждый месяц и какого они были качества. Нажмите на столбец
            или точку графика, чтобы раскрыть список картин.
          </p>
        </div>

        {/* Right Header Badges: Streak & Total */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0">
          {/* Longest Active Streak Badge */}
          {longestStreak > 0 && (
            <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-xs font-extrabold text-amber-600 dark:text-amber-400 shadow-xs">
              <span className="text-base">🔥</span>
              <span>
                Серия активности: <strong className="tabular-nums">{longestStreak} мес. подряд</strong>
              </span>
            </div>
          )}

          {/* Total Year Count Pill */}
          <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-2.5">
            <span className="text-xl">🎬</span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Всего за период
              </div>
              <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white tabular-nums">
                {totalMoviesYear} фильмов
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Viewport */}
      <div className="pt-6 pb-2">
        <div className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl p-3 sm:p-5">
          <div className="relative h-72 w-full">
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>

      {/* Hint when no month is expanded */}
      {selectedMonthIndex === null && (
        <div className="text-center text-[11px] sm:text-xs text-slate-400 dark:text-zinc-500 pt-2 pb-1">
          💡 Нажмите на столбец месяца или точку на графике, чтобы раскрыть список фильмов
        </div>
      )}

      {/* Selected Month Detail Card & Movie List */}
      {activeMonth && (
        <div className="mt-4 p-5 sm:p-6 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 transition-all">
          {/* Detail Header */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-xl shrink-0">
                📅
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {activeMonth.label} {yearLabel}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {activeMonth.count}{' '}
                  {activeMonth.count === 1
                    ? 'фильм'
                    : activeMonth.count < 5
                      ? 'фильма'
                      : 'фильмов'}{' '}
                  • Средняя оценка месяца:{' '}
                  <strong className="text-amber-500 font-extrabold">
                    ★ {activeMonth.avgRating > 0 ? activeMonth.avgRating.toFixed(2) : '—'}
                  </strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedMonthState({ year, monthIndex: null })}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
            >
              ✕ Свернуть
            </button>
          </div>

          {/* Movies Grid for Selected Month */}
          <div className="pt-4">
            {activeMonth.movies.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {activeMonth.movies.map((movie, idx) => {
                  const posterUrl = movie.posterPath ? getMovieImageUrl(movie.posterPath, 'w185') : '';
                  const ratingBadge = getRatingBadgeColor(movie.rating);

                  return (
                    <div
                      key={`${movie.movieTitle}-${idx}`}
                      className="p-2.5 rounded-lg bg-white dark:bg-[#181b28] border border-slate-200/80 dark:border-white/5 hover:border-amber-500/40 transition-all flex items-center gap-3 group"
                    >
                      {/* Poster */}
                      <div className="w-10 aspect-[2/3] rounded overflow-hidden bg-slate-200 dark:bg-zinc-800 shrink-0 border border-black/10 dark:border-white/10 group-hover:scale-105 transition-transform">
                        {posterUrl ? (
                          <img
                            src={posterUrl}
                            alt={movie.movieTitle}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs">
                            🎬
                          </div>
                        )}
                      </div>

                      {/* Movie Info */}
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors"
                          title={movie.movieTitle}
                        >
                          {movie.movieTitle}
                        </div>

                        {movie.genres.length > 0 && (
                          <div className="text-[10px] text-slate-400 dark:text-zinc-500 truncate mt-0.5">
                            {movie.genres.slice(0, 2).join(', ')}
                          </div>
                        )}

                        {movie.date && (
                          <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                            {movie.date}
                          </div>
                        )}
                      </div>

                      {/* Score */}
                      <div
                        className={`px-2 py-0.5 rounded text-xs font-extrabold border shrink-0 tabular-nums ${ratingBadge}`}
                      >
                        ★ {movie.rating > 0 ? movie.rating.toFixed(1) : '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs sm:text-sm text-slate-400 dark:text-zinc-500">
                В этом месяце кинопоказов не проводилось. Выберите другой месяц на графике выше.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default ClubActivitySection;
