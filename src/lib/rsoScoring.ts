// RSO Official scoring engine — pure and fully data-driven.
//
// A player's RSO score = production points + the sum of every applicable
// tiered bonus for their position. Bonuses award the HIGHEST matching tier
// only (a QB at 72%+ completion gets +5, not +1+2.5+4.5+5).
//
// Each position is described as data: a `production` map (statKey → multiplier)
// and a list of `bonuses` (a metric + ordered tiers). One generic
// `scorePlayer` applies the config — there is no per-position math by hand.

import type { Player, PlayerStats, Position } from "@/data/types";

// --- Config shapes ----------------------------------------------------------

type ProductionConfig = Partial<Record<keyof PlayerStats, number>>;

interface Tier {
  threshold: number;
  points: number;
}

interface BonusConfig {
  label: string;
  metric: MetricKey;
  /** "high" = higher is better (>= threshold); "low" = lower is better (< threshold). */
  direction: "high" | "low";
  tiers: Tier[];
}

interface PositionScoring {
  production: ProductionConfig;
  bonuses: BonusConfig[];
}

// Metrics a bonus can read. Most map straight to a stored stat; a few are
// derived (tdIntRatio, impactPlays) in `deriveMetrics`.
type MetricKey =
  | "completionPct"
  | "tdIntRatio"
  | "passerRating"
  | "yardsPerAttempt"
  | "yardsPerCarry"
  | "yardsPerReception"
  | "scrimmageYds"
  | "totalTD"
  | "catchRate"
  | "recYds"
  | "sacks"
  | "tacklesForLoss"
  | "totalTackles"
  | "impactPlays"
  | "interceptions"
  | "passesDefended"
  | "passerRatingAllowed"
  | "completionPctAllowed";

// --- The spec, encoded exactly ---------------------------------------------

