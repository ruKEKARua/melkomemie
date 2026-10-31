import { useRef } from 'react';
import type { BracketRound, BracketMatch } from '../../types/tournament';
import { useTheme } from '../../utils/theme';
import type { BracketConn } from '../../hooks/useBracketConnectors';
import { BracketConnectors } from './BracketConnectors';
import { BracketMatchCard } from './BracketMatchCard';

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
      isHighlighted: selectedPlayer
        ? ['лина', 'монета'].includes(selectedPlayer.toLowerCase())
        : false,
    },
    // 2. В2 + В3 merge into В5
    {
      type: 'fork',
      topFrom: 'bracket-match-В2',
      bottomFrom: 'bracket-match-В3',
      to: 'bracket-match-В5',
      isHighlighted: selectedPlayer
        ? ['иван', 'тлен'].includes(selectedPlayer.toLowerCase())
        : false,
    },
    // 3. В4 + В5 merge into В6
    {
      type: 'fork',
      topFrom: 'bracket-match-В4',
      bottomFrom: 'bracket-match-В5',
      to: 'bracket-match-В6',
      isHighlighted: selectedPlayer
        ? ['лина', 'тлен'].includes(selectedPlayer.toLowerCase())
        : false,
    },
    // 4. В6 straight horizontal arrow into Grand Final (Ф)
    {
      type: 'single',
      from: 'bracket-match-В6',
      to: 'bracket-match-Ф',
      color: isDark ? '#fbbf24' : '#d97706',
      isHighlighted: selectedPlayer
        ? ['тлен'].includes(selectedPlayer.toLowerCase())
        : false,
    },
  ];

  // Lower bracket match fork and single connector mappings
  const lowerConnections: BracketConn[] = [
    // 1. Проход в Н2 -> Н2
    {
      type: 'single',
      from: 'bracket-match-Проход в Н2',
      to: 'bracket-match-Н2',
      isHighlighted: selectedPlayer
        ? ['лысый'].includes(selectedPlayer.toLowerCase())
        : false,
    },
    // 2. Н1 -> Н3
    {
      type: 'single',
      from: 'bracket-match-Н1',
      to: 'bracket-match-Н3',
      isHighlighted: selectedPlayer
        ? ['катя'].includes(selectedPlayer.toLowerCase())
        : false,
    },
    // 3. Н2 + Н3 merge into Н4
    {
      type: 'fork',
      topFrom: 'bracket-match-Н2',
      bottomFrom: 'bracket-match-Н3',
      to: 'bracket-match-Н4',
      isHighlighted: selectedPlayer
        ? ['иван', 'монета'].includes(selectedPlayer.toLowerCase())
        : false,
    },
    // 4. Н4 straight horizontal arrow into Н5 (Финал нижней)
    {
      type: 'single',
      from: 'bracket-match-Н4',
      to: 'bracket-match-Н5',
      isHighlighted: selectedPlayer
        ? ['иван'].includes(selectedPlayer.toLowerCase())
        : false,
    },
  ];

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

        {/* 4 Bracket Columns for Upper Bracket + Grand Final */}
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
                  {upperRounds[0]?.matches[0] && (
                    <BracketMatchCard
                      match={upperRounds[0].matches[0]}
                      theme="blue"
                      selectedPlayer={selectedPlayer}
                      onSelectPlayer={onSelectPlayer}
                    />
                  )}
                  {upperRounds[0]?.matches[1] && (
                    <BracketMatchCard
                      match={upperRounds[0].matches[1]}
                      theme="blue"
                      selectedPlayer={selectedPlayer}
                      onSelectPlayer={onSelectPlayer}
                    />
                  )}
                </div>
                {/* Branch 2 (fed into B5) */}
                <div className="flex flex-col gap-3 sm:gap-4">
                  {upperRounds[0]?.matches[2] && (
                    <BracketMatchCard
                      match={upperRounds[0].matches[2]}
                      theme="blue"
                      selectedPlayer={selectedPlayer}
                      onSelectPlayer={onSelectPlayer}
                    />
                  )}
                  {upperRounds[0]?.matches[3] && (
                    <BracketMatchCard
                      match={upperRounds[0].matches[3]}
                      theme="blue"
                      selectedPlayer={selectedPlayer}
                      onSelectPlayer={onSelectPlayer}
                    />
                  )}
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
                  {upperRounds[1]?.matches[0] && (
                    <BracketMatchCard
                      match={upperRounds[1].matches[0]}
                      theme="blue"
                      selectedPlayer={selectedPlayer}
                      onSelectPlayer={onSelectPlayer}
                    />
                  )}
                </div>
                {/* B5 aligned with Branch 2 midpoint */}
                <div className="flex flex-col justify-center">
                  {upperRounds[1]?.matches[1] && (
                    <BracketMatchCard
                      match={upperRounds[1].matches[1]}
                      theme="blue"
                      selectedPlayer={selectedPlayer}
                      onSelectPlayer={onSelectPlayer}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Round 3 (Финал верхней) */}
            <div className="flex flex-col h-full relative z-10 items-center">
              <div className="w-full max-w-[240px] sm:max-w-[250px] px-3 py-1.5 mb-3 rounded-xl bg-blue-50 dark:bg-[#141b2b] border border-blue-200 dark:border-blue-500/20 text-center font-extrabold text-xs text-blue-800 dark:text-blue-300 uppercase tracking-wider shrink-0">
                {upperRounds[2]?.title || 'Финал верхней'}
              </div>
              <div className="w-full max-w-[240px] sm:max-w-[250px] flex-1 flex flex-col justify-center py-2 min-h-[480px] lg:min-h-[520px]">
                {upperRounds[2]?.matches.map((m) => (
                  <BracketMatchCard
                    key={m.id}
                    match={m}
                    theme="blue"
                    selectedPlayer={selectedPlayer}
                    onSelectPlayer={onSelectPlayer}
                  />
                ))}
              </div>
            </div>

            {/* Round 4 (Гранд-финал) */}
            <div className="flex flex-col h-full relative z-10 items-center">
              <div className="w-full max-w-[240px] sm:max-w-[250px] px-3 py-1.5 mb-3 rounded-xl bg-gradient-to-r from-amber-500/25 to-amber-600/25 border border-amber-500/40 text-center font-extrabold text-xs text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs shrink-0">
                <span>🏆</span>
                <span>Гранд-финал</span>
              </div>
              <div className="w-full max-w-[240px] sm:max-w-[250px] flex-1 flex flex-col justify-center py-2 min-h-[480px] lg:min-h-[520px] relative">
                <div className="relative w-full">
                  <BracketMatchCard
                    match={grandFinal}
                    theme="gold"
                    selectedPlayer={selectedPlayer}
                    onSelectPlayer={onSelectPlayer}
                  />

                  {/* Tournament Champion Showcase Card */}
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

        {/* 4 Bracket Columns for Lower Bracket */}
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
                {lowerRounds[0]?.matches.map((m) => (
                  <BracketMatchCard
                    key={m.id}
                    match={m}
                    theme="purple"
                    selectedPlayer={selectedPlayer}
                    onSelectPlayer={onSelectPlayer}
                  />
                ))}
              </div>
            </div>

            {/* Round 2 (Второй раунд нижней) */}
            <div className="flex flex-col h-full relative z-10 items-center">
              <div className="w-full max-w-[240px] sm:max-w-[250px] px-3 py-1.5 mb-3 rounded-xl bg-purple-50 dark:bg-[#231533] border border-purple-200 dark:border-purple-500/20 text-center font-extrabold text-xs text-purple-800 dark:text-purple-300 uppercase tracking-wider shrink-0">
                {lowerRounds[1]?.title || 'Второй раунд'}
              </div>
              <div className="w-full max-w-[240px] sm:max-w-[250px] flex-1 flex flex-col justify-center gap-8 sm:gap-10 py-2 min-h-[420px] lg:min-h-[460px]">
                {lowerRounds[1]?.matches.map((m) => (
                  <BracketMatchCard
                    key={m.id}
                    match={m}
                    theme="purple"
                    selectedPlayer={selectedPlayer}
                    onSelectPlayer={onSelectPlayer}
                  />
                ))}
              </div>
            </div>

            {/* Round 3 (Третий раунд нижней - Centered) */}
            <div className="flex flex-col h-full relative z-10 items-center">
              <div className="w-full max-w-[240px] sm:max-w-[250px] px-3 py-1.5 mb-3 rounded-xl bg-purple-50 dark:bg-[#231533] border border-purple-200 dark:border-purple-500/20 text-center font-extrabold text-xs text-purple-800 dark:text-purple-300 uppercase tracking-wider shrink-0">
                {lowerRounds[2]?.title || 'Третий раунд'}
              </div>
              <div className="w-full max-w-[240px] sm:max-w-[250px] flex-1 flex flex-col justify-center py-2 min-h-[420px] lg:min-h-[460px]">
                {lowerRounds[2]?.matches.map((m) => (
                  <BracketMatchCard
                    key={m.id}
                    match={m}
                    theme="purple"
                    selectedPlayer={selectedPlayer}
                    onSelectPlayer={onSelectPlayer}
                  />
                ))}
              </div>
            </div>

            {/* Round 4 (Финал нижней сетки) */}
            <div className="flex flex-col h-full relative z-10 items-center">
              <div className="w-full max-w-[240px] sm:max-w-[250px] px-3 py-1.5 mb-3 rounded-xl bg-purple-50 dark:bg-[#231533] border border-purple-200 dark:border-purple-500/20 text-center font-extrabold text-xs text-purple-800 dark:text-purple-300 uppercase tracking-wider shrink-0">
                {lowerRounds[3]?.title || 'Финал нижней'}
              </div>
              <div className="w-full max-w-[240px] sm:max-w-[250px] flex-1 flex flex-col justify-center py-2 min-h-[420px] lg:min-h-[460px] relative">
                <div className="relative w-full">
                  {lowerRounds[3]?.matches.map((m) => (
                    <BracketMatchCard
                      key={m.id}
                      match={m}
                      theme="purple"
                      selectedPlayer={selectedPlayer}
                      onSelectPlayer={onSelectPlayer}
                    />
                  ))}
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
                      <span className="text-sm transition-transform group-hover:-translate-y-0.5">
                        🏆
                      </span>
                      <span>В Гранд-финал</span>
                      <span className="text-amber-600 dark:text-amber-400 font-black transition-transform group-hover:-translate-y-0.5">
                        ↑
                      </span>
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
