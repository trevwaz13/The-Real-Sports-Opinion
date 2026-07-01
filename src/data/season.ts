// Season context shared across the data layer.
//
// We're in the 2026 preseason: rankings/stats are based on the 2025 season
// until the 2026 regular season kicks off. CURRENT_WEEK drives "this week's"
// games, fantasy scoring, and rankings week stamps.

export const STATS_SEASON_YEAR = 2025;
export const UPCOMING_SEASON_YEAR = 2026;
export const CURRENT_WEEK = 1;
export const IS_PRESEASON = true;
export const PRESEASON_BADGE = `Preseason · based on ${STATS_SEASON_YEAR}`;
