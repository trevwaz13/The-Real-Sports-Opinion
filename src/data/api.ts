// The data-access surface. Components and pages call ONLY these functions —
// never the raw seed modules. Today they return typed mock data; swapping in a
// real NFL API later means changing only this folder.
//
// Split by ownership:
//   - NFL data (teams, players, games, standings, stats) → mock here, later a
//     real sports API.
//   - User/editor data (fan rankings, media rankings, fantasy teams) → moves to
//     Supabase in Phase 2.5 while keeping these same signatures.

import { rankByRso, scorePlayer } from "@/lib/rsoScoring";
import { rankTeamsByPower } from "@/lib/teamPower";
import {
  FANTASY_WEEK,
  FANTASY_WEEK_NUMBER,
  SCORED_WEEKS,
  WAIVERS,
  fantasyWeek,
} from "./fantasy";
import { GAMES } from "./games";
import { getGameDetailById } from "./gameDetails";
import { NEWS, type NewsCategory, type NewsItem } from "./news";
import { PLAYERS, PLAYERS_BY_ID } from "./players";
import { RANKED_SPOTS, RANKINGS } from "./rankings";
import { CURRENT_WEEK, LAST_COMPLETED_WEEK } from "./season";
import { TEAMS, TEAMS_BY_ID } from "./teams";
import {
  POSITIONS,
  type Conference,
  type Division,
  type FantasyPlayerWeek,
  type Game,
  type GameDetail,
  type Player,
  type PlayerStats,
  type Position,
  type Ranking,
  type RankingSource,
  type Team,
  type WaiverPlayer,
} from "./types";

export type {
  Team,
  Player,
  Game,
  GameDetail,
  Ranking,
  FantasyPlayerWeek,
  WaiverPlayer,
};

// Standings can be scoped league-wide, by conference, or by a single division.
export type StandingsScope =
  | "NFL"
  | Conference
  | `${Conference} ${Division}`;

// --- Teams ------------------------------------------------------------------

export function getTeams(): Team[] {
  return TEAMS;
}

export function getTeam(id: string): Team | undefined {
  return TEAMS_BY_ID[id];
}

function winPct(team: Team): number {
  const { wins, losses, ties } = team.record;
  const games = wins + losses + ties;
  return games === 0 ? 0 : (wins + 0.5 * ties) / games;
}

/** Standings for a scope, ordered by win% then point differential. */
export function getStandings(scope: StandingsScope = "NFL"): Team[] {
  let teams = TEAMS;
  if (scope !== "NFL") {
    const [conference, division] = scope.split(" ") as [
      Conference,
      Division | undefined,
    ];
    teams = teams.filter(
      (t) =>
        t.conference === conference &&
        (division ? t.division === division : true),
    );
  }
  return [...teams].sort(
    (a, b) => winPct(b) - winPct(a) || b.pointDifferential - a.pointDifferential,
  );
}

// --- Power rankings ---------------------------------------------------------

export type PowerSource = "rso" | "media";

