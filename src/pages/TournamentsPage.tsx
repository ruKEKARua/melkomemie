import { useEffect, useState } from 'react';
import type { TournamentData, GroupMatch, BracketMatch, ReplayInfo } from '../types/tournament';
import { loadTournamentData, VERIFIED_TOURNAMENT_SNAPSHOT } from '../api/tournamentApi';
import { GroupStageView } from '../components/tournaments/GroupStageView';
import { BracketView } from '../components/tournaments/BracketView';
import { ReplayModal } from '../components/tournaments/ReplayModal';

interface TournamentsPageProps {
  onBack?: () => void;
  isAuthorized?: boolean;
  userName?: string;
  userPicture?: string;
  onLogin?: () => void;
  onLogout?: () => void;
}

type TabMode = 'all' | 'bracket' | 'group' | 'replays';

export const TournamentsPage: React.FC<TournamentsPageProps> = () => {
  const [tournament, setTournament] = useState<TournamentData>(VERIFIED_TOURNAMENT_SNAPSHOT);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabMode>('all');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Replay Modal State
  const [activeReplayMatch, setActiveReplayMatch] = useState<{
    isOpen: boolean;
    id: string;
    title: string;
    player1: string;
    score1: number | null;
    player2: string;
    score2: number | null;
    winner: string | null;
    stageName: string;
    replay?: ReplayInfo;
  }>({
    isOpen: false,
    id: '',
    title: '',
    player1: '',
    score1: null,
    player2: '',
    score2: null,
    winner: null,
    stageName: '',
  });

  // Fetch live tournament data on mount
  const handleFetchData = async () => {
    setIsLoading(true);
    try {
      const data = await loadTournamentData();
      setTournament(data);
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 4000);
    } catch (e) {
      console.error(e);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    loadTournamentData()
      .then((data) => {
        if (isMounted) setTournament(data);
      })
      .catch((err) => console.error(err));
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenReplay = (matchData: {
    id: string;
    title: string;
    player1: string;
    score1: number | null;
    player2: string;
    score2: number | null;
    winner: string | null;
    stageName: string;
    replay?: ReplayInfo;
  }) => {
    setActiveReplayMatch({
      isOpen: true,
      ...matchData,
    });
  };

  const handleCloseReplay = () => {
    setActiveReplayMatch((prev) => ({ ...prev, isOpen: false }));
  };

  const handleReplayUpdated = (matchId: string, replay: ReplayInfo) => {
    setTournament((prev) => {
      const updateMatch = <T extends { id: string; replay?: ReplayInfo }>(m: T): T =>
        m.id === matchId ? { ...m, replay } : m;

      return {
        ...prev,
        tours: prev.tours.map((t) => ({
          ...t,
          matches: t.matches.map(updateMatch),
        })),
        upperBracketRounds: prev.upperBracketRounds.map((r) => ({
          ...r,
          matches: r.matches.map(updateMatch),
        })),
        lowerBracketRounds: prev.lowerBracketRounds.map((r) => ({
          ...r,
          matches: r.matches.map(updateMatch),
        })),
        grandFinal: updateMatch(prev.grandFinal),
      };
    });
  };

  // Collect all players for quick filter pills
  const allPlayers = tournament.standings.map((s) => s.name);

  // Collect matches that have replay enabled for the Replay Gallery tab
  const allReplayMatches: Array<{
    match: GroupMatch | BracketMatch;
    stageName: string;
  }> = [];

  tournament.tours.forEach((t) => {
    t.matches.forEach((m) => {
      if (m.replay?.hasReplay) {
        allReplayMatches.push({ match: m, stageName: t.title });
      }
    });
  });

  tournament.upperBracketRounds.forEach((r) => {
    r.matches.forEach((m) => {
      if (m.replay?.hasReplay) {
        allReplayMatches.push({ match: m, stageName: `Верхняя сетка • ${r.title}` });
      }
    });
  });

  tournament.lowerBracketRounds.forEach((r) => {
    r.matches.forEach((m) => {
      if (m.replay?.hasReplay) {
        allReplayMatches.push({ match: m, stageName: `Нижняя сетка • ${r.title}` });
      }
    });
  });

  if (tournament.grandFinal.replay?.hasReplay) {
    allReplayMatches.push({ match: tournament.grandFinal, stageName: 'Гранд-финал' });
  }

  return (
    <div className="min-h-screen bg-[#f4f6fa] dark:bg-[#090a0f] text-slate-900 dark:text-white flex flex-col transition-colors duration-200">
      {/* Sync notification message */}
      {syncStatus === 'success' && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 text-xs text-center py-1.5 font-semibold">
          ✓ Данные турнира успешно синхронизированы с Google Таблицей
        </div>
      )}
      {syncStatus === 'error' && (
        <div className="bg-rose-500/15 border-b border-rose-500/30 text-rose-300 text-xs text-center py-1.5 font-semibold">
          ⚠️ Не удалось связаться с Google Таблицей. Отображается сохранённая копия.
        </div>
      )}

      {/* ---------------------------------------------------------------------
          Main Content Container
          --------------------------------------------------------------------- */}
      <main className="flex-1 max-w-7xl 2xl:max-w-[1600px] min-[1920px]:max-w-[1800px] min-[2560px]:max-w-[2200px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-8">
        {/* -------------------------------------------------------------------
            Hero Tournament Banner with Podium
            ------------------------------------------------------------------- */}
        <div className="relative rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-100 to-white dark:from-[#121829] dark:via-[#0d121f] dark:to-[#080b12] border border-slate-200 dark:border-white/10 p-6 sm:p-8 overflow-hidden shadow-sm dark:shadow-2xl">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left: Tournament Meta */}
            <div className="flex flex-col gap-3 text-center lg:text-left items-center lg:items-start max-w-xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                Турнир по тетрису
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 leading-relaxed">
                Официальные результаты первого турнира по Тетрису. Круговой групповой этап для определения посева и бескомпромиссная сетка Double Elimination.
              </p>

              {/* Tournament quick stats */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-xs text-slate-600 dark:text-zinc-400">
                <div className="flex items-center gap-1.5 bg-white/80 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/5 shadow-xs">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">7</span> участников
                </div>
                <div className="flex items-center gap-1.5 bg-white/80 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/5 shadow-xs">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">26</span> матчей сыграно
                </div>
                <div className="flex items-center gap-1.5 bg-white/80 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/5 shadow-xs">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">5</span> туров группы + плей-офф
                </div>
                <button
                  onClick={handleFetchData}
                  disabled={isLoading}
                  title="Синхронизировать данные с Google Таблицей"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
                  <span>Синхронизировать</span>
                </button>
              </div>
            </div>

            {/* Right: Champion Podium Showcase */}
            <div className="flex items-end justify-center gap-3 sm:gap-4 shrink-0 pt-4 lg:pt-0">
              {/* 2nd Place: Тлен */}
              <div className="flex flex-col items-center">
                <span className="text-xl sm:text-2xl mb-1">🥈</span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">2 место</span>
                <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mb-2">{tournament.runnerUp}</span>
                <div className="w-20 sm:w-24 h-20 rounded-t-2xl bg-gradient-to-t from-slate-300 to-slate-200 dark:from-slate-800 dark:to-slate-700/80 border-t-2 border-l-2 border-r-2 border-slate-400/50 flex items-center justify-center text-slate-700 dark:text-slate-400 font-black text-lg shadow-sm">
                  2
                </div>
              </div>

              {/* 1st Place: Лина */}
              <div className="flex flex-col items-center">
                <span className="text-2xl sm:text-3xl mb-1 animate-bounce">👑</span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Чемпион</span>
                <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-300 mb-2">{tournament.champion}</span>
                <div className="w-24 sm:w-28 h-28 rounded-t-2xl bg-gradient-to-t from-amber-500 to-amber-300 dark:from-amber-600 dark:to-amber-400 border-t-2 border-l-2 border-r-2 border-amber-300 flex flex-col items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-amber-500/25">
                  <span>1</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-900">WINNER</span>
                </div>
              </div>

              {/* 3rd Place: Иван */}
              <div className="flex flex-col items-center">
                <span className="text-xl sm:text-2xl mb-1">🥉</span>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-600">3 место</span>
                <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mb-2">{tournament.thirdPlace}</span>
                <div className="w-20 sm:w-24 h-14 rounded-t-2xl bg-gradient-to-t from-amber-200 to-amber-100 dark:from-[#2c1d11] dark:to-[#422915] border-t-2 border-l-2 border-r-2 border-amber-600/40 flex items-center justify-center text-amber-800 dark:text-amber-600 font-black text-lg shadow-sm">
                  3
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------------
            Player Filter Bar & Quick Controls
            ------------------------------------------------------------------- */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#0f121d] border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mr-1">
              Фильтр по игроку:
            </span>
            <button
              onClick={() => setSelectedPlayer(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedPlayer === null
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              Все участники (7)
            </button>
            {allPlayers.map((player) => {
              const isSelected = selectedPlayer === player;
              return (
                <button
                  key={player}
                  onClick={() => setSelectedPlayer(isSelected ? null : player)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  {player === tournament.champion && <span>👑</span>}
                  <span>{player}</span>
                </button>
              );
            })}
          </div>

          {/* Direct link to Google Sheet */}
          <a
            href="https://docs.google.com/spreadsheets/d/1F4z-LBQWf2tRt64x0yYhUK3-Evk1k8L9R_C93kNiZY8/edit?gid=56117144#gid=56117144"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5 underline"
          >
            <span>Открыть Google Таблицу</span>
            <span>↗</span>
          </a>
        </div>

        {/* -------------------------------------------------------------------
            View Mode Navigation Tabs
            ------------------------------------------------------------------- */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white dark:bg-white/15 dark:text-white shadow-md'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <span>📋</span>
            <span>Все этапы (Обзор)</span>
          </button>

          <button
            onClick={() => setActiveTab('bracket')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'bracket'
                ? 'bg-blue-600/20 text-blue-800 dark:text-blue-300 border border-blue-500/40 shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <span>⚔️</span>
            <span>Сетка плей-офф (Double Elimination)</span>
          </button>

          <button
            onClick={() => setActiveTab('group')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'group'
                ? 'bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <span>📊</span>
            <span>Групповой этап и таблица</span>
          </button>
        </div>

        {/* -------------------------------------------------------------------
            Active Tab View Content
            ------------------------------------------------------------------- */}
        {activeTab === 'all' && (
          <div className="flex flex-col gap-14">
            {/* Bracket View First */}
            <section>
              <BracketView
                upperRounds={tournament.upperBracketRounds}
                lowerRounds={tournament.lowerBracketRounds}
                grandFinal={tournament.grandFinal}
                champion={tournament.champion}
                selectedPlayer={selectedPlayer}
                onSelectPlayer={setSelectedPlayer}
                onOpenReplay={handleOpenReplay}
              />
            </section>

            {/* Group Stage View */}
            <section className="pt-6 border-t border-slate-200 dark:border-white/10 transition-colors">
              <GroupStageView
                standings={tournament.standings}
                tours={tournament.tours}
                selectedPlayer={selectedPlayer}
                onSelectPlayer={setSelectedPlayer}
                onOpenReplay={handleOpenReplay}
              />
            </section>
          </div>
        )}

        {activeTab === 'bracket' && (
          <section>
            <BracketView
              upperRounds={tournament.upperBracketRounds}
              lowerRounds={tournament.lowerBracketRounds}
              grandFinal={tournament.grandFinal}
              champion={tournament.champion}
              selectedPlayer={selectedPlayer}
              onSelectPlayer={setSelectedPlayer}
              onOpenReplay={handleOpenReplay}
            />
          </section>
        )}

        {activeTab === 'group' && (
          <section>
            <GroupStageView
              standings={tournament.standings}
              tours={tournament.tours}
              selectedPlayer={selectedPlayer}
              onSelectPlayer={setSelectedPlayer}
              onOpenReplay={handleOpenReplay}
            />
          </section>
        )}

        {activeTab === 'replays' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div>
                <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Видеоархив турнира
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Записи и реплеи матчей
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 hidden sm:block max-w-sm text-right">
                Ячейки со значком 📺 поддерживают моментальный просмотр реплея или привязку ссылки на трансляцию.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allReplayMatches.map(({ match, stageName }) => (
                <div
                  key={match.id}
                  onClick={() =>
                    handleOpenReplay({
                      id: match.id,
                      title: 'label' in match ? match.label : `Матч ${match.id}: ${match.player1} vs ${match.player2}`,
                      player1: match.player1,
                      score1: match.score1,
                      player2: match.player2,
                      score2: match.score2,
                      winner: match.winner,
                      stageName,
                      replay: match.replay,
                    })
                  }
                  className="rounded-2xl bg-white dark:bg-[#0f121d] border border-slate-200 dark:border-white/10 hover:border-amber-500/50 p-5 flex flex-col justify-between gap-4 transition-all hover:scale-[1.02] cursor-pointer shadow-sm dark:shadow-lg group"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        {stageName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 font-mono text-xs text-slate-700 dark:text-zinc-300">
                        {match.id}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                      {match.player1} vs {match.player2}
                    </h4>

                    {match.replay?.description && (
                      <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-2">
                        {match.replay.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2 font-mono font-bold text-sm">
                      <span className="text-amber-600 dark:text-amber-400">{match.score1 ?? '—'}</span>
                      <span className="text-slate-400 dark:text-zinc-600">:</span>
                      <span className="text-amber-600 dark:text-amber-400">{match.score2 ?? '—'}</span>
                    </div>

                    <span className="px-3 py-1 rounded-xl bg-red-500/15 group-hover:bg-red-500/25 text-red-700 dark:text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-all">
                      <span>📺</span>
                      <span>Смотреть реплей</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <span>
                💡 Вы можете открыть реплей любого матча, нажав на значок телевизора <strong>📺</strong> в турнирной сетке или таблице туров.
              </span>
              <button
                onClick={() =>
                  handleOpenReplay({
                    id: 'DEMO',
                    title: 'Демонстрационный плеер реплея',
                    player1: 'Игрок 1',
                    score1: 3,
                    player2: 'Игрок 2',
                    score2: 2,
                    winner: 'Игрок 1',
                    stageName: 'Тестовый режим',
                    replay: { hasReplay: true },
                  })
                }
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-white border border-slate-200 dark:border-transparent font-semibold whitespace-nowrap cursor-pointer transition-all shadow-xs"
              >
                Открыть тестовый плеер
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ---------------------------------------------------------------------
          Replay Modal
          --------------------------------------------------------------------- */}
      <ReplayModal
        isOpen={activeReplayMatch.isOpen}
        onClose={handleCloseReplay}
        matchId={activeReplayMatch.id}
        matchTitle={activeReplayMatch.title}
        player1={activeReplayMatch.player1}
        score1={activeReplayMatch.score1}
        player2={activeReplayMatch.player2}
        score2={activeReplayMatch.score2}
        winner={activeReplayMatch.winner}
        stageName={activeReplayMatch.stageName}
        replay={activeReplayMatch.replay}
        onReplayUpdated={handleReplayUpdated}
      />

      {/* ---------------------------------------------------------------------
          Footer
          --------------------------------------------------------------------- */}
      <footer className="w-full border-t border-slate-200 dark:border-white/5 py-6 px-4 sm:px-6 text-center text-xs text-slate-500 dark:text-zinc-500 mt-12">
        <p>Клуб «Мелкомемье» • Турнир по тетрису • Результаты задокументированы в Google Sheets</p>
      </footer>
    </div>
  );
};