export const RSO_SCORING: Record<Position, PositionScoring> = {
  QB: {
    production: {
      passYds: 0.025,
      rushYds: 0.05,
      passTD: 4,
      rushTD: 6,
      interceptionsThrown: -3,
      fumbles: -3,
    },
    bonuses: [
      {
        label: "Completion %",
        metric: "completionPct",
        direction: "high",
        tiers: [
          { threshold: 65, points: 1 },
          { threshold: 68, points: 2.5 },
          { threshold: 70, points: 4.5 },
          { threshold: 72, points: 5 },
        ],
      },
      {
        label: "TD:INT ratio",
        metric: "tdIntRatio",
        direction: "high",
        tiers: [
          { threshold: 2.0, points: 1 },
          { threshold: 3.0, points: 2.5 },
          { threshold: 4.0, points: 4.5 },
          { threshold: 5.0, points: 5 },
        ],
      },
      {
        label: "Passer rating",
        metric: "passerRating",
        direction: "high",
        tiers: [
          { threshold: 95, points: 1 },
          { threshold: 100, points: 2.5 },
          { threshold: 105, points: 4.5 },
          { threshold: 110, points: 5 },
        ],
      },
      {
        label: "Yards/attempt",
        metric: "yardsPerAttempt",
        direction: "high",
        tiers: [
          { threshold: 7.0, points: 1 },
          { threshold: 7.5, points: 2.5 },
          { threshold: 8.0, points: 4.5 },
          { threshold: 8.5, points: 5 },
        ],
      },
    ],
  },

  RB: {
    production: {
      rushYds: 0.05,
      rushTD: 6,
      receptions: 0.5,
      recYds: 0.05,
      recTD: 6,
      fumbles: -3,
    },
    bonuses: [
      {
        label: "Yards/carry",
        metric: "yardsPerCarry",
        direction: "high",
        tiers: [
          { threshold: 4.0, points: 1 },
          { threshold: 4.5, points: 2.5 },
          { threshold: 5.0, points: 5 },
          { threshold: 5.5, points: 7 },
        ],
      },
      {
        label: "Yards/reception",
        metric: "yardsPerReception",
        direction: "high",
        tiers: [
          { threshold: 8, points: 1 },
          { threshold: 10, points: 2.5 },
          { threshold: 12, points: 4.5 },
          { threshold: 14, points: 5 },
        ],
      },
      {
        label: "Scrimmage yards",
        metric: "scrimmageYds",
        direction: "high",
        tiers: [
          { threshold: 1250, points: 1 },
          { threshold: 1500, points: 2.5 },
          { threshold: 1750, points: 5 },
          { threshold: 2000, points: 7 },
        ],
      },
      {
        label: "Total TDs",
        metric: "totalTD",
        direction: "high",
        tiers: [
          { threshold: 10, points: 1 },
          { threshold: 15, points: 4 },
          { threshold: 20, points: 7 },
          { threshold: 25, points: 10 },
        ],
      },
    ],
  },

  WR: {
    production: {
      receptions: 0.5,
      recYds: 0.05,
      recTD: 6,
      rushYds: 0.05,
      rushTD: 6,
      fumbles: -3,
    },
    bonuses: [
      {
        label: "Yards/reception",
        metric: "yardsPerReception",
        direction: "high",
        tiers: [
          { threshold: 10, points: 1 },
          { threshold: 12, points: 2.5 },
          { threshold: 14, points: 5 },
          { threshold: 16, points: 7 },
        ],
      },
      {
        label: "Catch rate",
        metric: "catchRate",
        direction: "high",
        tiers: [
          { threshold: 60, points: 1 },
          { threshold: 65, points: 2.5 },
          { threshold: 70, points: 4.5 },
          { threshold: 75, points: 7 },
        ],
      },
      {
        label: "Scrimmage yards",
        metric: "scrimmageYds",
        direction: "high",
        tiers: [
          { threshold: 1000, points: 1 },
          { threshold: 1250, points: 2.5 },
          { threshold: 1500, points: 6 },
          { threshold: 1750, points: 8 },
        ],
      },
      {
        label: "Total TDs",
        metric: "totalTD",
        direction: "high",
        tiers: [
          { threshold: 8, points: 1 },
          { threshold: 12, points: 2.5 },
          { threshold: 15, points: 7 },
          { threshold: 18, points: 10 },
        ],
      },
    ],
  },

  TE: {
    production: {
      receptions: 0.6,
      recYds: 0.06,
      recTD: 6,
      rushYds: 0.05,
      rushTD: 6,
      fumbles: -3,
    },
    bonuses: [
      {
        label: "Yards/reception",
        metric: "yardsPerReception",
        direction: "high",
        tiers: [
          { threshold: 9.0, points: 1 },
          { threshold: 11.0, points: 2.5 },
          { threshold: 13.0, points: 4.5 },
          { threshold: 15.0, points: 5 },
        ],
      },
      {
        label: "Catch rate",
        metric: "catchRate",
        direction: "high",
        tiers: [
          { threshold: 65, points: 1 },
          { threshold: 70, points: 2.5 },
          { threshold: 75, points: 4.5 },
          { threshold: 80, points: 5 },
        ],
      },
      {
        label: "Receiving yards",
        metric: "recYds",
        direction: "high",
        tiers: [
          { threshold: 750, points: 1 },
          { threshold: 900, points: 2.5 },
          { threshold: 1100, points: 4.5 },
          { threshold: 1300, points: 5 },
        ],
      },
      {
        label: "Touchdowns",
        metric: "totalTD",
        direction: "high",
        tiers: [
          { threshold: 6, points: 1 },
          { threshold: 8, points: 2.5 },
          { threshold: 10, points: 4.5 },
          { threshold: 12, points: 5 },
        ],
      },
    ],
  },

  EDGE: {
    production: {
      sacks: 6,
      tacklesForLoss: 2,
      qbHits: 1,
      forcedFumbles: 4,
      fumbleRecoveries: 2,
      safeties: 4,
      passesDefended: 1,
      interceptions: 8,
      defTD: 10,
    },
    bonuses: [
      {
        label: "Sacks",
        metric: "sacks",
        direction: "high",
        tiers: [
          { threshold: 8, points: 1 },
          { threshold: 12, points: 2.5 },
          { threshold: 16, points: 4.5 },
          { threshold: 20, points: 5 },
        ],
      },
      {
        label: "TFL",
        metric: "tacklesForLoss",
        direction: "high",
        tiers: [
          { threshold: 10, points: 1 },
          { threshold: 15, points: 2.5 },
          { threshold: 20, points: 4.5 },
          { threshold: 25, points: 5 },
        ],
      },
    ],
  },

  DT: {
    production: {
      sacks: 8,
      tacklesForLoss: 3,
      qbHits: 1,
      forcedFumbles: 4,
      runStops: 1,
      fumbleRecoveries: 2,
      safeties: 4,
      passesDefended: 1,
    },
    bonuses: [
      {
        label: "Sacks",
        metric: "sacks",
        direction: "high",
        tiers: [
          { threshold: 5, points: 1 },
          { threshold: 8, points: 2.5 },
          { threshold: 10, points: 4.5 },
          { threshold: 12, points: 5 },
        ],
      },
      {
        label: "TFL",
        metric: "tacklesForLoss",
        direction: "high",
        tiers: [
          { threshold: 8, points: 1 },
          { threshold: 12, points: 2.5 },
          { threshold: 16, points: 4.5 },
          { threshold: 20, points: 5 },
        ],
      },
    ],
  },

  LB: {
    production: {
      soloTackles: 1,
      assistedTackles: 0.5,
      tacklesForLoss: 2,
      sacks: 5,
      interceptions: 8,
      passesDefended: 1,
      forcedFumbles: 4,
      fumbleRecoveries: 2,
      defTD: 10,
    },
    bonuses: [
      {
        label: "Total tackles",
        metric: "totalTackles",
        direction: "high",
        tiers: [
          { threshold: 100, points: 1 },
          { threshold: 125, points: 2.5 },
          { threshold: 150, points: 4.5 },
          { threshold: 175, points: 5 },
        ],
      },
      {
        label: "Impact plays (sacks + INTs + FF)",
        metric: "impactPlays",
        direction: "high",
        tiers: [
          { threshold: 8, points: 1 },
          { threshold: 12, points: 2.5 },
          { threshold: 16, points: 4.5 },
          { threshold: 20, points: 5 },
        ],
      },
    ],
  },

  CB: {
    production: {
      interceptions: 8,
      passesDefended: 2,
      soloTackles: 0.5,
      tacklesForLoss: 2,
      forcedFumbles: 4,
      fumbleRecoveries: 2,
      sacks: 6,
      defTD: 10,
    },
    bonuses: [
      {
        label: "Interceptions",
        metric: "interceptions",
        direction: "high",
        tiers: [
          { threshold: 3, points: 1 },
          { threshold: 5, points: 2.5 },
          { threshold: 7, points: 4.5 },
          { threshold: 9, points: 5 },
        ],
      },
      {
        label: "Pass deflections",
        metric: "passesDefended",
        direction: "high",
        tiers: [
          { threshold: 10, points: 1 },
          { threshold: 15, points: 2.5 },
          { threshold: 20, points: 4.5 },
          { threshold: 25, points: 5 },
        ],
      },
      {
        label: "Passer rating allowed",
        metric: "passerRatingAllowed",
        direction: "low",
        tiers: [
          { threshold: 80, points: 1 },
          { threshold: 70, points: 2.5 },
          { threshold: 60, points: 4.5 },
          { threshold: 50, points: 5 },
        ],
      },
      {
        label: "Completion % allowed",
        metric: "completionPctAllowed",
        direction: "low",
        tiers: [
          { threshold: 60, points: 1 },
          { threshold: 55, points: 2.5 },
          { threshold: 50, points: 4.5 },
          { threshold: 45, points: 5 },
        ],
      },
    ],
  },

  S: {
    production: {
      interceptions: 8,
      passesDefended: 1.5,
      soloTackles: 0.75,
      assistedTackles: 0.4,
      sacks: 5,
      tacklesForLoss: 2,
      forcedFumbles: 4,
      fumbleRecoveries: 2,
      defTD: 10,
    },
    bonuses: [
      {
        label: "Interceptions",
        metric: "interceptions",
        direction: "high",
        tiers: [
          { threshold: 3, points: 1 },
          { threshold: 5, points: 2.5 },
          { threshold: 7, points: 4.5 },
          { threshold: 9, points: 5 },
        ],
      },
      {
        label: "Tackles",
        metric: "totalTackles",
        direction: "high",
        tiers: [
          { threshold: 80, points: 1 },
          { threshold: 100, points: 2.5 },
          { threshold: 120, points: 4.5 },
          { threshold: 140, points: 5 },
        ],
      },
      {
        label: "Passer rating allowed",
        metric: "passerRatingAllowed",
        direction: "low",
        tiers: [
          { threshold: 85, points: 1 },
          { threshold: 75, points: 2.5 },
          { threshold: 65, points: 4.5 },
          { threshold: 55, points: 5 },
        ],
      },
      {
        label: "Completion % allowed",
        metric: "completionPctAllowed",
        direction: "low",
        tiers: [
          { threshold: 65, points: 1 },
          { threshold: 60, points: 2.5 },
          { threshold: 55, points: 4.5 },
          { threshold: 50, points: 5 },
        ],
      },
    ],
  },
};

