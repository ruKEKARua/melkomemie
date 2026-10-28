import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReplayInfo } from '../../types/tournament';
import { getEmbedUrl, saveMatchReplay } from '../../api/tournamentApi';

interface ReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  matchTitle: string;
  player1: string;
  score1: number | null;
  player2: string;
  score2: number | null;
  winner: string | null;
  stageName: string;
  replay?: ReplayInfo;
  onReplayUpdated?: (matchId: string, replay: ReplayInfo) => void;
}

export const ReplayModal = ({
  isOpen,
  onClose,
  matchId,
  matchTitle,
  player1,
  score1,
  player2,
  score2,
  winner,
  stageName,
  replay,
  onReplayUpdated,
}: ReplayModalProps) => {
  const [testUrl, setTestUrl] = useState(replay?.videoUrl || '');
  const [activeUrl, setActiveUrl] = useState(replay?.videoUrl || '');
  const [showConfig, setShowConfig] = useState(false);
  const [prevMatchId, setPrevMatchId] = useState(matchId);

  // Adjust state during render when matchId changes (standard React 19 pattern)
  if (matchId !== prevMatchId) {
    setPrevMatchId(matchId);
    setActiveUrl(replay?.videoUrl || '');
    setTestUrl(replay?.videoUrl || '');
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.paddingRight = originalPaddingRight;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const embedUrl = getEmbedUrl(activeUrl);

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ReplayInfo = {
      hasReplay: true,
      videoUrl: testUrl.trim() || undefined,
      title: matchTitle,
      description: `${player1} vs ${player2} (${stageName})`,
    };
    setActiveUrl(testUrl.trim());
    saveMatchReplay(matchId, updated);
    if (onReplayUpdated) {
      onReplayUpdated(matchId, updated);
    }
    setShowConfig(false);
  };

  const handleClearUrl = () => {
    setTestUrl('');
    setActiveUrl('');
    const updated: ReplayInfo = {
      hasReplay: true,
      videoUrl: undefined,
      title: matchTitle,
      description: `${player1} vs ${player2} (${stageName})`,
    };
    saveMatchReplay(matchId, updated);
    if (onReplayUpdated) {
      onReplayUpdated(matchId, updated);
    }
    setShowConfig(false);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-black/85 backdrop-blur-md overflow-y-auto overscroll-contain animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#141724]">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 text-lg">
              📺
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Реплей матча
                </span>
                <span className="text-slate-400 dark:text-zinc-500 text-xs">•</span>
                <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300">{stageName}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-amber-700 dark:text-amber-400 font-mono font-bold">
                  {matchId}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {matchTitle || `${player1} vs ${player2}`}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/5 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Настройка ссылки на видео реплея"
            >
              <span>⚙️</span>
              <span className="hidden sm:inline">Ссылка</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
              aria-label="Закрыть"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Optional Replay URL Config Bar */}
        {showConfig && (
          <form
            onSubmit={handleSaveUrl}
            className="p-3 bg-amber-500/10 border-b border-amber-500/20 flex flex-wrap items-center gap-2 text-xs"
          >
            <span className="font-semibold text-amber-700 dark:text-amber-400">Ссылка на запись:</span>
            <input
              type="url"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="Вставьте ссылку на YouTube или видео (например: https://www.youtube.com/watch?v=...)"
              className="flex-1 min-w-[220px] bg-white dark:bg-[#090a0f] border border-slate-300 dark:border-white/15 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all cursor-pointer"
            >
              Сохранить
            </button>
            {activeUrl && (
              <button
                type="button"
                onClick={handleClearUrl}
                className="px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-300 transition-all cursor-pointer"
              >
                Очистить
              </button>
            )}
          </form>
        )}

        {/* Video / TV Screen Area */}
        <div className="relative bg-black flex items-center justify-center w-full aspect-video max-h-[56vh] overflow-hidden">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={matchTitle || `Реплей ${player1} vs ${player2}`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            // Authentic Retro TV / Arcade Screen Placeholder
            <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden bg-gradient-to-b from-[#090d16] via-[#0b101c] to-[#06080e]">
              {/* Scanline CRT overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45) 1px, transparent 1px, transparent 2px)',
                  backgroundSize: '100% 2px',
                }}
              />

              {/* Glowing TV Monitor Icon */}
              <div className="relative z-10 mb-4 flex items-center justify-center">
                <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-[#141a2b] border border-amber-500/30 flex items-center justify-center text-4xl sm:text-5xl shadow-[0_0_35px_rgba(245,158,11,0.25)]">
                  📺
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#090d16] animate-ping" />
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#090d16]" />
              </div>

              {/* Headline & Explanation */}
              <div className="relative z-10 max-w-md">
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase tracking-widest mb-2">
                  Структура реплея активна
                </span>
                <h4 className="text-lg sm:text-2xl font-black text-white tracking-tight mb-2">
                  Запись матча готовится к загрузке
                </h4>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  В этой ячейке турнира подготовлена ячейка для видеоповтора игры. Когда видеозапись матча будет опубликована, она появится здесь автоматически.
                </p>

                {/* Quick Action Button for User Testing */}
                <div className="mt-5 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setShowConfig(!showConfig)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-105 cursor-pointer flex items-center gap-2"
                  >
                    <span>📺</span>
                    <span>Добавить видеозапись матча</span>
                  </button>
                </div>
              </div>

              {/* Bottom decorative scanline indicators */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[10px] font-mono text-zinc-600">
                <span>CHANNEL: TETRIS-TV-01</span>
                <span>SIGNAL: READY • AWAITING TAPE</span>
                <span>STATUS: 200 OK</span>
              </div>
            </div>
          )}
        </div>

        {/* Match Summary Bar */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-[#121522] border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Match Score Display */}
          <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto justify-center">
            {/* Player 1 */}
            <div className={`text-right ${winner === player1 ? 'font-black text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-zinc-200'}`}>
              <div className="text-sm sm:text-base font-bold flex items-center justify-end gap-1.5">
                {winner === player1 && <span>👑</span>}
                <span>{player1}</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-zinc-500">Участник</span>
            </div>

            {/* Score pill */}
            <div className="px-4 py-1.5 rounded-xl bg-white dark:bg-[#1c2236] border border-amber-500/30 flex items-center gap-2.5 shadow-xs">
              <span className={`text-lg sm:text-2xl font-black ${score1 !== null && score2 !== null && score1 > score2 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-zinc-300'}`}>
                {score1 ?? '—'}
              </span>
              <span className="text-slate-400 dark:text-zinc-600 font-bold">:</span>
              <span className={`text-lg sm:text-2xl font-black ${score1 !== null && score2 !== null && score2 > score1 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-zinc-300'}`}>
                {score2 ?? '—'}
              </span>
            </div>

            {/* Player 2 */}
            <div className={`text-left ${winner === player2 ? 'font-black text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-zinc-200'}`}>
              <div className="text-sm sm:text-base font-bold flex items-center gap-1.5">
                <span>{player2}</span>
                {winner === player2 && <span>👑</span>}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-zinc-500">Участник</span>
            </div>
          </div>

          {/* Winner announcement badge */}
          {winner && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-bold">
              <span>🏆 Победитель:</span>
              <span className="text-slate-900 dark:text-white font-extrabold">{winner}</span>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
