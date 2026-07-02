"use client";

import { useEffect, useState } from "react";
import { GripVertical, Plus, Search, X } from "lucide-react";
import { getPlayer, getPlayersByPosition, getTeam, getTeams } from "@/data/api";
import type { Position } from "@/data/types";
import { CURRENT_WEEK } from "@/data/season";
import { createClient } from "@/utils/supabase/client";
import { saveMediaPowerRanking, saveMediaRanking } from "@/app/admin/actions";
import PlayerHeadshot from "../PlayerHeadshot";
import PositionTabs from "../PositionTabs";
import TeamLogo from "../TeamLogo";

type Mode = "players" | "power";

export default function AdminEditor() {
  const [mode, setMode] = useState<Mode>("players");
  const [position, setPosition] = useState<Position>("QB");
  const [order, setOrder] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Load the saved ranking from Supabase — blank if none exists yet.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      if (mode === "players") {
        const { data } = await supabase
          .from("media_rankings")
          .select("player_ids")
          .eq("position", position)
          .eq("week", CURRENT_WEEK)
          .maybeSingle();
        if (!cancelled) setOrder((data?.player_ids as string[]) ?? []);
      } else {
        const { data } = await supabase
          .from("media_power_rankings")
          .select("team_ids")
          .eq("week", CURRENT_WEEK)
          .maybeSingle();
        if (!cancelled) setOrder((data?.team_ids as string[]) ?? []);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [mode, position]);

  function changeMode(m: Mode) {
    setMode(m);
    setSearch("");
    setStatus(null);
  }
  function changePosition(p: Position) {
    setPosition(p);
    setSearch("");
    setStatus(null);
  }

  function add(id: string) {
    setOrder((o) => [...o, id]);
    setStatus(null);
  }
  function remove(id: string) {
    setOrder((o) => o.filter((x) => x !== id));
    setStatus(null);
  }

  // Drag-to-reorder (live) using native HTML5 drag events.
  function onDragEnter(i: number) {
    if (dragIndex === null || dragIndex === i) return;
    setOrder((o) => {
      const next = [...o];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(i, 0, moved);
      return next;
    });
    setDragIndex(i);
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

  const q = search.trim().toLowerCase();
  const availablePlayers =
    mode === "players"
      ? getPlayersByPosition(position)
          .filter((p) => !order.includes(p.id))
          .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
          .slice(0, 60)
      : [];
  const availableTeams =
    mode === "power"
      ? getTeams()
          .filter((t) => !order.includes(t.id))
          .filter((t) =>
            q ? `${t.city} ${t.name}`.toLowerCase().includes(q) : true,
          )
      : [];

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
            onClick={() => changeMode(m)}
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
          onChange={changePosition}
          className="mb-4"
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* The ranking — drag to reorder */}
        <div>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-silver-deep">
            {mode === "players" ? `${position} ranking` : "Power ranking"}
            <span className="ml-2 font-normal normal-case">
              ({order.length} added)
            </span>
          </h3>
          {order.length === 0 ? (
            <p className="rounded-lg border border-dashed border-silver px-3 py-10 text-center text-sm text-silver-deep">
              Blank sheet — add {mode === "players" ? "players" : "teams"} from
              the right, then drag to order them.
            </p>
          ) : (
            <ol className="overflow-hidden rounded-lg border border-silver">
              {order.map((id, i) => {
                const player = mode === "players" ? getPlayer(id) : undefined;
                const team =
                  mode === "power"
                    ? getTeam(id)
                    : player
                      ? getTeam(player.teamId)
                      : undefined;
                return (
                  <li
                    key={id}
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragEnter={() => onDragEnter(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnd={() => setDragIndex(null)}
                    className={`flex cursor-grab items-center gap-2 border-b border-silver px-3 py-2 last:border-b-0 active:cursor-grabbing ${
                      dragIndex === i ? "bg-silver-light" : "hover:bg-silver-light/50"
                    }`}
                  >
                    <GripVertical
                      size={16}
                      className="shrink-0 text-silver-deep"
                    />
                    <span className="w-6 shrink-0 text-right text-sm font-bold tabular-nums text-silver-deep">
                      {i + 1}
                    </span>
                    {mode === "players" ? (
                      <PlayerHeadshot
                        playerId={id}
                        name={player?.name}
                        size={26}
                      />
                    ) : (
                      <TeamLogo teamId={id} size={24} />
                    )}
                    <span className="min-w-0 flex-1 truncate font-semibold text-ink">
                      {mode === "players"
                        ? (player?.name ?? id)
                        : team
                          ? `${team.city} ${team.name}`
                          : id}
                      {mode === "players" && team && (
                        <span className="ml-1 text-xs text-silver-deep">
                          {team.abbreviation}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(id)}
                      aria-label="Remove"
                      className="shrink-0 rounded p-1 text-red-600 hover:bg-red-50"
                    >
                      <X size={15} />
                    </button>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving || order.length === 0}
              className="rounded-md bg-ink px-5 py-2 text-sm font-bold text-primary hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save ranking"}
            </button>
            {order.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setOrder([]);
                  setStatus(null);
                }}
                className="text-sm font-semibold text-silver-deep hover:text-ink"
              >
                Clear
              </button>
            )}
            {status && (
              <span
                className={`text-sm font-semibold ${
                  status.startsWith("Error")
                    ? "text-red-600"
                    : "text-emerald-700"
                }`}
              >
                {status}
              </span>
            )}
          </div>
        </div>

        {/* Available pool */}
        <div>
          <div className="relative mb-2">
            <Search
              size={14}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-silver-deep"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={mode === "players" ? "Search players" : "Search teams"}
              className="w-full rounded-md border border-silver py-2 pl-8 pr-3 text-sm outline-none focus:border-silver-deep"
            />
          </div>
          <ul className="max-h-[28rem] space-y-1 overflow-y-auto rounded-lg border border-silver p-2">
            {mode === "players"
              ? availablePlayers.map((p) => {
                  const team = getTeam(p.teamId);
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => add(p.id)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-silver-light"
                      >
                        <PlayerHeadshot playerId={p.id} name={p.name} size={24} />
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                          {p.name}
                        </span>
                        <span className="text-xs text-silver-deep">
                          {team?.abbreviation}
                        </span>
                        <Plus size={15} className="text-silver-deep" />
                      </button>
                    </li>
                  );
                })
              : availableTeams.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => add(t.id)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-silver-light"
                    >
                      <TeamLogo teamId={t.id} size={22} />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                        {t.city} {t.name}
                      </span>
                      <Plus size={15} className="text-silver-deep" />
                    </button>
                  </li>
                ))}
            {((mode === "players" && availablePlayers.length === 0) ||
              (mode === "power" && availableTeams.length === 0)) && (
              <li className="px-2 py-6 text-center text-sm text-silver-deep">
                {q ? "No matches." : "All added."}
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
