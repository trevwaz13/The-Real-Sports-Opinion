import { GAMES } from "./games";
import { PLAYERS } from "./players";
import { TEAMS_BY_ID } from "./teams";
import gameStatsData from "./real/gameStats.json";
import type {
  Game,
  GameDetail,
  GameStatLine,
  PlayByPlay,
  Player,
  TeamBoxScore,
  TeamGameLeaders,
} from "./types";

// Real per-game box scores come from weekly player stats (nflverse), keyed by
// `${week}-${teamAbbr}`. Leaders derive from the box score. The play-by-play /
// animated-field track is an illustrative deterministic simulation using the
// two teams' real players.

const GAME_STATS = gameStatsData as unknown as Record<string, GameStatLine[]>;

function num(v: number | undefined) {
  return v ?? 0;
}

function buildTeamBox(week: number, teamId: string): TeamBoxScore {
  const lines = GAME_STATS[`${week}-${teamId}`] ?? [];
  const passing = lines
    .filter((l) => l.attempts)
    .sort((a, b) => num(b.passYds) - num(a.passYds));
  const rushing = lines
    .filter((l) => l.carries)
    .sort((a, b) => num(b.rushYds) - num(a.rushYds))
    .slice(0, 6);
  const receiving = lines
    .filter((l) => l.receptions || l.targets)
    .sort((a, b) => num(b.recYds) - num(a.recYds))
    .slice(0, 8);
  const defense = lines
    .filter((l) => l.tackles || l.sacks || l.defInt)
    .sort((a, b) => num(b.tackles) - num(a.tackles))
    .slice(0, 8);
  return { teamId, passing, rushing, receiving, defense };
}

function leadersFromBox(box: TeamBoxScore): TeamGameLeaders {
  const leaders: TeamGameLeaders = {};
  const p = box.passing[0];
  if (p)
    leaders.passing = {
      playerId: p.playerId,
      statLine: `${p.completions}/${p.attempts}, ${p.passYds} YDS, ${num(p.passTD)} TD`,
    };
  const r = box.rushing[0];
  if (r)
    leaders.rushing = {
      playerId: r.playerId,
      statLine: `${r.carries} CAR, ${r.rushYds} YDS, ${num(r.rushTD)} TD`,
    };
  const rec = box.receiving[0];
  if (rec)
    leaders.receiving = {
      playerId: rec.playerId,
      statLine: `${rec.receptions} REC, ${rec.recYds} YDS, ${num(rec.recTD)} TD`,
    };
  return leaders;
}