export interface PowerRankingEntry {
  teamId: string;
  rank: number;
  score: number;
  movement: number; // + up, - down, 0 same (vs last week)
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Two power rankings only:
//   - "rso"   → computed live by the team-power engine (win% + SOS)
//   - "media" → editor-set (mocked here until Supabase media_power_rankings)
// Movement vs last week is a stable per-team value for now.
export function getPowerRanking(source: PowerSource = "rso"): PowerRankingEntry[] {
  let ordered: { teamId: string; score: number }[];

  if (source === "rso") {
    ordered = rankTeamsByPower(TEAMS).map((s) => ({
      teamId: s.teamId,
      score: s.total,
    }));
  } else {
    ordered = TEAMS.map((t) => ({
      teamId: t.id,
      // Media leans on record with its own editorial nudge.
      score:
        Math.round(
          (winPct(t) * 100 + ((hashStr(t.id + "media") % 16) - 8)) * 10,
        ) / 10,
    })).sort((a, b) => b.score - a.score);
  }

  return ordered.map((o, i) => ({
    teamId: o.teamId,
    rank: i + 1,
    score: o.score,
    movement: (hashStr(o.teamId + source + "mv") % 7) - 3,
  }));
}

// --- Players ----------------------------------------------------------------

export function getPlayers(): Player[] {
  return PLAYERS;
}

export function getPlayer(id: string): Player | undefined {
  return PLAYERS_BY_ID[id];
}

export function getPlayersByTeam(teamId: string): Player[] {
  return PLAYERS.filter((p) => p.teamId === teamId);
}

export function getPlayersByPosition(position: Position): Player[] {
  return PLAYERS.filter((p) => p.position === position && !p.isFreeAgent);
}

/** Roster for a team, grouped by position. */
export function getRoster(teamId: string): Record<Position, Player[]> {
  const roster = {} as Record<Position, Player[]>;
  for (const p of getPlayersByTeam(teamId)) {
    (roster[p.position] ??= []).push(p);
  }
  return roster;
}

export function getFreeAgents(position?: Position): Player[] {
  return PLAYERS.filter(
    (p) => p.isFreeAgent && (position ? p.position === position : true),
  );
}

/** Top available free agents, ranked by RSO score. */
export function getTopFreeAgents(position?: Position, limit = 10): Player[] {
  return getFreeAgents(position)
    .map((player) => ({ player, score: scorePlayer(player).total }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.player);
}

// --- Games ------------------------------------------------------------------

export function getGames(week: number = CURRENT_WEEK): Game[] {
  return GAMES.filter((g) => g.week === week);
}

/** All regular-season games (used by the week-switching scores module). */
export function getAllGames(): Game[] {
  return GAMES;
}

/** Regular-season weeks that have games (1–18). */
export function getGameWeeks(): number[] {
  return [...new Set(GAMES.map((g) => g.week))].sort((a, b) => a - b);
}

export function getGame(id: string): Game | undefined {
  return GAMES.find((g) => g.id === id);
}

export function getLiveGames(week: number = CURRENT_WEEK): Game[] {
  return getGames(week).filter((g) => g.status === "live");
}

/** Weeks that already have final scores. */
export function getCompletedWeeks(): number[] {
  return [...new Set(GAMES.filter((g) => g.status === "final").map((g) => g.week))].sort(
    (a, b) => a - b,
  );
}

/** The newest week with results, used as the default "latest scores" view. */
export function getLatestScoredWeek(): number {
  return LAST_COMPLETED_WEEK || getCompletedWeeks().slice(-1)[0] || 1;
}

/** Full game detail — box score, per-team leaders, and play-by-play. */
export function getGameDetail(gameId: string): GameDetail | undefined {
  return getGameDetailById(gameId);
}

// --- Rankings ---------------------------------------------------------------

// RSO Official rankings are generated live by the Phase 3 scoring engine.
// Built once per position and cached. (Media stays editor-set; Fan comes from
// votes — both still served from the mock RANKINGS map for now.)
const RSO_RANKINGS: Record<Position, Ranking> = Object.fromEntries(
  POSITIONS.map((position) => [
    position,
    {
      position,
      source: "rso" as RankingSource,
      week: CURRENT_WEEK,
      entries: rankByRso(PLAYERS, position).slice(0, RANKED_SPOTS),
    },
  ]),
) as Record<Position, Ranking>;

export function getRankings(
  position: Position,
  source: RankingSource,
): Ranking | undefined {
  if (source === "rso") return RSO_RANKINGS[position];
  return RANKINGS[source]?.[position];
}

// --- Stats leaders ----------------------------------------------------------

export interface StatLeader {
  player: Player;
  value: number;
}

/** Top rostered players by a single season stat key. */
export function getStatLeaders(
  statKey: keyof PlayerStats,
  limit = 3,
): StatLeader[] {
  return PLAYERS.filter((p) => !p.isFreeAgent)
    .map((player) => ({
      player,
      value: player.seasonStats[statKey] ?? 0,
    }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

// --- News & injuries --------------------------------------------------------

const INJURY_SEVERITY: Record<string, number> = {
  ir: 4,
  out: 3,
  doubtful: 2,
  questionable: 1,
  healthy: 0,
};

export function getNews(category?: NewsCategory): NewsItem[] {
  return category ? NEWS.filter((n) => n.category === category) : NEWS;
}

/** Rostered players carrying an injury designation, most severe first. */
export function getInjuredPlayers(limit = 8): Player[] {
  return PLAYERS.filter((p) => !p.isFreeAgent && p.injuryStatus !== "healthy")
    .sort(
      (a, b) =>
        (INJURY_SEVERITY[b.injuryStatus] ?? 0) -
        (INJURY_SEVERITY[a.injuryStatus] ?? 0),
    )
    .slice(0, limit);
}

// --- Fantasy ----------------------------------------------------------------

export function getFantasyWeek(
  week: number = FANTASY_WEEK_NUMBER,
): FantasyPlayerWeek[] {
  return week === FANTASY_WEEK_NUMBER ? FANTASY_WEEK : fantasyWeek(week);
}

/** Highest weekly fantasy scorers, optionally filtered to one position. */
export function getFantasyLeaders(
  position?: Position,
  limit = 10,
  week: number = FANTASY_WEEK_NUMBER,
): FantasyPlayerWeek[] {
  return getFantasyWeek(week)
    .filter((f) => (position ? f.position === position : true))
    .slice(0, limit);
}

/** Weeks with real fantasy scoring, newest first. */
export function getFantasyWeeks(): number[] {
  return SCORED_WEEKS;
}

/** Season-long fantasy totals per player, highest first. */
export function getFantasySeasonLeaders(
  position?: Position,
  limit = 25,
): { playerId: string; total: number; games: number; average: number }[] {
  const totals = new Map<string, { total: number; games: number }>();
  for (const week of SCORED_WEEKS) {
    for (const row of getFantasyWeek(week)) {
      const prev = totals.get(row.playerId) ?? { total: 0, games: 0 };
      prev.total += row.fantasyPoints;
      prev.games += 1;
      totals.set(row.playerId, prev);
    }
  }
  return [...totals.entries()]
    .filter(([playerId]) => {
      const player = PLAYERS_BY_ID[playerId];
      return player && (position ? player.position === position : true);
    })
    .map(([playerId, { total, games }]) => ({
      playerId,
      total: Math.round(total * 10) / 10,
      games,
      average: Math.round((total / games) * 10) / 10,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export function getWaivers(limit = 16): WaiverPlayer[] {
  return WAIVERS.slice(0, limit);
}
