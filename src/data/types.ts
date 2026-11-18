// Core domain types for the RSO NFL data layer.
// Everything the UI renders is described here; pages read these via api.ts.

export type Conference = "AFC" | "NFC";
export type Division = "North" | "South" | "East" | "West";
export type Position =
  | "QB"
  | "RB"
  | "WR"
  | "TE"
  | "EDGE"
  | "DT"
  | "LB"
  | "CB"
  | "S";

export type RankingSource = "media" | "rso" | "fan";
export type GameStatus = "scheduled" | "live" | "final";
export type InjuryStatus =
  | "healthy"
  | "questionable"
  | "doubtful"
  | "out"
  | "ir";

export const POSITIONS: Position[] = [
  "QB",
  "RB",
  "WR",
  "TE",
  "EDGE",
  "DT",
  "LB",
  "CB",
  "S",
];

export const OFFENSE_POSITIONS: Position[] = ["QB", "RB", "WR", "TE"];
export const DEFENSE_POSITIONS: Position[] = ["EDGE", "DT", "LB", "CB", "S"];

export interface WinLossRecord {
  wins: number;
  losses: number;
  ties: number;
}

export interface Team {
  id: string; // short code, e.g. "KC"
  city: string;
  name: string;
  abbreviation: string;
  conference: Conference;
  division: Division;
  logoPath: string;
  primaryColor: string;
  secondaryColor: string;
  record: WinLossRecord;
  homeRecord: WinLossRecord;
  awayRecord: WinLossRecord;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  strengthOfSchedule: number; // ~0.5; higher = tougher slate
}

// One flat bag of optional stat fields shared by all positions.
// Counting stats and the derived rate metrics the scoring engine needs both
// live here so consumers never have to recompute them.
export interface PlayerStats {
  gamesPlayed?: number;

  // Passing
  passAttempts?: number;
  passCompletions?: number;
  passYds?: number;
  passTD?: number;
  interceptionsThrown?: number;
  completionPct?: number;
  passerRating?: number;
  yardsPerAttempt?: number;

  // Rushing
  rushAttempts?: number;
  rushYds?: number;
  rushTD?: number;
  yardsPerCarry?: number;

  // Receiving
  targets?: number;
  receptions?: number;
  recYds?: number;
  recTD?: number;
  yardsPerReception?: number;
  catchRate?: number;

  // Shared offense
  fumbles?: number;
  scrimmageYds?: number;
  totalTD?: number;

  // Defense
  soloTackles?: number;
  assistedTackles?: number;
  totalTackles?: number;
  tacklesForLoss?: number;
  sacks?: number;
  qbHits?: number;
  forcedFumbles?: number;
  fumbleRecoveries?: number;
  passesDefended?: number;
  interceptions?: number; // defensive interceptions
  defTD?: number;
  safeties?: number;
  runStops?: number;
  passerRatingAllowed?: number; // lower is better
  completionPctAllowed?: number; // lower is better
}

export interface Player {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  headshotPath: string;
  teamId: string; // "FA" for free agents
  position: Position;
  jerseyNumber: number;
  age: number;
  yearsPro: number;
  injuryStatus: InjuryStatus;
  isFreeAgent: boolean;
  /** Average annual value of the player's active contract, in $M (OverTheCap). */
  capHit?: number;
  seasonStats: PlayerStats;
  careerStats: PlayerStats;
}

export interface LiveLeader {
  playerId: string;
  statLine: string; // e.g. "243 YDS, 2 TD"
}

export interface Game {
  id: string;
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  status: GameStatus;
  homeScore: number;
  awayScore: number;
  quarter?: number; // 1-4 (5 = OT) while live/final
  clock?: string; // "07:21"
  kickoff: string; // display string, e.g. "Sun 1:00 PM"
  gameday?: string; // ISO date, e.g. "2026-11-22"
  spread: number; // home perspective; negative = home favored
  overUnder: number;
  moneyline: { home: number; away: number };
  liveWinProbability?: { home: number; away: number }; // 0-100, sums ~100
  liveLeaders?: {
    passing?: LiveLeader;
    rushing?: LiveLeader;
    receiving?: LiveLeader;
  };
  // Precomputed per-team stat leaders for the score card (real box-score data).
  cardLeaders?: { home: TeamGameLeaders; away: TeamGameLeaders };
}

export interface RankingEntry {
  playerId: string;
  rank: number;
  score: number;
}

export interface Ranking {
  position: Position;
  source: RankingSource;
  week: number;
  entries: RankingEntry[];
}

export interface FantasyPlayerWeek {
  playerId: string;
  position: Position;
  week: number;
  fantasyPoints: number;
}

export type WaiverTrend = "up" | "down" | "flat";

export interface WaiverPlayer {
  playerId: string;
  recentPPG: number; // PPR average over the last three scored weeks
  seasonPPG: number; // PPR average across the season so far
  trend: WaiverTrend; // recent form against the season average
}

// --- Live game detail (box score, play-by-play, animated field) -------------

export interface GameStatLine {
  playerId: string;
  // passing
  completions?: number;
  attempts?: number;
  passYds?: number;
  passTD?: number;
  passInt?: number;
  // rushing
  carries?: number;
  rushYds?: number;
  rushTD?: number;
  // receiving
  targets?: number;
  receptions?: number;
  recYds?: number;
  recTD?: number;
  // defense
  tackles?: number;
  sacks?: number;
  defInt?: number;
}

export type StatCategory = "passing" | "rushing" | "receiving" | "defense";

export interface TeamBoxScore {
  teamId: string;
  passing: GameStatLine[];
  rushing: GameStatLine[];
  receiving: GameStatLine[];
  defense: GameStatLine[];
}

export interface GameLeader {
  playerId: string;
  statLine: string;
}

export interface TeamGameLeaders {
  passing?: GameLeader;
  rushing?: GameLeader;
  receiving?: GameLeader;
}

export type PlayType = "pass" | "run" | "sack";

export interface PlayByPlay {
  id: string;
  quarter: number;
  clock: string;
  possessionTeamId: string; // the offense on this play
  down?: number;
  distance?: number;
  // Absolute field positions 0–100: 0 = away end zone (left), 100 = home (right).
  yardLineAbs: number; // line of scrimmage at the snap
  endAbs: number; // ball position after the play
  airEndAbs?: number; // pass: catch point (completed) or target (incomplete)
  completed?: boolean; // pass result
  description: string;
  yards: number;
  scoring: boolean;
  playType: PlayType;
}

export interface GameDetail {
  gameId: string;
  boxScore: { home: TeamBoxScore; away: TeamBoxScore };
  leaders: { home: TeamGameLeaders; away: TeamGameLeaders };
  plays: PlayByPlay[];
}
