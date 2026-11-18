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
  up: "text-up",
  down: "text-down",
  flat: "text-silver-deep",
};

// Section 6: fantasy. Highest weekly scorers (overall + per position) and
// waiver-wire pickups. A signed-in user's own team module lands with auth
// (Phase 2.5); for now logged-out visitors see the sign-in prompt.
export default function HomeFantasy() {
  const [scope, setScope] = useState<Scope>("ALL");
  const leaders = getFantasyLeaders(scope === "ALL" ? undefined : scope, 10);
  const waivers = getWaivers(8);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-12">
      {/* Weekly scorers */}
      <div className="panel p-5 lg:col-span-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-ink">
            Top Weekly Scorers
          </h3>
          <div role="tablist" aria-label="Scorer position" className="chips chips-sm">
            {(["ALL", ...POSITIONS] as Scope[]).map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={scope === s}
                onClick={() => setScope(s)}
              >
                {s === "ALL" ? "All" : s}
              </button>
            ))}
          </div>
        </div>
        <ol className="grid gap-x-6 sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-5">
          {leaders.map((f, i) => {
            const player = getPlayer(f.playerId);
            if (!player) return null;
            const team = getTeam(player.teamId);
            return (
              <li
                key={f.playerId}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-silver-light"
              >
                <span className="num w-4 shrink-0 text-right text-xs text-silver-deep">
                  {i + 1}
                </span>
                <Link href={`/player/${player.id}`} className="shrink-0">
                  <PlayerHeadshot
                    playerId={player.id}
                    name={player.name}
                    size={32}
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/player/${player.id}`}
                    className="block truncate text-sm font-medium leading-tight text-ink hover:underline"
                  >
                    {player.name}
                  </Link>
                  <span className="text-xs text-silver-deep">
                    {player.position}, {team?.abbreviation}
                  </span>
                </div>
                <span className="num shrink-0 text-right font-semibold text-ink">
                  {f.fantasyPoints.toFixed(1)}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex flex-col gap-4 lg:col-span-4">
        {/* Sign-in prompt for the user's own team */}
        <div className="hero-silver relative overflow-hidden rounded-[14px] border border-silver p-6">
          <p className="font-display text-xl text-ink">Your fantasy team</p>
          <p className="mt-1 text-sm text-silver-deep">
            Sign in to see your matchup, roster, and standings.
          </p>
          <Link
            href="/login"
            className="btn btn-primary mt-5"
          >
            Sign in
          </Link>
        </div>

        {/* Waiver wire */}
        <div className="panel p-5">
          <h3 className="mb-2 font-semibold text-ink">
            Waiver Pickups
          </h3>
          <ul>
            {waivers.map((w) => {
              const player = getPlayer(w.playerId);
              if (!player) return null;
              const Icon = TREND_ICON[w.trend];
              return (
                <li
                  key={w.playerId}
                  className="flex items-center gap-2 py-1.5"
                >
                  <Link
                    href={`/player/${player.id}`}
                    className="min-w-0 flex-1 truncate text-sm font-medium text-ink hover:underline"
                  >
                    {player.name}
                  </Link>
                  <span className="num shrink-0 text-xs text-silver-deep">
                    {w.recentPPG} <span className="text-[11px]">last 3</span>
                  </span>
                  <Icon
                    size={14}
                    aria-label={`Trending ${w.trend}`}
                    className={`shrink-0 ${TREND_COLOR[w.trend]}`}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
