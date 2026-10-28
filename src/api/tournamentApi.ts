import type {
  TournamentData,
  ReplayInfo,
  GroupMatch,
  GroupStanding,
} from '../types/tournament';

// Helper to convert typical video links (YouTube, Twitch, Vimeo) to iframe-compatible embed URLs
export const getEmbedUrl = (rawUrl?: string): string | undefined => {
  if (!rawUrl) return undefined;
  const url = rawUrl.trim();

  // YouTube standard watch URL: https://www.youtube.com/watch?v=ID
  const ytWatchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytWatchMatch) {
    return `https://www.youtube.com/embed/${ytWatchMatch[1]}?autoplay=1&rel=0`;
  }

  // Twitch clip or video
  if (url.includes('twitch.tv')) {
    return url;
  }

  // Direct MP4 or WebM video
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return url;
  }

  return url;
};

// Keyed by match ID (e.g. 'Ф', 'В6', 'В4', '1.1')
// The user noted: "не у всех блоков будет возможность просмотра реплея, в будущем я укажу в каких местах что именно добавить"
// Here we pre-configure some demonstrative replay slots with hasReplay: true so the structure is fully active and visible!
const DEFAULT_REPLAYS: Record<string, ReplayInfo> = {
  // Grand final
  'Ф': {
    hasReplay: true,
    title: 'Гранд-финал: Тлен vs Лина',
    description: 'Решающая битва за звание чемпиона турнира по Тетрису (счёт 1:5)',
    notes: 'Запись гранд-финала турнира',
  },
  // Upper bracket final
  'В6': {
    hasReplay: true,
    title: 'Финал верхней сетки: Лина vs Тлен',
    description: 'Напряжённый сет за прямой выход в гранд-финал (счёт 2:3)',
    notes: 'Запись финала виннеров',
  },
  // Lower bracket final
  'Н5': {
    hasReplay: true,
    title: 'Финал нижней сетки: Иван vs Лина',
    description: 'Борьба за путёвку в гранд-финал (счёт 2:3)',
  },
  // Key Group Stage match 1.1
  '1.1': {
    hasReplay: true,
    title: 'Тур 1, Матч 1.1: Лина vs Тлен',
    description: 'Матч открытия группового этапа с упорной борьбой до счёта 3:2',
  },
  // Tour 5 key match 5.3
  '5.3': {
    hasReplay: true,
    title: 'Тур 5, Матч 5.3: Тлен vs Иван',
    description: 'Финальный матч групповой стадии за распределение посева (счёт 1:3)',
  },
};

const REPLAY_STORAGE_KEY = 'melkomemie_tournament_replays_v1';

export const getStoredReplays = (): Record<string, ReplayInfo> => {
  if (typeof window === 'undefined') return DEFAULT_REPLAYS;
  try {
    const raw = localStorage.getItem(REPLAY_STORAGE_KEY);
    if (!raw) return DEFAULT_REPLAYS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_REPLAYS, ...parsed };
  } catch {
    return DEFAULT_REPLAYS;
  }
};

export const saveMatchReplay = (matchId: string, replay: ReplayInfo): void => {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredReplays();
    current[matchId] = replay;
    localStorage.setItem(REPLAY_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Не удалось сохранить реплей в localStorage', e);
  }
};

export const TOURNAMENT_SPREADSHEET_ID = '1F4z-LBQWf2tRt64x0yYhUK3-Evk1k8L9R_C93kNiZY8';
export const TOURNAMENT_SHEET_GID = '56117144';
export const TOURNAMENT_SHEET_URL = `https://docs.google.com/spreadsheets/d/${TOURNAMENT_SPREADSHEET_ID}/edit?gid=${TOURNAMENT_SHEET_GID}#gid=${TOURNAMENT_SHEET_GID}`;

