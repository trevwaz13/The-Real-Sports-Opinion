// Tier class for the top three cross-source ranks on rankings rows: chrome
// shades from strongest (1) to lightest (3), styled in globals.css so they
// follow the light / dark palette. Ranks 4+ render normally.
export function medalClass(rank: number | undefined): string {
  return rank === 1 ? "medal-1" : rank === 2 ? "medal-2" : rank === 3 ? "medal-3" : "";
}
