import { PLAYERS_BY_ID } from "./players";
import { CURRENT_WEEK, LAST_COMPLETED_WEEK } from "./season";
import fantasyData from "./real/fantasy.json";
import type { FantasyPlayerWeek, WaiverPlayer, WaiverTrend } from "./types";

// Real PPR fantasy points per player per week, straight from the weekly
// nflverse box scores (see scripts/fetch_nfl_data.py). Keyed by week number.

const BY_WEEK = fantasyData as Record<string, Record<string, number>>;

/** Every scoring player in a given week, highest first. */
export function fantasyWeek(week: number): FantasyPlayerWeek[] {
  const rows = BY_WEEK[String(week)] ?? {};
  return Object.entries(rows)
    .map(([playerId, fantasyPoints]) => {
      const player = PLAYERS_BY_ID[playerId];
      return player
        ? { playerId, position: player.position, week, fantasyPoints }
        : null;
    })
    .filter((row): row is FantasyPlayerWeek => row !== null)
    .sort((a, b) => b.fantasyPoints - a.fantasyPoints);
}

/** Weeks that have scoring data, newest first. */
export const SCORED_WEEKS: number[] = Object.keys(BY_WEEK)
  .map(Number)
  .sort((a, b) => b - a);

/** The most recent week with real scoring (what the home module shows). */
export const FANTASY_WEEK_NUMBER = SCORED_WEEKS[0] ?? LAST_COMPLETED_WEEK ?? CURRENT_WEEK;

export const FANTASY_WEEK: FantasyPlayerWeek[] = fantasyWeek(FANTASY_WEEK_NUMBER);

function average(values: number[]): number {
  return values.length
    ? values.reduce((sum, v) => sum + v, 0) / values.length
    : 0;
}

// Waiver watch: who is actually heating up. A player's last three scored weeks
// against their season average, so the list is real production rather than an
// invented "rostered %".
const RECENT_WEEKS = SCORED_WEEKS.slice(0, 3);

export const WAIVERS: WaiverPlayer[] = (() => {
  const seasonPoints = new Map<string, number[]>();
  for (const week of SCORED_WEEKS) {
    for (const [playerId, points] of Object.entries(BY_WEEK[String(week)] ?? {})) {
      const list = seasonPoints.get(playerId) ?? [];
      list.push(points);
      seasonPoints.set(playerId, list);
    }
  }

  const rows: WaiverPlayer[] = [];
  for (const [playerId, points] of seasonPoints) {
    const player = PLAYERS_BY_ID[playerId];
    if (!player || player.isFreeAgent) continue;
    if (!["QB", "RB", "WR", "TE"].includes(player.position)) continue;

    const recent = RECENT_WEEKS.map((w) => BY_WEEK[String(w)]?.[playerId]).filter(
      (v): v is number => typeof v === "number",
    );
    if (recent.length < 2) continue;

    const recentPPG = average(recent);
    const seasonPPG = average(points);
    if (recentPPG < 8) continue; // not startable, not worth a claim

    const delta = recentPPG - seasonPPG;
    const trend: WaiverTrend = delta > 1.5 ? "up" : delta < -1.5 ? "down" : "flat";
    rows.push({
      playerId,
      recentPPG: Math.round(recentPPG * 10) / 10,
      seasonPPG: Math.round(seasonPPG * 10) / 10,
      trend,
    });
  }

  return rows
    .sort((a, b) => b.recentPPG - b.seasonPPG - (a.recentPPG - a.seasonPPG))
    .slice(0, 16);
})();
