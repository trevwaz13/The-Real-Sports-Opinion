"use server";

import { createClient } from "@/utils/supabase/server";
import { CURRENT_WEEK } from "@/data/season";

type BallotType = "top10" | "top20";

// Save (or replace) the signed-in user's ballot for a position this week.
// One ballot per user/position/week — we delete any existing one first.
export async function submitBallot(
  position: string,
  ballotType: BallotType,
  playerIds: string[],
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to vote." };

  const limit = ballotType === "top20" ? 20 : 10;
  const ids = playerIds.slice(0, limit);
  if (ids.length === 0) return { error: "Add at least one player." };

  // Replace any existing ballot (picks cascade-delete with the ballot).
  await supabase
    .from("fan_ballots")
    .delete()
    .eq("user_id", user.id)
    .eq("position", position)
    .eq("week", CURRENT_WEEK);

  const { data: ballot, error } = await supabase
    .from("fan_ballots")
    .insert({
      user_id: user.id,
      position,
      ballot_type: ballotType,
      week: CURRENT_WEEK,
    })
    .select("id")
    .single();
  if (error || !ballot) return { error: error?.message ?? "Could not save." };

  const picks = ids.map((player_id, i) => ({
    ballot_id: ballot.id,
    player_id,
    slot: i + 1,
  }));
  const { error: picksError } = await supabase
    .from("fan_ballot_picks")
    .insert(picks);
  if (picksError) return { error: picksError.message };

  return { ok: true };
}
