"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { getFantasyLeaders, getPlayer, getTeam, getWaivers } from "@/data/api";
import { POSITIONS, type Position, type WaiverTrend } from "@/data/types";
import PlayerHeadshot from "../PlayerHeadshot";

type Scope = Position | "ALL";

const TREND_ICON: Record<WaiverTrend, typeof ArrowUp> = {
  up: ArrowUp,
  down: ArrowDown,
  flat: Minus,
};
const TREND_COLOR: Record<WaiverTrend, string> = {
  up: "text-emerald-700",
  down: "text-red-600",
  flat: "text-silver-deep",
};

// Section 6 — fantasy: highest weekly scorers (overall + per position) and
// waiver-wire pickups. A signed-in user's own team module lands with auth
// (Phase 2.5); for now logged-out visitors see the sign-in prompt.
export default function HomeFantasy() {
  const [scope, setScope] = useState<Scope>("ALL");
  const leaders = getFantasyLeaders(scope === "ALL" ? undefined : scope, 10);
  const waivers = getWaivers(8);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Weekly scorers */}
      <div className="rounded-lg border border-silver p-4 lg:col-span-2">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-silver-deep">
            Top Weekly Scorers
          </h3>
          <div className="flex gap-1 overflow-x-auto">
            {(["ALL", ...POSITIONS] as Scope[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                  scope === s
                    ? "border-ink bg-ink text-white"
                    : "border-silver text-silver-deep hover:bg-silver-light hover:text-ink"
                }`}
              >
                {s === "ALL" ? "Overall" : s}
              </button>
            ))}
          </div>
        </div>
        <ol className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {leaders.map((f, i) => {
            const player = getPlayer(f.playerId);
            if (!player) return null;
            const team = getTeam(player.teamId);
            return (
              <li key={f.playerId} className="flex items-center gap-2">
                <span className="w-4 shrink-0 text-xs font-bold tabular-nums text-silver-deep">
                  {i + 1}
                </span>
                <Link href={`/player/${player.id}`} className="shrink-0">
                  <PlayerHeadshot
                    playerId={player.id}
                    name={player.name}
                    size={26}
                  />
                </Link>
                <Link
                  href={`/player/${player.id}`}
                  className="min-w-0 flex-1 truncate text-sm font-semibold text-ink hover:underline"
                >
                  {player.name}
                </Link>
                <span className="shrink-0 text-xs text-silver-deep">
                  {player.position} · {team?.abbreviation}
                </span>
                <span className="w-12 shrink-0 text-right text-sm font-bold tabular-nums text-ink">
                  {f.fantasyPoints.toFixed(1)}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="space-y-4">
        {/* Sign-in prompt for the user's own team */}
        <div className="rounded-lg border border-silver bg-silver-light/40 p-4 text-center">
          <p className="text-sm font-semibold text-ink">Your fantasy team</p>
          <p className="mt-1 text-xs text-silver-deep">
            Sign in to see your matchup, roster, and standings.
          </p>
          <Link
            href="/login"
            className="mt-3 inline-flex rounded-md border border-silver-deep px-4 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-silver-light"
          >
            Sign in
          </Link>
        </div>

        {/* Waiver wire */}
        <div className="rounded-lg border border-silver p-4">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-silver-deep">
            Waiver Pickups
          </h3>
          <ul className="space-y-2">
            {waivers.map((w) => {
              const player = getPlayer(w.playerId);
              if (!player) return null;
              const Icon = TREND_ICON[w.trend];
              return (
                <li key={w.playerId} className="flex items-center gap-2">
                  <Link
                    href={`/player/${player.id}`}
                    className="min-w-0 flex-1 truncate text-sm font-semibold text-ink hover:underline"
                  >
                    {player.name}
                  </Link>
                  <span className="shrink-0 text-xs text-silver-deep">
                    {w.percentRostered}% ros
                  </span>
                  <Icon size={14} className={`shrink-0 ${TREND_COLOR[w.trend]}`} />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