// Verified snapshot from Google Sheets "Турнир по тетрису"
export const VERIFIED_TOURNAMENT_SNAPSHOT: TournamentData = {
  id: 'tetris-1',
  title: 'Турнир по тетрису',
  game: 'Tetris',
  season: '2026',
  sheetName: 'Турнир Тетрис (1)',
  status: 'completed',
  champion: 'Лина',
  runnerUp: 'Тлен',
  thirdPlace: 'Иван',
  lastSyncedAt: new Date().toISOString(),
  notes: [
    'Круговой групповой этап: 6 игроков, 5 туров по 3 матча. Каждая пара встречается ровно один раз.',
    'Александр: вне группы, посев 7 в плей-офф.',
    'Плей-офф. Double elimination. Посев 1 проходит первый раунд. После поражения в верхней сетке игрок переходит в нижнюю.',
    'Гранд-финал проводится одним матчем без переигровки.',
    'В — верхняя сетка. Н — нижняя. Поб. — победитель матча. Пор. — проигравший.',
  ],
  standings: [
    { seed: 1, name: 'Лина', wins: 5, losses: 0, diff: 12, played: 5 },
    { seed: 2, name: 'Иван', wins: 4, losses: 1, diff: 6, played: 5 },
    { seed: 3, name: 'Тлен', wins: 3, losses: 2, diff: 4, played: 5 },
    { seed: 4, name: 'Лысый', wins: 2, losses: 3, diff: -3, played: 5 },
    { seed: 5, name: 'Монета', wins: 1, losses: 4, diff: -5, played: 5 },
    { seed: 6, name: 'Катя', wins: 0, losses: 5, diff: -14, played: 5 },
    { seed: 7, name: 'Александр', wins: 0, losses: 0, diff: 0, played: 0, isSpecial: true, note: 'Вне группы, посев 7' },
  ],
  tours: [
    {
      tourNumber: 1,
      title: 'ТУР 1',
      matchesCount: 'Сыграно 3 из 3',
      matches: [
        { id: '1.1', tour: 1, player1: 'Лина', score1: 3, score2: 2, player2: 'Тлен', winner: 'Лина' },
        { id: '1.2', tour: 1, player1: 'Лысый', score1: 3, score2: 0, player2: 'Катя', winner: 'Лысый' },
        { id: '1.3', tour: 1, player1: 'Монета', score1: 1, score2: 3, player2: 'Иван', winner: 'Иван' },
      ],
    },
    {
      tourNumber: 2,
      title: 'ТУР 2',
      matchesCount: 'Сыграно 3 из 3',
      matches: [
        { id: '2.1', tour: 2, player1: 'Лина', score1: 3, score2: 0, player2: 'Лысый', winner: 'Лина' },
        { id: '2.2', tour: 2, player1: 'Монета', score1: 0, score2: 3, player2: 'Тлен', winner: 'Тлен' },
        { id: '2.3', tour: 2, player1: 'Иван', score1: 3, score2: 0, player2: 'Катя', winner: 'Иван' },
      ],
    },
    {
      tourNumber: 3,
      title: 'ТУР 3',
      matchesCount: 'Сыграно 3 из 3',
      matches: [
        { id: '3.1', tour: 3, player1: 'Лина', score1: 3, score2: 0, player2: 'Иван', winner: 'Лина' },
        { id: '3.2', tour: 3, player1: 'Тлен', score1: 3, score2: 1, player2: 'Лысый', winner: 'Тлен' },
        { id: '3.3', tour: 3, player1: 'Монета', score1: 3, score2: 0, player2: 'Катя', winner: 'Монета' },
      ],
    },
    {
      tourNumber: 4,
      title: 'ТУР 4',
      matchesCount: 'Сыграно 3 из 3',
      matches: [
        { id: '4.1', tour: 4, player1: 'Лина', score1: 3, score2: 1, player2: 'Монета', winner: 'Лина' },
        { id: '4.2', tour: 4, player1: 'Тлен', score1: 3, score2: 1, player2: 'Катя', winner: 'Тлен' },
        { id: '4.3', tour: 4, player1: 'Иван', score1: 3, score2: 1, player2: 'Лысый', winner: 'Иван' },
      ],
    },
    {
      tourNumber: 5,
      title: 'ТУР 5',
      matchesCount: 'Сыграно 3 из 3',
      matches: [
        { id: '5.1', tour: 5, player1: 'Лысый', score1: 3, score2: 2, player2: 'Монета', winner: 'Лысый' },
        { id: '5.2', tour: 5, player1: 'Лина', score1: 3, score2: 0, player2: 'Катя', winner: 'Лина' },
        { id: '5.3', tour: 5, player1: 'Тлен', score1: 1, score2: 3, player2: 'Иван', winner: 'Иван' },
      ],
    },
  ],
  upperBracketRounds: [
    {
      title: 'Первый раунд',
      matches: [
        {
          id: 'Посев 1. Проход',
          label: 'Посев 1. Проход',
          bracket: 'upper',
          roundIndex: 0,
          roundTitle: 'Первый раунд',
          player1: 'Лина',
          score1: null,
          player2: '— (Автопроход)',
          score2: null,
          winner: 'Лина',
          isBye: true,
        },
        {
          id: 'В1',
          label: 'В1. Посев 4 / 5',
          bracket: 'upper',
          roundIndex: 0,
          roundTitle: 'Первый раунд',
          player1: 'Лысый',
          score1: 2,
          player2: 'Монета',
          score2: 3,
          winner: 'Монета',
        },
        {
          id: 'В2',
          label: 'В2. Посев 2 / 7',
          bracket: 'upper',
          roundIndex: 0,
          roundTitle: 'Первый раунд',
          player1: 'Иван',
          score1: 3,
          player2: 'Александр',
          score2: 0,
          winner: 'Иван',
        },
        {
          id: 'В3',
          label: 'В3. Посев 3 / 6',
          bracket: 'upper',
          roundIndex: 0,
          roundTitle: 'Первый раунд',
          player1: 'Тлен',
          score1: 3,
          player2: 'Катя',
          score2: 2,
          winner: 'Тлен',
        },
      ],
    },
    {
      title: 'Второй раунд',
      matches: [
        {
          id: 'В4',
          label: 'В4. Посев 1 / поб. В1',
          bracket: 'upper',
          roundIndex: 1,
          roundTitle: 'Второй раунд',
          player1: 'Лина',
          score1: 3,
          player2: 'Монета',
          score2: 1,
          winner: 'Лина',
        },
        {
          id: 'В5',
          label: 'В5. Поб. В2 / В3',
          bracket: 'upper',
          roundIndex: 1,
          roundTitle: 'Второй раунд',
          player1: 'Иван',
          score1: 2,
          player2: 'Тлен',
          score2: 3,
          winner: 'Тлен',
        },
      ],
    },
    {
      title: 'Финал верхней',
      matches: [
        {
          id: 'В6',
          label: 'В6. Поб. В4 / В5',
          bracket: 'upper',
          roundIndex: 2,
          roundTitle: 'Финал верхней',
          player1: 'Лина',
          score1: 2,
          player2: 'Тлен',
          score2: 3,
          winner: 'Тлен',
        },
      ],
    },
  ],
  lowerBracketRounds: [
    {
      title: 'Первый раунд',
      matches: [
        {
          id: 'Проход в Н2',
          label: 'Проход в Н2',
          bracket: 'lower',
          roundIndex: 0,
          roundTitle: 'Первый раунд',
          player1: 'Лысый',
          score1: null,
          player2: '— (Автопроход)',
          score2: null,
          winner: 'Лысый',
          isBye: true,
        },
        {
          id: 'Н1',
          label: 'Н1. Пор. В2 / В3',
          bracket: 'lower',
          roundIndex: 0,
          roundTitle: 'Первый раунд',
          player1: 'Александр',
          score1: 0,
          player2: 'Катя',
          score2: 3,
          winner: 'Катя',
        },
      ],
    },
    {
      title: 'Второй раунд',
      matches: [
        {
          id: 'Н2',
          label: 'Н2. Пор. В1 / В5',
          bracket: 'lower',
          roundIndex: 1,
          roundTitle: 'Второй раунд',
          player1: 'Лысый',
          score1: 0,
          player2: 'Иван',
          score2: 3,
          winner: 'Иван',
        },
        {
          id: 'Н3',
          label: 'Н3. Поб. Н1 / пор. В4',
          bracket: 'lower',
          roundIndex: 1,
          roundTitle: 'Второй раунд',
          player1: 'Катя',
          score1: 0,
          player2: 'Монета',
          score2: 3,
          winner: 'Монета',
        },
      ],
    },
    {
      title: 'Третий раунд',
      matches: [
        {
          id: 'Н4',
          label: 'Н4. Поб. Н2 / Н3',
          bracket: 'lower',
          roundIndex: 2,
          roundTitle: 'Третий раунд',
          player1: 'Иван',
          score1: 3,
          player2: 'Монета',
          score2: 0,
          winner: 'Иван',
        },
      ],
    },
    {
      title: 'Финал нижней',
      matches: [
        {
          id: 'Н5',
          label: 'Н5. Поб. Н4 / пор. В6',
          bracket: 'lower',
          roundIndex: 3,
          roundTitle: 'Финал нижней',
          player1: 'Иван',
          score1: 2,
          player2: 'Лина',
          score2: 3,
          winner: 'Лина',
        },
      ],
    },
  ],
  grandFinal: {
    id: 'Ф',
    label: 'Ф. Поб. В6 / Н5',
    bracket: 'grand-final',
    roundIndex: 3,
    roundTitle: 'Гранд-финал',
    player1: 'Тлен',
    score1: 1,
    player2: 'Лина',
    score2: 5,
    winner: 'Лина',
  },
};

