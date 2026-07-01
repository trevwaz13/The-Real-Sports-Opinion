import type { PlayerStats, Position } from "@/data/types";

// Which season stats to surface inline on a ranking row, per position.
// Each column shows its label above the value. `hideIfZero` drops the column
// for a player when the value is 0 (e.g. a QB with no rushing TDs).
export interface StatColumn {
  label: string;
  key: keyof PlayerStats;
  decimals?: number;
  hideIfZero?: boolean;
}

export const STAT_LINES: Record<Position, StatColumn[]> = {
  QB: [
    { label: "Pass Yds", key: "passYds" },
    { label: "Pass TD", key: "passTD" },
    { label: "INT", key: "interceptionsThrown" },
    { label: "Comp %", key: "completionPct", decimals: 1 },
    { label: "Rush TD", key: "rushTD" },
    { label: "Fum", key: "fumbles" },
  ],
  RB: [
    { label: "Rush Yds", key: "rushYds" },
    { label: "Y/C", key: "yardsPerCarry", decimals: 1 },
    { label: "Rush TD", key: "rushTD" },
    { label: "Rec Yds", key: "recYds" },
    { label: "Rec TD", key: "recTD" },
    { label: "Fum", key: "fumbles" },
  ],
  WR: [
    { label: "Targets", key: "targets" },
    { label: "Rec", key: "receptions" },
    { label: "Rec Yds", key: "recYds" },
    { label: "Rec TD", key: "recTD" },
    { label: "Y/R", key: "yardsPerReception", decimals: 1 },
    { label: "Catch %", key: "catchRate", decimals: 1 },
  ],
  TE: [
    { label: "Targets", key: "targets" },
    { label: "Rec", key: "receptions" },
    { label: "Rec Yds", key: "recYds" },
    { label: "Rec TD", key: "recTD" },
    { label: "Y/R", key: "yardsPerReception", decimals: 1 },
    { label: "Catch %", key: "catchRate", decimals: 1 },
  ],
  EDGE: [
    { label: "Sacks", key: "sacks", decimals: 1 },
    { label: "TFL", key: "tacklesForLoss" },
    { label: "QB Hits", key: "qbHits" },
    { label: "Tackles", key: "totalTackles" },
    { label: "FF", key: "forcedFumbles" },
  ],
  DT: [
    { label: "Sacks", key: "sacks", decimals: 1 },
    { label: "TFL", key: "tacklesForLoss" },
    { label: "QB Hits", key: "qbHits" },
    { label: "Run Stops", key: "runStops" },
    { label: "Tackles", key: "totalTackles" },
    { label: "FF", key: "forcedFumbles" },
  ],
  LB: [
    { label: "Total", key: "totalTackles" },
    { label: "Solo", key: "soloTackles" },
    { label: "Sacks", key: "sacks", decimals: 1 },
    { label: "INT", key: "interceptions" },
    { label: "TFL", key: "tacklesForLoss" },
    { label: "FF", key: "forcedFumbles" },
  ],
  CB: [
    { label: "INT", key: "interceptions" },
    { label: "PD", key: "passesDefended" },
    { label: "Tackles", key: "totalTackles" },
    { label: "Comp% Allw", key: "completionPctAllowed", decimals: 1 },
    { label: "FF", key: "forcedFumbles" },
  ],
  S: [
    { label: "Tackles", key: "totalTackles" },
    { label: "INT", key: "interceptions" },
    { label: "PD", key: "passesDefended" },
    { label: "Sacks", key: "sacks", decimals: 1 },
    { label: "FF", key: "forcedFumbles" },
  ],
};

export function formatStat(
  value: number | undefined,
  decimals = 0,
): string {
  if (value === undefined || Number.isNaN(value)) return "—";
  return decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
}