// --- Engine -----------------------------------------------------------------

export interface ProductionLine {
  stat: keyof PlayerStats;
  value: number;
  multiplier: number;
  points: number;
}

export interface FiredBonus {
  label: string;
  metric: MetricKey;
  value: number;
  threshold: number;
  points: number;
}

export interface RsoScore {
  playerId: string;
  position: Position;
  total: number;
  productionSubtotal: number;
  production: ProductionLine[];
  bonuses: FiredBonus[];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Resolve every metric a bonus might read, from stored or derived values.
function deriveMetrics(stats: PlayerStats): Record<MetricKey, number> {
  const n = (v: number | undefined) => v ?? 0;
  return {
    completionPct: n(stats.completionPct),
    tdIntRatio: n(stats.passTD) / Math.max(1, n(stats.interceptionsThrown)),
    passerRating: n(stats.passerRating),
    yardsPerAttempt: n(stats.yardsPerAttempt),
    yardsPerCarry: n(stats.yardsPerCarry),
    yardsPerReception: n(stats.yardsPerReception),
    scrimmageYds: n(stats.scrimmageYds),
    totalTD: n(stats.totalTD),
    catchRate: n(stats.catchRate),
    recYds: n(stats.recYds),
    sacks: n(stats.sacks),
    tacklesForLoss: n(stats.tacklesForLoss),
    totalTackles: n(stats.totalTackles),
    impactPlays: n(stats.sacks) + n(stats.interceptions) + n(stats.forcedFumbles),
    interceptions: n(stats.interceptions),
    passesDefended: n(stats.passesDefended),
    passerRatingAllowed: n(stats.passerRatingAllowed),
    completionPctAllowed: n(stats.completionPctAllowed),
  };
}

// Highest matching tier only.
function bestTier(value: number, bonus: BonusConfig): Tier | null {
  let fired: Tier | null = null;
  for (const tier of bonus.tiers) {
    const matches =
      bonus.direction === "low"
        ? value > 0 && value < tier.threshold
        : value >= tier.threshold;
    if (matches && (fired === null || tier.points > fired.points)) {
      fired = tier;
    }
  }
  return fired;
}

/** Score one player: total RSO points + a full breakdown of why. */
export function scorePlayer(player: Player): RsoScore {
  const config = RSO_SCORING[player.position];
  const stats = player.seasonStats;

  const production: ProductionLine[] = [];
  let productionSubtotal = 0;
  for (const [stat, multiplier] of Object.entries(config.production) as [
    keyof PlayerStats,
    number,
  ][]) {
    const value = stats[stat] ?? 0;
    if (value === 0) continue;
    const points = value * multiplier;
    productionSubtotal += points;
    production.push({ stat, value, multiplier, points: round2(points) });
  }

  const metrics = deriveMetrics(stats);
  const bonuses: FiredBonus[] = [];
  for (const bonus of config.bonuses) {
    const value = metrics[bonus.metric];
    const tier = bestTier(value, bonus);
    if (tier) {
      bonuses.push({
        label: bonus.label,
        metric: bonus.metric,
        value: round2(value),
        threshold: tier.threshold,
        points: tier.points,
      });
    }
  }

  const bonusTotal = bonuses.reduce((s, b) => s + b.points, 0);

  return {
    playerId: player.id,
    position: player.position,
    total: round2(productionSubtotal + bonusTotal),
    productionSubtotal: round2(productionSubtotal),
    production,
    bonuses,
  };
}

export interface RsoRankingEntry {
  playerId: string;
  rank: number;
  score: number;
}

/**
 * Rank a set of players within a single position by RSO score (desc).
 * Pass the full player list; non-matching positions and free agents are
 * filtered out. Ties break by player id for stable ordering.
 */
export function rankByRso(
  players: Player[],
  position: Position,
): RsoRankingEntry[] {
  return players
    .filter((p) => p.position === position && !p.isFreeAgent)
    .map((p) => ({ player: p, score: scorePlayer(p).total }))
    .sort((a, b) => b.score - a.score || a.player.id.localeCompare(b.player.id))
    .map(({ player, score }, i) => ({
      playerId: player.id,
      rank: i + 1,
      score,
    }));
}
