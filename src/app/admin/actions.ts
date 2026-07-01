"use server";

import { createClient } from "@/utils/supabase/server";
import { CURRENT_WEEK } from "@/data/season";

// Verifies the caller is an admin (profiles.role = 'admin') and returns the
// server client. Throws otherwise — RLS also enforces this at the DB level.
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") throw new Error("Admins only");
  return supabase;
}

export async function saveMediaRanking(position: string, playerIds: string[]) {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("media_rankings").upsert(
      {
        position,
        week: CURRENT_WEEK,
        player_ids: playerIds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "position,week" },
    );
    if (error) return { error: error.message };
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save" };
  }
}

export async function saveMediaPowerRanking(teamIds: string[]) {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("media_power_rankings").upsert(
      {
        week: CURRENT_WEEK,
        team_ids: teamIds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "week" },
    );
    if (error) return { error: error.message };
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save" };
  }
}
