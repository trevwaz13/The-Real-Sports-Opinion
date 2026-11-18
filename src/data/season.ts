import seasonMeta from "./real/season.json";

// Season context shared across the data layer, written by
// scripts/fetch_nfl_data.py from the live nflverse feed.
//
// CURRENT_WEEK is the week now being played (the first with an unplayed game);
// LAST_COMPLETED_WEEK is the newest week with final scores, which is what
// stats, rankings and the fantasy leaderboard reflect.

type SeasonMeta = {
  season: number;
  currentWeek: number;
  lastCompletedWeek: number;
  updatedAt: string;
};

const META = seasonMeta as SeasonMeta;

export const SEASON_YEAR = META.season;
export const STATS_SEASON_YEAR = META.season;
export const CURRENT_WEEK = META.currentWeek;
export const LAST_COMPLETED_WEEK = META.lastCompletedWeek;
export const DATA_UPDATED_AT = META.updatedAt;

/** Before the season's first game, stats still describe the prior year. */
export const IS_PRESEASON = META.lastCompletedWeek === 0;

export const SEASON_BADGE = IS_PRESEASON
  ? `Preseason, ${META.season}`
  : `${META.season} season, week ${META.currentWeek}`;

/** @deprecated use SEASON_BADGE */
export const PRESEASON_BADGE = SEASON_BADGE;
