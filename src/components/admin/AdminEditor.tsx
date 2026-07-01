"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { getPlayer, getTeam } from "@/data/api";
import type { Position } from "@/data/types";
import { CURRENT_WEEK } from "@/data/season";
import { createClient } from "@/utils/supabase/client";
import { saveMediaPowerRanking, saveMediaRanking } from "@/app/admin/actions";
import PlayerHeadshot from "../PlayerHeadshot";
import PositionTabs from "../PositionTabs";
import TeamLogo from "../TeamLogo";

type Mode = "players" | "power";

export default function AdminEditor({
  playerOrders,
  teamOrder,
}: {
  playerOrders: Record<Position, string[]>;
  teamOrder: string[];
}) {
  const [mode, setMode] = useState<Mode>("players");
  const [position, setPosition] = useState<Position>("QB");
  const [order, setOrder] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load the saved order from Supabase (falling back to the default mock order).
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus(null);
      const supabase = createClient();
      if (mode === "players") {
        const fallback = playerOrders[position].slice(0, 32);
        const { data } = await supabase
          .from("media_rankings")
          .select("player_ids")
          .eq("position", position)
          .eq("week", CURRENT_WEEK)
          .maybeSingle();
        if (!cancelled)
          setOrder(
            (data?.player_ids as string[] | undefined)?.slice(0, 32) ??
              fallback,
          );
      } else {
        const { data } = await supabase
          .from("media_power_rankings")
          .select("team_ids")
          .eq("week", CURRENT_WEEK)
          .maybeSingle();
        if (!cancelled)
          setOrder((data?.team_ids as string[] | undefined) ?? teamOrder);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [mode, position, playerOrders, teamOrder]);

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
    setStatus(null);
  }

  async function save() {
    setSaving(true);
    setStatus(null);
    const res =
      mode === "players"
        ? await saveMediaRanking(position, order)
        : await saveMediaPowerRanking(order);
    setSaving(false);
    setStatus(res.error ? `Error: ${res.error}` : "Saved ✓");
  }

  return (
    <div>
      {/* Mode tabs */}
      <div className="mb-4 flex gap-6 border-b border-silver">
        {(
          [
            ["players", "Player Rankings"],
            ["power", "Power Rankings"],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`-mb-px border-b-2 px-1 pb-2 text-base font-bold transition-colors ${
              mode === m
                ? "border-ink text-ink"
                : "border-transparent text-silver-deep hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "players" && (
        <PositionTabs
          value={position}
          onChange={setPosition}
          className="mb-4"
        />
      )}

      <ol className="overflow-hidden rounded-lg border border-silver">
        {order.map((itemId, i) => {
          const player = mode === "players" ? getPlayer(itemId) : undefined;
          const team =
            mode === "power"
              ? getTeam(itemId)
              : player
                ? getTeam(player.teamId)
                : undefined;
          return (
            <li
              key={itemId}
              className="flex items-center gap-3 border-b border-silver px-3 py-2 last:border-b-0"
            >
              <span className="w-6 shrink-0 text-right text-sm font-bold tabular-nums text-silver-deep">
                {i + 1}
              </span>
              {mode === "players" ? (
                <>
                  <PlayerHeadshot
                    playerId={itemId}
                    name={player?.name}
                    size={28}
                  />
                  <span className="flex-1 truncate font-semibold text-ink">
                    {player?.name ?? itemId}
                  </span>
                  <span className="text-xs text-silver-deep">
                    {team?.abbreviation}
                  </span>
                </>
              ) : (
                <>
                  <TeamLogo teamId={itemId} size={26} />
                  <span className="flex-1 truncate font-semibold text-ink">
                    {team ? `${team.city} ${team.name}` : itemId}
                  </span>
                </>
              )}
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move up"
                  className="rounded border border-silver p-1 text-ink hover:bg-silver-light disabled:opacity-30"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === order.length - 1}
                  aria-label="Move down"
                  className="rounded border border-silver p-1 text-ink hover:bg-silver-light disabled:opacity-30"
                >
                  <ArrowDown size={14} />
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || order.length === 0}
          className="rounded-md bg-ink px-5 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save ranking"}
        </button>
        {status && (
          <span
            className={`text-sm font-semibold ${
              status.startsWith("Error") ? "text-red-600" : "text-emerald-700"
            }`}
          >
            {status}
          </span>
        )}
      </div>
    </div>
  );
}
