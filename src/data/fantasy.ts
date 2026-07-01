import { PLAYERS } from "./players";
import { CURRENT_WEEK } from "./season";
import type {
  FantasyPlayerWeek,
  Player,
  PlayerStats,
  WaiverPlayer,
  WaiverTrend,
} from "./types";

// Weekly fantasy points are derived from each player's per-game season
// production plus a stable per-week jitter, so "highest scorers of the week"
// looks realistic and is consistent across reloads.

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function perGame(stats: PlayerStats, key: keyof PlayerStats): number {
  const total = stats[key] ?? 0;
  const games = stats.gamesPlayed || 17;
  return total / games;
}

// PPR for offense, common IDP scoring for defense.
function weeklyPoints(player: Player): number {
  const s = player.seasonStats;
  let pts = 0;

  if (["QB", "RB", "WR", "TE"].includes(player.position)) {
    pts += perGame(s, "passYds") / 25;
    pts += perGame(s, "passTD") * 4;
    pts -= perGame(s, "interceptionsThrown") * 2;
    pts += perGame(s, "rushYds") / 10;
    pts += perGame(s, "rushTD") * 6;
    pts += perGame(s, "receptions") * 1;
    pts += perGame(s, "recYds") / 10;
    pts += perGame(s, "recTD") * 6;
    pts -= perGame(s, "fumbles") * 2;
  } else {
    pts += perGame(s, "soloTackles") * 1;
    pts += perGame(s, "assistedTackles") * 0.5;
    pts += perGame(s, "sacks") * 2;
    pts += perGame(s, "tacklesForLoss") * 1;
    pts += perGame(s, "interceptions") * 6;
    pts += perGame(s, "passesDefended") * 1;
    pts += perGame(s, "forcedFumbles") * 2;
    pts += perGame(s, "fumbleRecoveries") * 2;
    pts += perGame(s, "defTD") * 6;
  }

  // Stable weekly variance around the per-game average.
  const jitter = ((hashString(player.id + `w${CURRENT_WEEK}`) % 100) - 50) / 12;
  return Math.max(0, Math.round((pts + jitter) * 10) / 10);
}

export const FANTASY_WEEK: FantasyPlayerWeek[] = PLAYERS.filter(
  (p) => !p.isFreeAgent,
).map((p) => ({
  playerId: p.id,
  position: p.position,
  week: CURRENT_WEEK,
  fantasyPoints: weeklyPoints(p),
}));

// Waiver-wire pickups: lower-rostered players trending up/down.
const TRENDS: WaiverTrend[] = ["up", "up", "up", "flat", "down"];

export const WAIVERS: WaiverPlayer[] = PLAYERS.filter(
  (p) =>
    !p.isFreeAgent &&
    ["RB", "WR", "TE", "QB"].includes(p.position),
)
  .map((p) => {
    const seed = hashString(p.id + "waiver");
    return {
      player: p,
      percentRostered: 5 + (seed % 55),
      addPct: 2 + (seed % 40),
      trend: TRENDS[seed % TRENDS.length],
    };
  })
  .filter((w) => w.percentRostered < 55)
  .sort((a, b) => b.addPct - a.addPct)
  .slice(0, 16)
  .map(
    ({ player, percentRostered, addPct, trend }): WaiverPlayer => ({
      playerId: player.id,
      percentRostered,
      addPct,
      trend,
    }),
  );
