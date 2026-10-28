import type { GroupStanding, TournamentRound, GroupMatch } from '../../types/tournament';

interface GroupStageViewProps {
  standings: GroupStanding[];
  tours: TournamentRound[];
  selectedPlayer: string | null;
  onSelectPlayer: (player: string | null) => void;
  onOpenReplay: (match: {
    id: string;
    title: string;
    player1: string;
    score1: number | null;
    player2: string;
    score2: number | null;
    winner: string | null;
    stageName: string;
    replay?: GroupMatch['replay'];
  }) => void;
}

export const GroupStageView = ({
  standings,
  tours,
  selectedPlayer,
  onSelectPlayer,
}: GroupStageViewProps) => {
  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Left Column: 5 Rounds of Group Matches */}
      <div className="w-full lg:w-7/12 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
          <div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
              Этап 1 • Круговая система
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Групповой этап. Каждый с каждым
            </h2>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400">
            5 туров • 15 матчей
          </span>
        </div>

        {/* Tour Cards */}
        <div className="flex flex-col gap-5">
          {tours.map((tour) => (
            <div
              key={tour.tourNumber}
              className="rounded-2xl bg-white dark:bg-[#0f121d] border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs dark:shadow-lg transition-all hover:border-amber-500/30"
            >
              {/* Tour Header - Matching Dark Blue Excel Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-[#1c2942] dark:to-[#162035] border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-wider">
                    {tour.title}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-white/70 dark:bg-black/25 px-2.5 py-0.5 rounded-full border border-slate-300 dark:border-white/5">
                  {tour.matchesCount}
                </span>
              </div>

              {/* Table of Matches */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#131726] text-slate-500 dark:text-zinc-400 font-bold border-b border-slate-200 dark:border-white/5 text-[11px] uppercase tracking-wider">
                      <th className="py-2 px-3 sm:px-4 w-12 text-center">Матч</th>
                      <th className="py-2 px-3 sm:px-4">Игрок 1</th>
                      <th className="py-2 px-2 text-center w-24">Счёт</th>
                      <th className="py-2 px-3 sm:px-4">Игрок 2</th>
                      <th className="py-2 px-3 sm:px-4 hidden sm:table-cell">Победитель</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {tour.matches.map((m) => {
                      const isHighlighted =
                        selectedPlayer &&
                        (m.player1.toLowerCase() === selectedPlayer.toLowerCase() ||
                          m.player2.toLowerCase() === selectedPlayer.toLowerCase());

                      return (
                        <tr
                          key={m.id}
                          className={`transition-colors ${
                            isHighlighted
                              ? 'bg-amber-500/15'
                              : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                          }`}
                        >
                          {/* Match ID */}
                          <td className="py-3 px-3 sm:px-4 text-center font-mono font-bold text-slate-400 dark:text-zinc-400">
                            {m.id}
                          </td>

                          {/* Player 1 */}
                          <td className="py-3 px-3 sm:px-4 font-semibold">
                            <button
                              onClick={() =>
                                onSelectPlayer(
                                  selectedPlayer === m.player1 ? null : m.player1
                                )
                              }
                              className={`cursor-pointer transition-colors text-left hover:text-amber-500 dark:hover:text-amber-400 ${
                                m.winner === m.player1
                                  ? 'text-slate-900 dark:text-white font-extrabold'
                                  : 'text-slate-600 dark:text-zinc-300'
                              } ${
                                selectedPlayer === m.player1
                                  ? 'text-amber-600 dark:text-amber-400 font-bold underline'
                                  : ''
                              }`}
                            >
                              {m.player1}
                            </button>
                          </td>

                          {/* Scores - Yellow cells inspired by Excel */}
                          <td className="py-3 px-2 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-[#fef3c7] text-amber-900 dark:text-[#78350f] font-mono font-black text-xs sm:text-sm shadow-xs border border-amber-300">
                              <span>{m.score1 ?? '—'}</span>
                              <span className="text-amber-600 font-bold">:</span>
                              <span>{m.score2 ?? '—'}</span>
                            </div>
                          </td>

                          {/* Player 2 */}
                          <td className="py-3 px-3 sm:px-4 font-semibold">
                            <button
                              onClick={() =>
                                onSelectPlayer(
                                  selectedPlayer === m.player2 ? null : m.player2
                                )
                              }
                              className={`cursor-pointer transition-colors text-left hover:text-amber-500 dark:hover:text-amber-400 ${
                                m.winner === m.player2
                                  ? 'text-slate-900 dark:text-white font-extrabold'
                                  : 'text-slate-600 dark:text-zinc-300'
                              } ${
                                selectedPlayer === m.player2
                                  ? 'text-amber-600 dark:text-amber-400 font-bold underline'
                                  : ''
                              }`}
                            >
                              {m.player2}
                            </button>
                          </td>

                          {/* Winner Column */}
                          <td className="py-3 px-3 sm:px-4 hidden sm:table-cell text-slate-700 dark:text-zinc-300">
                            {m.winner ? (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                                <span>✓</span>
                                <span>{m.winner}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-zinc-500">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Standings Table ("УЧАСТНИКИ И ИТОГИ ГРУППЫ") */}
      <div className="w-full lg:w-5/12 flex flex-col gap-6 lg:sticky lg:top-24">
        <div className="border-b border-slate-200 dark:border-white/10 pb-3">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
            Турнирная таблица
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Участники и итоги группы
          </h2>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0f121d] border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs dark:shadow-xl">
          {/* Header - Navy blue like screenshot 1 */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-[#1c2942] dark:to-[#162035] border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
              Посев и статистика
            </span>
            <span className="text-xs text-slate-600 dark:text-zinc-300">
              Всего 7 участников
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#131726] text-slate-500 dark:text-zinc-400 font-bold border-b border-slate-200 dark:border-white/5 text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 text-center w-14">Посев</th>
                  <th className="py-2.5 px-3">Участник</th>
                  <th className="py-2.5 px-2 text-center">Поб.</th>
                  <th className="py-2.5 px-2 text-center">Пор.</th>
                  <th className="py-2.5 px-2 text-center">Разн.</th>
                  <th className="py-2.5 px-3 text-center">Игр</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {standings.map((p) => {
                  const isSelected = selectedPlayer === p.name;
                  const isFirst = p.seed === 1;
                  const isSecond = p.seed === 2;
                  const isThird = p.seed === 3;

                  // Seed badge styling matching original spreadsheet colors
                  let seedBadgeClass = 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-zinc-300';
                  if (isFirst) seedBadgeClass = 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/30';
                  else if (isSecond) seedBadgeClass = 'bg-slate-200 dark:bg-slate-300 text-slate-950 font-black';
                  else if (isThird) seedBadgeClass = 'bg-amber-700 text-white font-bold';
                  else if (p.seed === 7) seedBadgeClass = 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 font-bold';

                  return (
                    <tr
                      key={p.seed}
                      onClick={() => onSelectPlayer(isSelected ? null : p.name)}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-500/15'
                          : p.seed === 7
                          ? 'bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]'
                          : 'hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Seed badge */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs ${seedBadgeClass}`}>
                          {p.seed}
                        </span>
                      </td>

                      {/* Participant name */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                            {p.name}
                          </span>
                          {isFirst && <span title="1 место группы">👑</span>}
                          {p.seed === 7 && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-medium">
                              Вне группы
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Wins */}
                      <td className="py-3 px-2 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {p.wins}
                      </td>

                      {/* Losses */}
                      <td className="py-3 px-2 text-center font-semibold text-rose-600 dark:text-rose-400">
                        {p.losses}
                      </td>

                      {/* Diff */}
                      <td className="py-3 px-2 text-center font-mono font-bold">
                        <span className={p.diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : p.diff < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-zinc-400'}>
                          {p.diff > 0 ? `+${p.diff}` : p.diff}
                        </span>
                      </td>

                      {/* Played */}
                      <td className="py-3 px-3 text-center text-slate-500 dark:text-zinc-400 font-mono">
                        {p.played}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Explanation Footer matching Excel Notes */}
          <div className="p-4 bg-slate-50 dark:bg-[#121524] border-t border-slate-200 dark:border-white/5 flex flex-col gap-2 text-xs text-slate-600 dark:text-zinc-400">
            <div className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
              <span><strong>Александр</strong>: вне группы, посев 7 в плей-офф.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
              <span>После завершения группы вписан посев 1–6. За Александром закреплено 7-е место.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-slate-400 dark:text-zinc-500 font-bold">•</span>
              <span>Дополнительный показатель при равенстве побед: <strong>Разн.</strong> — разница счёта.</span>
            </div>
          </div>
        </div>

        {/* Selected Player Quick Stats Pill */}
        {selectedPlayer && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <span className="text-xs text-slate-700 dark:text-zinc-300">
                Выбран игрок: <strong className="text-amber-600 dark:text-amber-400 text-sm">{selectedPlayer}</strong>
              </span>
            </div>
            <button
              onClick={() => onSelectPlayer(null)}
              className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white underline cursor-pointer"
            >
              Сбросить фильтр
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
