// Browser-side reads of user/editor data from Supabase, with graceful fallback
// to the mock layer. These are async (Supabase) and must be called from client
// components only. When Supabase isn't configured they return null so callers
// can fall back to the mock `getRankings`.

import { createClient } from "@/utils/supabase/client";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { getPlayersByPosition, getRankings } from "./api";
import { CURRENT_WEEK } from "./season";
import type { Position, RankingEntry } from "./types";

export type BallotType = "top10" | "top20";

// Build the live Fan ranking from aggregated votes. Voted players rank by points
// (desc); everyone else is filled in by a blend of their RSO + Media positions.
function buildFanEntries(
  position: Position,
  voted: { player_id: string; points: number }[],
): RankingEntry[] {
  const rso = new Map(
    getRankings(position, "rso")?.entries.map((e) => [e.playerId, e.rank]),
  );
  const media = new Map(
    getRankings(position, "media")?.entries.map((e) => [e.playerId, e.rank]),
  );
  const fallbackRank = (id: string) =>
    ((rso.get(id) ?? 99) + (media.get(id) ?? 99)) / 2;

  const votedSorted = [...voted].sort((a, b) => b.points - a.points);
  const votedSet = new Set(votedSorted.map((v) => v.player_id));

  const unvoted = getPlayersByPosition(position)
    .filter((p) => !votedSet.has(p.id))
    .sort((a, b) => fallbackRank(a.id) - fallbackRank(b.id));

  const ordered = [
    ...votedSorted.map((v) => ({ id: v.player_id, score: v.points })),
    ...unvoted.map((p) => ({ id: p.id, score: 0 })),
  ];

  return ordered.map((o, i) => ({
    playerId: o.id,
    rank: i + 1,
    score: o.score,
  }));
}

/**
 * Live Fan ranking.
 *   null → Supabase not configured (caller should use the mock ranking).
 *   []   → configured but no ballots yet ("Waiting for all votes").
 *   [..] → aggregated ranking.
 */
export async function fetchFanRanking(
  position: Position,
): Promise<RankingEntry[] | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = createClient();
  const { data, error } = await supabase.rpc("fan_ranking", {
    p_position: position,
    p_week: CURRENT_WEEK,
  });
  if (error) return null;
  const voted = (data ?? []) as { player_id: string; points: number }[];
  if (voted.length === 0) return [];
  return buildFanEntries(position, voted);
}

/** The signed-in user's existing ballot for a position, if any. */
export async function fetchMyBallot(
  position: Position,
): Promise<{ ballotType: BallotType; playerIds: string[] } | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: ballot } = await supabase
    .from("fan_ballots")
    .select("id, ballot_type")
    .eq("user_id", user.id)
    .eq("position", position)
    .eq("week", CURRENT_WEEK)
    .maybeSingle();
  if (!ballot) return null;

  const { data: picks } = await supabase
    .from("fan_ballot_picks")
    .select("player_id, slot")
    .eq("ballot_id", ballot.id)
    .order("slot");

  return {
    ballotType: ballot.ballot_type as BallotType,
    playerIds: (picks ?? []).map((p) => p.player_id as string),
  };
}

/** Whether someone is currently signed in (client check, for UI gating). */
export async function fetchCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
