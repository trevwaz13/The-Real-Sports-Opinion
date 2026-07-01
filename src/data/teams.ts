import type { Team } from "./types";
import teamsData from "./real/teams.json";

// Real current NFL teams, fetched from nflverse (nflreadpy) — see
// scripts/fetch_nfl_data.py. Records/points are the 2025 regular season.
// To refresh: `python3 scripts/fetch_nfl_data.py`.
export const TEAMS: Team[] = teamsData as unknown as Team[];

export const TEAMS_BY_ID: Record<string, Team> = Object.fromEntries(
  TEAMS.map((team) => [team.id, team]),
);
