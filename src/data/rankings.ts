import { PLAYERS } from "./players";
import { CURRENT_WEEK } from "./season";
import {
  POSITIONS,
  type Player,
  type Position,
  type Ranking,
  type RankingEntry,
  type RankingSource,
} from "./types";

// Mock rankings for Phase 2. Each source orders a position's players by a
// stable per-player "talent" value, nudged differently per source so the three
// lists diverge realistically.
//
// NOTE: In later phases these are replaced for two sources —
//   - "rso"  → computed live by the Phase 3 scoring engine
//   - "fan"  → aggregated from real fan ballots (Phase 4, Supabase)
// "media" stays editor-maintained (Phase 2.5 admin). The api surface
// (getRankings) stays the same so pages never change.

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function unit(seed: string): number {
  return (hashString(seed) % 10000) / 10000;
}

const SOURCE_NUDGE: Record<RankingSource, number> = {
  media: 0,
  rso: 0.18,
  fan: 0.32,
};

function scoreFor(player: Player, source: RankingSource): number {
  const talent = unit(player.id + "talent");
  const nudge = (unit(player.id + source) - 0.5) * SOURCE_NUDGE[source];
  return Math.round((55 + (talent + nudge) * 44) * 10) / 10;
}

function buildRanking(position: Position, source: RankingSource): Ranking {
  const entries: RankingEntry[] = PLAYERS.filter(
    (p) => p.position === position && !p.isFreeAgent,
  )
    .map((p) => ({ player: p, score: scoreFor(p, source) }))
    .sort((a, b) => b.score - a.score)
    .map(({ player, score }, i) => ({
      playerId: player.id,
      rank: i + 1,
      score,
    }));

  return { position, source, week: CURRENT_WEEK, entries };
}

const SOURCES: RankingSource[] = ["media", "rso", "fan"];

// Precompute every position × source combination once.
export const RANKINGS: Record<RankingSource, Record<Position, Ranking>> =
  Object.fromEntries(
    SOURCES.map((source) => [
      source,
      Object.fromEntries(
        POSITIONS.map((pos) => [pos, buildRanking(pos, source)]),
      ),
    ]),
  ) as Record<RankingSource, Record<Position, Ranking>>;
