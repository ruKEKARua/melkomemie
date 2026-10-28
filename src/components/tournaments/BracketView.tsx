import { useCallback, useEffect, useRef, useState } from 'react';
import type { BracketRound, BracketMatch } from '../../types/tournament';
import { useTheme } from '../../utils/theme';

interface BracketViewProps {
  upperRounds: BracketRound[];
  lowerRounds: BracketRound[];
  grandFinal: BracketMatch;
  champion: string;
  selectedPlayer: string | null;
  onSelectPlayer: (player: string | null) => void;
  onOpenReplay?: (match: {
    id: string;
    title: string;
    player1: string;
    score1: number | null;
    player2: string;
    score2: number | null;
    winner: string | null;
    stageName: string;
    replay?: BracketMatch['replay'];
  }) => void;
}

interface ForkDef {
  type: 'fork';
  topFrom: string;
  bottomFrom: string;
  to: string;
  isHighlighted?: boolean;
}

interface SingleDef {
  type: 'single';
  from: string;
  to: string;
  isHighlighted?: boolean;
  color?: string;
}

type BracketConn = ForkDef | SingleDef;

interface RenderedPath {
  id: string;
  d: string;
  color: string;
  hasArrow: boolean;
  markerId?: string;
  isHighlighted: boolean;
}

interface BracketConnectorsProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  connections: BracketConn[];
  theme: 'blue' | 'purple';
  isDark: boolean;
}

const getDividerY = (cardElement: HTMLElement, containerRect: DOMRect): number => {
  const divider = cardElement.querySelector<HTMLElement>('[data-bracket-divider="true"]');
  if (divider) {
    const r = divider.getBoundingClientRect();
    return r.top + r.height * 0.5 - containerRect.top;
  }
  const byeRow = cardElement.querySelector<HTMLElement>('[data-bracket-bye="true"]');
  if (byeRow) {
    const r = byeRow.getBoundingClientRect();
    return r.top + r.height * 0.5 - containerRect.top;
  }
  const cardRect = cardElement.getBoundingClientRect();
  return cardRect.top + cardRect.height * 0.5 - containerRect.top;
};