// ---------------------------------------------------------------------------
// Illustrative play-by-play (deterministic per game, using real players).
// ---------------------------------------------------------------------------
function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
class Rng {
  next: () => number;
  constructor(seed: string) {
    this.next = mulberry32(hashString(seed));
  }
  int(min: number, max: number) {
    return Math.floor(min + this.next() * (max - min + 1));
  }
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

function teamPlayers(teamId: string, position: Player["position"]) {
  return PLAYERS.filter((p) => p.teamId === teamId && p.position === position);
}
function shortName(p?: Player) {
  return p ? `${p.firstName[0]}.${p.lastName}` : "";
}
function fmtClock(sec: number) {
  const s = Math.max(0, sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function simulatePlays(game: Game): PlayByPlay[] {
  const rng = new Rng(`${game.id}-pbp`);
  const away = TEAMS_BY_ID[game.awayTeamId];
  const home = TEAMS_BY_ID[game.homeTeamId];
  const rosters = {
    away: {
      qb: teamPlayers(away.id, "QB")[0],
      rbs: teamPlayers(away.id, "RB").slice(0, 2),
      recs: [...teamPlayers(away.id, "WR").slice(0, 3), ...teamPlayers(away.id, "TE").slice(0, 1)],
    },
    home: {
      qb: teamPlayers(home.id, "QB")[0],
      rbs: teamPlayers(home.id, "RB").slice(0, 2),
      recs: [...teamPlayers(home.id, "WR").slice(0, 3), ...teamPlayers(home.id, "TE").slice(0, 1)],
    },
  };

  const plays: PlayByPlay[] = [];
  let possession: "away" | "home" = rng.next() < 0.5 ? "away" : "home";
  let ballAbs = possession === "away" ? 25 : 75;
  let down = 1;
  let distance = 10;
  let quarter = 1;
  let secondsLeft = 900;
  const totalPlays = rng.int(18, 26);

  for (let i = 0; i < totalPlays && quarter <= 4; i++) {
    const side = possession;
    const team = side === "away" ? away : home;
    const roster = rosters[side];
    const dir = side === "away" ? 1 : -1;
    const qb = roster.qb;
    const rb = roster.rbs.length ? rng.pick(roster.rbs) : undefined;
    const rec = roster.recs.length ? rng.pick(roster.recs) : undefined;
    const losAbs = ballAbs;

    const roll = rng.next();
    let yards = 0;
    let description = "";
    let playType: PlayByPlay["playType"] = "run";
    let airYards: number | undefined;
    let completed: boolean | undefined;

    if (roll < 0.52 && qb && rec) {
      playType = "pass";
      airYards = rng.int(-2, 22);
      if (rng.next() < 0.62) {
        completed = true;
        yards = airYards + rng.int(0, 11);
        description = `${shortName(qb)} pass complete to ${shortName(rec)} for ${yards} yds`;
      } else {
        completed = false;
        description = `${shortName(qb)} pass incomplete to ${shortName(rec)}`;
      }
    } else if (roll < 0.86 && rb) {
      yards = rng.int(-2, 15);
      description = `${shortName(rb)} ${yards < 0 ? "stuffed for" : "rush for"} ${yards} yds`;
    } else if (qb) {
      playType = "sack";
      yards = -rng.int(3, 9);
      description = `${shortName(qb)} sacked for ${yards} yds`;
    } else {
      yards = rng.int(0, 8);
      description = `${team.abbreviation} rush for ${yards} yds`;
    }

    let endAbs = losAbs + dir * yards;
    let scoring = false;
    if (dir === 1 && endAbs >= 100) {
      scoring = true;
      endAbs = 100;
      description = `TOUCHDOWN ${team.abbreviation}! ${description}`;
    } else if (dir === -1 && endAbs <= 0) {
      scoring = true;
      endAbs = 0;
      description = `TOUCHDOWN ${team.abbreviation}! ${description}`;
    } else {
      endAbs = clamp(endAbs, 2, 98);
    }
    const airEndAbs =
      airYards !== undefined ? clamp(losAbs + dir * airYards, 0, 100) : undefined;

    secondsLeft -= rng.int(25, 45);
    if (secondsLeft < 0) {
      quarter += 1;
      secondsLeft = 900;
    }

    plays.push({
      id: `${game.id}-p${i}`,
      quarter,
      clock: fmtClock(secondsLeft),
      possessionTeamId: team.id,
      down,
      distance,
      yardLineAbs: Math.round(losAbs),
      endAbs: Math.round(endAbs),
      airEndAbs: airEndAbs !== undefined ? Math.round(airEndAbs) : undefined,
      completed,
      description,
      yards,
      scoring,
      playType,
    });

    if (scoring) {
      possession = side === "away" ? "home" : "away";
      ballAbs = possession === "away" ? 25 : 75;
      down = 1;
      distance = 10;
    } else if (distance - yards <= 0) {
      ballAbs = endAbs;
      down = 1;
      distance = 10;
    } else if (down >= 4) {
      possession = side === "away" ? "home" : "away";
      ballAbs = endAbs;
      down = 1;
      distance = 10;
    } else {
      ballAbs = endAbs;
      down += 1;
      distance -= yards;
    }
  }
  return plays;
}

// Built lazily and cached per game id (272 games — don't precompute all).
const cache = new Map<string, GameDetail>();

export function getGameDetailById(gameId: string): GameDetail | undefined {
  if (cache.has(gameId)) return cache.get(gameId);
  const game = GAMES.find((g) => g.id === gameId);
  if (!game) return undefined;
  const home = buildTeamBox(game.week, game.homeTeamId);
  const away = buildTeamBox(game.week, game.awayTeamId);
  const detail: GameDetail = {
    gameId,
    boxScore: { home, away },
    leaders: { home: leadersFromBox(home), away: leadersFromBox(away) },
    plays: simulatePlays(game),
  };
  cache.set(gameId, detail);
  return detail;
}
