import type { Player } from "./types";
import playersData from "./real/players.json";

// Real NFL players with their current-season + career stats, fetched from
// nflverse (nflreadpy) — see scripts/fetch_nfl_data.py. Every player who
// recorded a stat at one of the nine tracked positions is included.
// To refresh: `python3 scripts/fetch_nfl_data.py`.
export const PLAYERS: Player[] = playersData as unknown as Player[];

export const PLAYERS_BY_ID: Record<string, Player> = Object.fromEntries(
  PLAYERS.map((p) => [p.id, p]),
);