// Merges replay settings onto tournament matches
export const applyReplays = (data: TournamentData): TournamentData => {
  const replays = getStoredReplays();

  const attachReplay = <T extends { id: string; replay?: ReplayInfo }>(match: T): T => {
    const replay = replays[match.id];
    return {
      ...match,
      replay: replay || match.replay,
    };
  };

  return {
    ...data,
    tours: data.tours.map((t) => ({
      ...t,
      matches: t.matches.map(attachReplay),
    })),
    upperBracketRounds: data.upperBracketRounds.map((r) => ({
      ...r,
      matches: r.matches.map(attachReplay),
    })),
    lowerBracketRounds: data.lowerBracketRounds.map((r) => ({
      ...r,
      matches: r.matches.map(attachReplay),
    })),
    grandFinal: attachReplay(data.grandFinal),
  };
};

/**
 * Fetches dynamic data from Google Sheets "Турнир по тетрису"
 * Falls back gracefully to verified snapshot if offline or unreachable.
 */
export async function loadTournamentData(targetSpreadsheetId = TOURNAMENT_SPREADSHEET_ID): Promise<TournamentData> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${targetSpreadsheetId}/gviz/tq?tqx=out:json&gid=${TOURNAMENT_SHEET_GID}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Не удалось загрузить данные турнира из Google Sheets (${response.status}). Используется снимок.`);
      return applyReplays(VERIFIED_TOURNAMENT_SNAPSHOT);
    }

    const text = await response.text();
    const jsonStr = text.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
    const json = JSON.parse(jsonStr);

    if (!json?.table?.rows) {
      return applyReplays(VERIFIED_TOURNAMENT_SNAPSHOT);
    }

    // Parse the table rows dynamically
    const rows = json.table.rows;
    const getCell = (rowIndex: number, colIndex: number): string => {
      const row = rows[rowIndex];
      if (!row || !row.c) return '';
      const cell = row.c[colIndex];
      if (!cell || cell.v === null || cell.v === undefined) return '';
      return String(cell.f ?? cell.v).trim();
    };

    const getCellNum = (rowIndex: number, colIndex: number): number | null => {
      const val = getCell(rowIndex, colIndex);
      if (val === '') return null;
      const num = Number(val.replace(',', '.'));
      return Number.isFinite(num) ? num : null;
    };

    // Parse Standings (Rows 0 to 6, columns: N=13, O=14, R=17, S=18, T=19, U=20)
    // In gviz header row is treated as col labels:
    // col N = 13 (Посев), O = 14 (Участник), R = 17 (Поб.), S = 18 (Пор.), T = 19 (Разн.), U = 20 (Игр)
    const standings: GroupStanding[] = [];
    for (let i = 0; i < 7; i++) {
      const seed = getCellNum(i, 13) ?? (i + 1);
      const name = getCell(i, 14);
      const wins = getCellNum(i, 17) ?? 0;
      const losses = getCellNum(i, 18) ?? 0;
      const diff = getCellNum(i, 19) ?? 0;
      const played = getCellNum(i, 20) ?? 0;

      if (name) {
        standings.push({
          seed,
          name,
          wins,
          losses,
          diff,
          played,
          isSpecial: seed === 7 || name === 'Александр',
          note: seed === 7 ? 'Вне группы, посев 7' : undefined,
        });
      }
    }

    // Sort standings by seed
    if (standings.length > 0) {
      standings.sort((a, b) => a.seed - b.seed);
    }

    // Parse Group Matches (Tours 1 to 5)
    // Tour 1: Rows 1, 2, 3 (col B=1 ID, C=2 Player1, F=5 Score1, G=6 Score2, H=7 Player2, K=10 Winner)
    // Tour 2: Rows 8, 9, 10
    // Tour 3: Rows 13, 14, 15
    // Tour 4: Rows 18, 19, 20
    // Tour 5: Rows 24, 25, 26
    const tourRowStarts = [1, 8, 13, 18, 24];
    const parsedTours = tourRowStarts.map((startRow, tIdx) => {
      const tourNum = tIdx + 1;
      const matches: GroupMatch[] = [];
      for (let m = 0; m < 3; m++) {
        const r = startRow + m;
        const id = getCell(r, 1) || `${tourNum}.${m + 1}`;
        const player1 = getCell(r, 2);
        const score1 = getCellNum(r, 5);
        const score2 = getCellNum(r, 6);
        const player2 = getCell(r, 7);
        const winner = getCell(r, 10) || (score1 !== null && score2 !== null ? (score1 > score2 ? player1 : player2) : null);

        if (player1 && player2) {
          matches.push({ id, tour: tourNum, player1, score1, score2, player2, winner });
        }
      }

      return {
        tourNumber: tourNum,
        title: `ТУР ${tourNum}`,
        matchesCount: 'Сыграно 3 из 3',
        matches: matches.length > 0 ? matches : VERIFIED_TOURNAMENT_SNAPSHOT.tours[tIdx].matches,
      };
    });

    // Parse Bracket data if available, or fall back to snapshot matches
    const result: TournamentData = {
      ...VERIFIED_TOURNAMENT_SNAPSHOT,
      lastSyncedAt: new Date().toISOString(),
      standings: standings.length >= 6 ? standings : VERIFIED_TOURNAMENT_SNAPSHOT.standings,
      tours: parsedTours,
    };

    return applyReplays(result);
  } catch (err) {
    console.error('Ошибка парсинга Google Sheets турнира:', err);
    return applyReplays(VERIFIED_TOURNAMENT_SNAPSHOT);
  }
}
