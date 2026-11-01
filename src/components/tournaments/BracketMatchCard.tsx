import React, { memo } from 'react';
import type { BracketMatch } from '../../types/tournament';

interface BracketMatchCardProps {
  match: BracketMatch;
  theme: 'blue' | 'purple' | 'gold';
  selectedPlayer: string | null;
  onSelectPlayer: (player: string | null) => void;
}

export const BracketMatchCard: React.FC<BracketMatchCardProps> = memo(({
  match: m,
  theme,
  selectedPlayer,
  onSelectPlayer,
}) => {
  const isPlayer1Selected =
    Boolean(selectedPlayer) && m.player1.toLowerCase() === selectedPlayer?.toLowerCase();
  const isPlayer2Selected =
    Boolean(selectedPlayer) && m.player2.toLowerCase() === selectedPlayer?.toLowerCase();
  const isMatchHighlighted = isPlayer1Selected || isPlayer2Selected;

  let headerBg =
    'bg-blue-100 dark:bg-[#1b253b] text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-500/20';
  let cardBorder = 'border-slate-200 dark:border-blue-500/20';
  if (theme === 'purple') {
    headerBg =
      'bg-purple-100 dark:bg-[#2b1b3d] text-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-500/20';
    cardBorder = 'border-slate-200 dark:border-purple-500/20';
  } else if (theme === 'gold') {
    headerBg =
      'bg-gradient-to-r from-amber-500/20 via-amber-400/25 to-amber-500/20 dark:from-amber-600/30 dark:via-amber-500/30 dark:to-amber-600/30 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-500/40';
    cardBorder =
      'border-amber-400/60 dark:border-amber-500/40 shadow-md shadow-amber-500/10';
  }

  if (isMatchHighlighted) {
    cardBorder =
      'border-amber-500 ring-2 ring-amber-400/30 shadow-md shadow-amber-500/20';
  }

  return (
    <div
      key={m.id}
      id={`bracket-match-${m.id}`}
      className={`relative z-10 w-full max-w-[240px] sm:max-w-[250px] mx-auto rounded-xl bg-white dark:bg-[#0f121d] border ${cardBorder} overflow-hidden shadow-xs dark:shadow-md transition-colors duration-150 hover:border-amber-400/70 flex flex-col`}
    >
      {/* Match Header with Match ID */}
      <div
        className={`px-3 py-1.5 ${headerBg} border-b flex items-center justify-between text-xs font-bold`}
      >
        <span className="truncate pr-1 font-mono tracking-tight text-[11px] sm:text-xs">
          {m.label}
        </span>
      </div>

      {/* Players & Scores List */}
      <div className="text-xs">
        {/* Player 1 */}
        <div
          {...(m.isBye ? { 'data-bracket-bye': 'true' } : {})}
          onClick={() =>
            onSelectPlayer(selectedPlayer === m.player1 ? null : m.player1)
          }
          className={`px-3 ${
            m.isBye
              ? 'py-3.5 sm:py-4 min-h-[70px] sm:min-h-[76px]'
              : 'py-2 min-h-[34px] sm:min-h-[38px]'
          } flex items-center justify-between cursor-pointer transition-colors ${
            isPlayer1Selected
              ? 'bg-amber-500/15 dark:bg-amber-500/20'
              : m.winner === m.player1
              ? 'bg-slate-50/70 dark:bg-white/[0.03]'
              : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            {m.winner === m.player1 && (
              <span className="text-amber-500 dark:text-amber-400 text-sm">👑</span>
            )}
            <span
              className={`font-semibold truncate text-xs sm:text-[13px] ${
                m.winner === m.player1
                  ? 'text-slate-900 dark:text-white font-extrabold'
                  : 'text-slate-600 dark:text-zinc-400'
              } ${
                isPlayer1Selected
                  ? 'text-amber-600 dark:text-amber-400 font-bold'
                  : ''
              }`}
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
            onClick={() =>
              onSelectPlayer(selectedPlayer === m.player2 ? null : m.player2)
            }
            className={`px-3 py-2 min-h-[34px] sm:min-h-[38px] flex items-center justify-between cursor-pointer transition-colors ${
              isPlayer2Selected
                ? 'bg-amber-500/15 dark:bg-amber-500/20'
                : m.winner === m.player2
                ? 'bg-slate-50/70 dark:bg-white/[0.03]'
                : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {m.winner === m.player2 && (
                <span className="text-amber-500 dark:text-amber-400 text-sm">👑</span>
              )}
              <span
                className={`font-semibold truncate text-xs sm:text-[13px] ${
                  m.winner === m.player2
                    ? 'text-slate-900 dark:text-white font-extrabold'
                    : 'text-slate-600 dark:text-zinc-400'
                } ${
                  isPlayer2Selected
                    ? 'text-amber-600 dark:text-amber-400 font-bold'
                    : ''
                }`}
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
});

BracketMatchCard.displayName = 'BracketMatchCard';