const BracketConnectors = ({
  containerRef,
  connections,
  theme,
  isDark,
}: BracketConnectorsProps) => {
  const [paths, setPaths] = useState<RenderedPath[]>([]);
  const [markers, setMarkers] = useState<Array<{ id: string; color: string }>>([]);

  const updatePaths = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const newPaths: RenderedPath[] = [];
    const newMarkers: Array<{ id: string; color: string }> = [];

    const solidBlue = isDark ? '#60a5fa' : '#2563eb';
    const solidPurple = isDark ? '#c084fc' : '#9333ea';
    const solidGold = isDark ? '#fbbf24' : '#d97706';
    const defaultSolidColor = theme === 'blue' ? solidBlue : solidPurple;

    const defaultColor = defaultSolidColor;
    const goldColor = solidGold;

    connections.forEach((conn, index) => {
      const isHighlighted = !!conn.isHighlighted;
      const lineColor = isHighlighted
        ? goldColor
        : 'color' in conn && conn.color
        ? conn.color
        : defaultColor;

      const solidMarkerColor = isHighlighted
        ? solidGold
        : 'color' in conn && conn.color
        ? conn.color
        : defaultSolidColor;

      const markerId = `arrow-${theme}-${isHighlighted ? 'gold' : isDark ? 'dark' : 'light'}-${index}`;
      newMarkers.push({ id: markerId, color: solidMarkerColor });

      if (conn.type === 'fork') {
        const topEl = document.getElementById(conn.topFrom);
        const bottomEl = document.getElementById(conn.bottomFrom);
        const toEl = document.getElementById(conn.to);
        if (!topEl || !bottomEl || !toEl) return;

        const topRect = topEl.getBoundingClientRect();
        const bottomRect = bottomEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        if (toRect.left <= topRect.left) return;

        const x1_top = topRect.right - containerRect.left;
        const x1_bottom = bottomRect.right - containerRect.left;
        const x1 = Math.max(x1_top, x1_bottom);

        // Subpixel vertical centers of participant dividing lines
        const y_top = getDividerY(topEl, containerRect);
        const y_bottom = getDividerY(bottomEl, containerRect);
        const y_target = getDividerY(toEl, containerRect);

        const x_target = toRect.left - containerRect.left;
        const totalDx = x_target - x1;
        // Junction point where top and bottom branches merge into single stem
        const x_junction = x1 + totalDx * 0.52;
        const arrowMargin = 8;
        const x_end = x_target - arrowMargin;
        const cdx = (x_junction - x1) * 0.5;

        // 1. Top branch curving down to junction
        const dTop = `M ${x1_top} ${y_top} C ${x1_top + cdx} ${y_top}, ${x_junction - cdx} ${y_target}, ${x_junction} ${y_target}`;
        newPaths.push({
          id: `${conn.topFrom}->${conn.to}-top`,
          d: dTop,
          color: lineColor,
          hasArrow: false,
          isHighlighted,
        });

        // 2. Bottom branch curving up to junction
        const dBottom = `M ${x1_bottom} ${y_bottom} C ${x1_bottom + cdx} ${y_bottom}, ${x_junction - cdx} ${y_target}, ${x_junction} ${y_target}`;
        newPaths.push({
          id: `${conn.bottomFrom}->${conn.to}-bottom`,
          d: dBottom,
          color: lineColor,
          hasArrow: false,
          isHighlighted,
        });

        // 3. Single merged stem pointing right at participant divider line with arrowhead
        const dStem = `M ${x_junction} ${y_target} L ${x_end} ${y_target}`;
        newPaths.push({
          id: `${conn.topFrom}_${conn.bottomFrom}->${conn.to}-stem`,
          d: dStem,
          color: lineColor,
          hasArrow: true,
          markerId,
          isHighlighted,
        });
      } else {
        // Single connection
        const fromEl = document.getElementById(conn.from);
        const toEl = document.getElementById(conn.to);
        if (!fromEl || !toEl) return;

        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        if (toRect.left <= fromRect.left) return;

        const x1 = fromRect.right - containerRect.left;
        const y1 = getDividerY(fromEl, containerRect);

        const x_target = toRect.left - containerRect.left;
        const y_target = getDividerY(toEl, containerRect);
        const arrowMargin = 8;
        const x_end = x_target - arrowMargin;

        const isLevel = Math.abs(y1 - y_target) < 3;
        const y_level = isLevel ? y_target : y1;
        const d = isLevel
          ? `M ${x1} ${y_level} L ${x_end} ${y_level}`
          : `M ${x1} ${y1} C ${x1 + (x_end - x1) * 0.5} ${y1}, ${x_end - (x_end - x1) * 0.5} ${y_target}, ${x_end} ${y_target}`;

        newPaths.push({
          id: `${conn.from}->${conn.to}`,
          d,
          color: lineColor,
          hasArrow: true,
          markerId,
          isHighlighted,
        });
      }
    });

    setPaths(newPaths);
    setMarkers(newMarkers);
  }, [containerRef, connections, theme, isDark]);

  useEffect(() => {
    const rafId = requestAnimationFrame(updatePaths);
    const timer = setTimeout(updatePaths, 120);

    const container = containerRef.current;
    let observer: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        updatePaths();
      });
      observer.observe(container);
    }

    window.addEventListener('resize', updatePaths);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updatePaths);
    };
  }, [updatePaths, containerRef]);

  if (paths.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none w-full h-full z-0 overflow-visible"
      aria-hidden="true"
    >
      <defs>
        {markers.map((m) => (
          <marker
            key={m.id}
            id={m.id}
            viewBox="0 0 10 10"
            refX="0.5"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
            style={{ opacity: 1 }}
          >
            <path
              d="M 0 1.5 L 9 5 L 0 8.5 Z"
              fill={m.color}
              fillOpacity="1"
              stroke="none"
              style={{ opacity: 1, fillOpacity: 1 }}
            />
          </marker>
        ))}
      </defs>

      {paths.map((p) => (
        <path
          key={p.id}
          d={p.d}
          fill="none"
          stroke={p.color}
          strokeWidth={p.isHighlighted ? 2.5 : 2}
          strokeOpacity={p.isHighlighted ? 1 : isDark ? 0.8 : 0.85}
          strokeLinecap="round"
          markerEnd={p.hasArrow && p.markerId ? `url(#${p.markerId})` : undefined}
          className="transition-colors duration-200"
          style={
            p.isHighlighted
              ? { filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.6))' }
              : isDark
              ? { filter: `drop-shadow(0 0 2px ${p.color}35)` }
              : undefined
          }
        />
      ))}
    </svg>
  );
};

