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
      <div role="tablist" aria-label="Editor mode" className="tabs mb-5">
        {(
          [
            ["players", "Player Rankings"],
            ["power", "Power Rankings"],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => changeMode(m)}
            className="tab sm:text-2xl"
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
          <h3 className="mb-3 flex items-baseline gap-2 font-semibold text-ink">
            {mode === "players" ? `${position} ranking` : "Power ranking"}
            <span className="num text-xs font-normal text-silver-deep">
              ({order.length} added)
            </span>
          </h3>
          {order.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-silver px-3 py-10 text-center text-sm text-silver-deep">
              Blank sheet. Add {mode === "players" ? "players" : "teams"} from
              the pool, then drag to order them.
            </p>
          ) : (
            <ol className="panel p-1.5">
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
                    className={`flex cursor-grab items-center gap-2 rounded-lg px-3 py-2 active:cursor-grabbing ${
                      dragIndex === i ? "bg-silver-light" : "hover:bg-silver-light"
                    }`}
                  >
                    <GripVertical
                      size={16}
                      className="shrink-0 text-silver-deep"
                    />
                    <span className="num w-6 shrink-0 text-right text-sm text-silver-deep">
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
                        <span className="ml-1.5 text-xs text-silver-deep">
                          {team.abbreviation}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(id)}
                      aria-label="Remove"
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-down hover:bg-silver-light"
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
              className="btn btn-primary"
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
                className="text-sm font-medium text-silver-deep hover:text-ink"
              >
                Clear
              </button>
            )}
            {status && (
              <span
                className={`text-sm font-semibold ${
                  status.startsWith("Error")
                    ? "text-down"
                    : "text-up"
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
              className="field w-full !rounded-full py-2 pl-8 pr-3"
            />
          </div>
          <ul className="panel max-h-[28rem] overflow-y-auto p-1.5">
            {mode === "players"
              ? availablePlayers.map((p) => {
                  const team = getTeam(p.teamId);
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => add(p.id)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left hover:bg-silver-light"
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
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left hover:bg-silver-light"
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
