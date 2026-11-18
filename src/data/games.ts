import type { Game } from "./types";
import gamesData from "./real/games.json";

// Real NFL games (all 18 regular-season weeks) with scores, spreads,
// totals, moneylines, kickoff times, and precomputed per-team leaders — from
// nflverse (nflreadpy). See scripts/fetch_nfl_data.py.
export const GAMES: Game[] = gamesData as unknown as Game[];