export const BracketView = ({
  upperRounds,
  lowerRounds,
  grandFinal,
  champion,
  selectedPlayer,
  onSelectPlayer,
}: BracketViewProps) => {
  const { isDark } = useTheme();
  const upperContainerRef = useRef<HTMLDivElement>(null);
  const lowerContainerRef = useRef<HTMLDivElement>(null);

  // Upper bracket match fork and single connector mappings
  const upperConnections: BracketConn[] = [
    // 1. Посев 1 + В1 merge into В4
    {
      type: 'fork',
      topFrom: 'bracket-match-Посев 1. Проход',
      bottomFrom: 'bracket-match-В1',
      to: 'bracket-match-В4',
      isHighlighted: selectedPlayer ? ['лина', 'монета'].includes(selectedPlayer.toLowerCase()) : false,
    },
    // 2. В2 + В3 merge into В5
    {
      type: 'fork',
      topFrom: 'bracket-match-В2',
      bottomFrom: 'bracket-match-В3',
      to: 'bracket-match-В5',
      isHighlighted: selectedPlayer ? ['иван', 'тлен'].includes(selectedPlayer.toLowerCase()) : false,
    },
    // 3. В4 + В5 merge into В6
    {
      type: 'fork',
      topFrom: 'bracket-match-В4',
      bottomFrom: 'bracket-match-В5',
      to: 'bracket-match-В6',
      isHighlighted: selectedPlayer ? ['лина', 'тлен'].includes(selectedPlayer.toLowerCase()) : false,
    },
    // 4. В6 straight horizontal arrow into Grand Final (Ф)
    {
      type: 'single',
      from: 'bracket-match-В6',
      to: 'bracket-match-Ф',
      color: isDark ? '#fbbf24' : '#d97706',
      isHighlighted: selectedPlayer ? ['тлен'].includes(selectedPlayer.toLowerCase()) : false,
    },
  ];

  // Lower bracket match fork and single connector mappings
  const lowerConnections: BracketConn[] = [
    // 1. Проход в Н2 -> Н2
    {
      type: 'single',
      from: 'bracket-match-Проход в Н2',
      to: 'bracket-match-Н2',
      isHighlighted: selectedPlayer ? ['лысый'].includes(selectedPlayer.toLowerCase()) : false,
    },
    // 2. Н1 -> Н3
    {
      type: 'single',
      from: 'bracket-match-Н1',
      to: 'bracket-match-Н3',
      isHighlighted: selectedPlayer ? ['катя'].includes(selectedPlayer.toLowerCase()) : false,
    },
    // 3. Н2 + Н3 merge into Н4
    {
      type: 'fork',
      topFrom: 'bracket-match-Н2',
      bottomFrom: 'bracket-match-Н3',
      to: 'bracket-match-Н4',
      isHighlighted: selectedPlayer ? ['иван', 'монета'].includes(selectedPlayer.toLowerCase()) : false,
    },
    // 4. Н4 straight horizontal arrow into Н5 (Финал нижней)
    {
      type: 'single',
      from: 'bracket-match-Н4',
      to: 'bracket-match-Н5',
      isHighlighted: selectedPlayer ? ['иван'].includes(selectedPlayer.toLowerCase()) : false,
    },
  ];

  // Renders a single compact tournament match card (fixed compact width, no hover scale to avoid scrollbars)
  const renderMatchCard = (m: BracketMatch, theme: 'blue' | 'purple' | 'gold') => {
    const isPlayer1Selected = selectedPlayer && m.player1.toLowerCase() === selectedPlayer.toLowerCase();
    const isPlayer2Selected = selectedPlayer && m.player2.toLowerCase() === selectedPlayer.toLowerCase();
    const isMatchHighlighted = isPlayer1Selected || isPlayer2Selected;

    let headerBg = 'bg-blue-100 dark:bg-[#1b253b] text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-500/20';
    let cardBorder = 'border-slate-200 dark:border-blue-500/20';
    if (theme === 'purple') {
      headerBg = 'bg-purple-100 dark:bg-[#2b1b3d] text-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-500/20';
      cardBorder = 'border-slate-200 dark:border-purple-500/20';
    } else if (theme === 'gold') {
      headerBg = 'bg-gradient-to-r from-amber-500/20 via-amber-400/25 to-amber-500/20 dark:from-amber-600/30 dark:via-amber-500/30 dark:to-amber-600/30 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-500/40';
      cardBorder = 'border-amber-400/60 dark:border-amber-500/40 shadow-md shadow-amber-500/10';
    }

    if (isMatchHighlighted) {
      cardBorder = 'border-amber-500 ring-2 ring-amber-400/30 shadow-md shadow-amber-500/20';
    }

    return (
      <div
        key={m.id}
        id={`bracket-match-${m.id}`}
        className={`relative z-10 w-full max-w-[240px] sm:max-w-[250px] mx-auto rounded-xl bg-white dark:bg-[#0f121d] border ${cardBorder} overflow-hidden shadow-xs dark:shadow-md transition-colors duration-150 hover:border-amber-400/70 flex flex-col`}
      >
        {/* Match Header with Match ID */}
        <div className={`px-3 py-1.5 ${headerBg} border-b flex items-center justify-between text-xs font-bold`}>
          <span className="truncate pr-1 font-mono tracking-tight text-[11px] sm:text-xs">
            {m.label}
          </span>
        </div>

        {/* Players & Scores List */}
        <div className="text-xs">
          {/* Player 1 */}
          <div
            {...(m.isBye ? { 'data-bracket-bye': 'true' } : {})}
            onClick={() => onSelectPlayer(selectedPlayer === m.player1 ? null : m.player1)}
            className={`px-3 ${
              m.isBye ? 'py-3.5 sm:py-4 min-h-[70px] sm:min-h-[76px]' : 'py-2 min-h-[34px] sm:min-h-[38px]'
            } flex items-center justify-between cursor-pointer transition-colors ${
              isPlayer1Selected
                ? 'bg-amber-500/15 dark:bg-amber-500/20'
                : m.winner === m.player1
                ? 'bg-slate-50/70 dark:bg-white/[0.03]'
                : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {m.winner === m.player1 && <span className="text-amber-500 dark:text-amber-400 text-sm">👑</span>}
              <span
                className={`font-semibold truncate text-xs sm:text-[13px] ${
                  m.winner === m.player1
                    ? 'text-slate-900 dark:text-white font-extrabold'
                    : 'text-slate-600 dark:text-zinc-400'
                } ${isPlayer1Selected ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}`}
              >
                {m.player1}
              </span>
            </div>

            {m.score1 !== null ? (
              <span className="shrink-0 px-2.5 py-0.5 rounded font-mono font-black text-xs bg-amber-100 dark:bg-[#fef3c7] text-amber-900 dark:text-[#78350f] border border-amber-300">
                {m.score1}
              </span>
            ) : m.isBye ? (
              <span className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/25">
                Проход
              </span>
            ) : (
              <span className="text-slate-400 dark:text-zinc-600 font-mono">—</span>
            )}
          </div>

          {/* Divider between Player 1 and Player 2 */}
          {!m.isBye && (
            <div
              data-bracket-divider="true"
              className="h-[1px] w-full bg-slate-100 dark:bg-white/5"
            />
          )}

          {/* Player 2 (or Bye info) */}
          {!m.isBye && (
            <div
              onClick={() => onSelectPlayer(selectedPlayer === m.player2 ? null : m.player2)}
              className={`px-3 py-2 min-h-[34px] sm:min-h-[38px] flex items-center justify-between cursor-pointer transition-colors ${
                isPlayer2Selected
                  ? 'bg-amber-500/15 dark:bg-amber-500/20'
                  : m.winner === m.player2
                  ? 'bg-slate-50/70 dark:bg-white/[0.03]'
                  : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {m.winner === m.player2 && <span className="text-amber-500 dark:text-amber-400 text-sm">👑</span>}
                <span
                  className={`font-semibold truncate text-xs sm:text-[13px] ${
                    m.winner === m.player2
                      ? 'text-slate-900 dark:text-white font-extrabold'
                      : 'text-slate-600 dark:text-zinc-400'
                  } ${isPlayer2Selected ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}`}
                >
                  {m.player2}
                </span>
              </div>

              {m.score2 !== null ? (
                <span className="shrink-0 px-2.5 py-0.5 rounded font-mono font-black text-xs bg-amber-100 dark:bg-[#fef3c7] text-amber-900 dark:text-[#78350f] border border-amber-300">
                  {m.score2}
                </span>
              ) : (
                <span className="text-slate-400 dark:text-zinc-600 font-mono">—</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-10">
      {/* ---------------------------------------------------------------------
          Upper Bracket (Верхняя сетка - Navy Theme matching Diagram)
          --------------------------------------------------------------------- */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
          <div className="flex items-center gap-3">
            
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                Плей-офф • Double Elimination
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Верхняя сетка
              </h2>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300">
            Победители выходят в гранд-финал
          </span>
        </div>

        {/* 4 Bracket Columns for Upper Bracket + Grand Final (1.25x scaled, spacious fork gaps, no overflow on hover) */}
        <div className="w-full overflow-x-auto lg:overflow-x-visible pb-4 pt-2 px-2 sm:px-4">
          <div
            ref={upperContainerRef}
            className="min-w-[980px] sm:min-w-[1060px] max-w-[1240px] xl:max-w-[1280px] mx-auto relative grid grid-cols-4 gap-6 sm:gap-8 lg:gap-10 xl:gap-12 items-stretch"
          >
            {/* Dynamic Fork Merge Arrow Connectors */}
            <BracketConnectors
              containerRef={upperContainerRef}
              connections={upperConnections}
              theme="blue"
              isDark={isDark}
            />

            {/* Round 1 (Первый раунд - 2 ветки матчей) */}
            <div className="flex flex-col h-full relative z-10 items-center">
              <div className="w-full max-w-[240px] sm:max-w-[250px] px-3 py-1.5 mb-3 rounded-xl bg-blue-50 dark:bg-[#141b2b] border border-blue-200 dark:border-blue-500/20 text-center font-extrabold text-xs text-blue-800 dark:text-blue-300 uppercase tracking-wider shrink-0">
                {upperRounds[0]?.title || 'Первый раунд'}
              </div>
              <div className="w-full max-w-[240px] sm:max-w-[250px] flex-1 flex flex-col justify-around py-2 min-h-[480px] lg:min-h-[520px]">
                {/* Branch 1 (fed into B4) */}
                <div className="flex flex-col gap-3 sm:gap-4">
                  {upperRounds[0]?.matches[0] && renderMatchCard(upperRounds[0].matches[0], 'blue')}
                  {upperRounds[0]?.matches[1] && renderMatchCard(upperRounds[0].matches[1], 'blue')}
                </div>
                {/* Branch 2 (fed into B5) */}
                <div className="flex flex-col gap-3 sm:gap-4">
                  {upperRounds[0]?.matches[2] && renderMatchCard(upperRounds[0].matches[2], 'blue')}
                  {upperRounds[0]?.matches[3] && renderMatchCard(upperRounds[0].matches[3], 'blue')}
                </div>
              </div>
            </div>

            {/* Round 2 (Второй раунд - центрирован относительно веток первого раунда) */}
            <div className="flex flex-col h-full relative z-10 items-center">
              <div className="w-full max-w-[240px] sm:max-w-[250px] px-3 py-1.5 mb-3 rounded-xl bg-blue-50 dark:bg-[#141b2b] border border-blue-200 dark:border-blue-500/20 text-center font-extrabold text-xs text-blue-800 dark:text-blue-300 uppercase tracking-wider shrink-0">
                {upperRounds[1]?.title || 'Второй раунд'}
              </div>
              <div className="w-full max-w-[240px] sm:max-w-[250px] flex-1 flex flex-col justify-around py-2 min-h-[480px] lg:min-h-[520px]">
                {/* B4 aligned with Branch 1 midpoint */}
                <div className="flex flex-col justify-center">
                  {upperRounds[1]?.matches[0] && renderMatchCard(upperRounds[1].matches[0], 'blue')}
                </div>
                {/* B5 aligned with Branch 2 midpoint */}
                <div className="flex flex-col justify-center">
                  {upperRounds[1]?.matches[1] && renderMatchCard(upperRounds[1].matches[1], 'blue')}
                </div>
              </div>
            </div>

            {/* Round 3 (Финал верхней - Centered in middle of entire bracket block) */}
            <div className="flex flex-col h-full relative z-10 items-center">
              <div className="w-full max-w-[240px] sm:max-w-[250px] px-3 py-1.5 mb-3 rounded-xl bg-blue-50 dark:bg-[#141b2b] border border-blue-200 dark:border-blue-500/20 text-center font-extrabold text-xs text-blue-800 dark:text-blue-300 uppercase tracking-wider shrink-0">
                {upperRounds[2]?.title || 'Финал верхней'}
              </div>
              <div className="w-full max-w-[240px] sm:max-w-[250px] flex-1 flex flex-col justify-center py-2 min-h-[480px] lg:min-h-[520px]">
                {upperRounds[2]?.matches.map((m) => renderMatchCard(m, 'blue'))}
              </div>
            </div>

            {/* Round 4 (Гранд-финал - Vertically Centered exactly on same level as Round 3) */}
            <div className="flex flex-col h-full relative z-10 items-center">
              <div className="w-full max-w-[240px] sm:max-w-[250px] px-3 py-1.5 mb-3 rounded-xl bg-gradient-to-r from-amber-500/25 to-amber-600/25 border border-amber-500/40 text-center font-extrabold text-xs text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs shrink-0">
                <span>🏆</span>
                <span>Гранд-финал</span>
              </div>
              <div className="w-full max-w-[240px] sm:max-w-[250px] flex-1 flex flex-col justify-center py-2 min-h-[480px] lg:min-h-[520px] relative">
                <div className="relative w-full">
                  {renderMatchCard(grandFinal, 'gold')}

                  {/* Tournament Champion Showcase Card directly under Grand Final */}
                  <div className="absolute top-full left-0 right-0 mt-3 rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-amber-50 dark:to-[#0e111a] border border-amber-500/40 p-3 text-center flex flex-col items-center shadow-lg shadow-amber-500/10 animate-fade-in z-20">
                    <span className="text-2xl mb-0.5">🏆</span>
                    <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                      Победитель турнира
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                      {champion}
                    </span>
                    <span className="text-[10px] text-slate-600 dark:text-zinc-400 mt-0.5">
                      Чемпион «Турнира по тетрису»
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upper bracket rules notice */}
        <p className="text-xs text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-3 rounded-xl shadow-xs">
          ℹ️ Посев 1 проходит первый раунд. После поражения в верхней сетке игрок переходит в нижнюю сетку (Double Elimination).
        </p>
      </div>

      {/* ---------------------------------------------------------------------
          Lower Bracket (Нижняя сетка - Purple Theme matching Diagram)
          --------------------------------------------------------------------- */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
          <div className="flex items-center gap-3">
            
            <div>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                Сетка лузеров
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Нижняя сетка
              </h2>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300">
            Второй шанс для участников
          </span>
        </div>

        {/* 4 Bracket Columns for Lower Bracket (1.25x scaled, spacious fork gaps, no overflow on hover) */}
        <div className="w-full overflow-x-auto lg:overflow-x-visible pb-4 pt-2 px-2 sm:px-4">
          <div
            ref={lowerContainerRef}
            className="min-w-[980px] sm:min-w-[1060px] max-w-[1240px] xl:max-w-[1280px] mx-auto relative grid grid-cols-4 gap-6 sm:gap-8 lg:gap-10 xl:gap-12 items-stretch"
          >
            {/* Dynamic Fork Merge Arrow Connectors */}
            <BracketConnectors
              containerRef={lowerContainerRef}
              connections={lowerConnections}
              theme="purple"
              isDark={isDark}
            />

            {/* Round 1 (Первый раунд нижней) */}
            <div className="flex flex-col h-full relative z-10 items-center">
              <div className="w-full max-w-[240px] sm:max-w-[250px] px-3 py-1.5 mb-3 rounded-xl bg-purple-50 dark:bg-[#231533] border border-purple-200 dark:border-purple-500/20 text-center font-extrabold text-xs text-purple-800 dark:text-purple-300 uppercase tracking-wider shrink-0">
                {lowerRounds[0]?.title || 'Первый раунд'}
              </div>
              <div className="w-full max-w-[240px] sm:max-w-[250px] flex-1 flex flex-col justify-center gap-8 sm:gap-10 py-2 min-h-[420px] lg:min-h-[460px]">
                {lowerRounds[0]?.matches.map((m) => renderMatchCard(m, 'purple'))}
              </div>
            </div>

            {/* Round 2 (Второй раунд нижней) */}
            <div className="flex flex-col h-full relative z-10 items-center">
              <div className="w-full max-w-[240px] sm:max-w-[250px] px-3 py-1.5 mb-3 rounded-xl bg-purple-50 dark:bg-[#231533] border border-purple-200 dark:border-purple-500/20 text-center font-extrabold text-xs text-purple-800 dark:text-purple-300 uppercase tracking-wider shrink-0">
                {lowerRounds[1]?.title || 'Второй раунд'}
              </div>
              <div className="w-full max-w-[240px] sm:max-w-[250px] flex-1 flex flex-col justify-center gap-8 sm:gap-10 py-2 min-h-[420px] lg:min-h-[460px]">
                {lowerRounds[1]?.matches.map((m) => renderMatchCard(m, 'purple'))}
              </div>
            </div>

            {/* Round 3 (Третий раунд нижней - Centered) */}
            <div className="flex flex-col h-full relative z-10 items-center">
              <div className="w-full max-w-[240px] sm:max-w-[250px] px-3 py-1.5 mb-3 rounded-xl bg-purple-50 dark:bg-[#231533] border border-purple-200 dark:border-purple-500/20 text-center font-extrabold text-xs text-purple-800 dark:text-purple-300 uppercase tracking-wider shrink-0">
                {lowerRounds[2]?.title || 'Третий раунд'}
              </div>
              <div className="w-full max-w-[240px] sm:max-w-[250px] flex-1 flex flex-col justify-center py-2 min-h-[420px] lg:min-h-[460px]">
                {lowerRounds[2]?.matches.map((m) => renderMatchCard(m, 'purple'))}
              </div>
            </div>

            {/* Round 4 (Финал нижней сетки - Centered on same level as Round 3) */}
            <div className="flex flex-col h-full relative z-10 items-center">
              <div className="w-full max-w-[240px] sm:max-w-[250px] px-3 py-1.5 mb-3 rounded-xl bg-purple-50 dark:bg-[#231533] border border-purple-200 dark:border-purple-500/20 text-center font-extrabold text-xs text-purple-800 dark:text-purple-300 uppercase tracking-wider shrink-0">
                {lowerRounds[3]?.title || 'Финал нижней'}
              </div>
              <div className="w-full max-w-[240px] sm:max-w-[250px] flex-1 flex flex-col justify-center py-2 min-h-[420px] lg:min-h-[460px] relative">
                <div className="relative w-full">
                  {lowerRounds[3]?.matches.map((m) => renderMatchCard(m, 'purple'))}
                  <div className="absolute top-full left-0 right-0 mt-3 flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        const target = document.getElementById('bracket-match-Ф');
                        if (target) {
                          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          target.classList.add('ring-4', 'ring-amber-400');
                          setTimeout(() => {
                            target.classList.remove('ring-4', 'ring-amber-400');
                          }, 2000);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:border-amber-400 shadow-xs transition-all cursor-pointer group"
                      title="Перейти к Гранд-финалу в верхней сетке"
                    >
                      <span className="text-sm transition-transform group-hover:-translate-y-0.5">🏆</span>
                      <span>В Гранд-финал</span>
                      <span className="text-amber-600 dark:text-amber-400 font-black transition-transform group-hover:-translate-y-0.5">↑</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lower bracket note */}
        <p className="text-xs text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-3 rounded-xl shadow-xs">
          ℹ️ Победитель матча Н5 (Лина) поднялся в гранд-финал к победителю В6 (Тлен). Гранд-финал проводился одним матчем без переигровки.
        </p>
      </div>
    </div>
  );
};
