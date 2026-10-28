export interface ReplayInfo {
  hasReplay: boolean;
  videoUrl?: string;
  embedUrl?: string;
  title?: string;
  description?: string;
  duration?: string;
  notes?: string;
  recordedAt?: string;
}

export interface GroupMatch {
  id: string; // e.g. '1.1', '2.3'
  tour: number;
  player1: string;
  score1: number | null;
  score2: number | null;
  player2: string;
  winner: string | null;
  replay?: ReplayInfo;
}

export interface GroupStanding {
  seed: number;
  name: string;
  wins: number;
  losses: number;
  diff: number;
  played: number;
  isSpecial?: boolean;
  note?: string;
}

export interface BracketMatch {
  id: string; // e.g. 'В1', 'В4', 'Н2', 'Ф', 'Посев 1. Проход'
  label: string; // e.g. 'В1. Посев 4 / 5', 'В4. Посев 1 / поб. В1'
  bracket: 'upper' | 'lower' | 'grand-final';
  roundIndex: number; // 0..3
  roundTitle: string; // 'Первый раунд', 'Второй раунд', 'Финал верхней', 'Гранд-финал'
  player1: string;
  score1: number | null;
  player2: string;
  score2: number | null;
  winner: string | null;
  isBye?: boolean;
  replay?: ReplayInfo;
}

export interface TournamentRound {
  tourNumber: number;
  title: string;
  matchesCount: string;
  matches: GroupMatch[];
}

export interface BracketRound {
  title: string;
  matches: BracketMatch[];
}

export interface TournamentData {
  id: string;
  title: string;
  game: string;
  season?: string;
  sheetName: string;
  status: 'completed' | 'ongoing';
  champion: string;
  runnerUp: string;
  thirdPlace?: string;
  tours: TournamentRound[];
  standings: GroupStanding[];
  upperBracketRounds: BracketRound[];
  lowerBracketRounds: BracketRound[];
  grandFinal: BracketMatch;
  notes: string[];
  lastSyncedAt?: string;
}
