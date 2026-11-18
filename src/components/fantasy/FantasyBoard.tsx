"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import {
  getFantasyLeaders,
  getFantasySeasonLeaders,
  getFantasyWeeks,
  getPlayer,
  getTeam,
  getWaivers,
} from "@/data/api";
import { POSITIONS, type Position, type WaiverTrend } from "@/data/types";
import PlayerHeadshot from "../PlayerHeadshot";
import SectionHeader from "../SectionHeader";
import Select from "../Select";

type Scope = Position | "ALL";
type View = "week" | "season";

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

// One scoring row: rank, headshot, name, team, a meter against the leader, and
// the points. Used for both the weekly and season-long boards.
function ScorerRow({
  rank,
  playerId,
  value,
  max,
  note,
}: {
  rank: number;
  playerId: string;
  value: number;
  max: number;
  note?: string;
}) {
  const player = getPlayer(playerId);
  if (!player) return null;
  const team = getTeam(player.teamId);
  return (
    <li className="flex items-center gap-3 border-t border-silver/70 px-4 py-2.5 first:border-t-0">
      <span className="num w-6 shrink-0 text-right text-sm text-silver-deep">
        {rank}
      </span>
      <Link href={`/player/${player.id}`} className="shrink-0">
        <PlayerHeadshot playerId={player.id} name={player.name} size={34} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/player/${player.id}`}
          className="block truncate text-sm font-medium text-ink hover:underline"
        >
          {player.name}
        </Link>
        <span className="text-xs text-silver-deep">
          {player.position}
          {team ? `, ${team.abbreviation}` : ""}
          {note ? ` · ${note}` : ""}
        </span>
      </div>
      <div
        className="meter hidden w-32 shrink-0 sm:block"
        style={
          {
            "--value": max > 0 ? (value / max) * 100 : 0,
          } as React.CSSProperties
        }
        aria-hidden
      />
      <span className="num w-16 shrink-0 text-right font-semibold text-ink">
        {value.toFixed(1)}
      </span>
    </li>
  );
}

export default function FantasyBoard() {
  const weeks = getFantasyWeeks();
  const [view, setView] = useState<View>("week");
  const [week, setWeek] = useState(weeks[0] ?? 1);
  const [scope, setScope] = useState<Scope>("ALL");
  const position = scope === "ALL" ? undefined : scope;

  const weekly = getFantasyLeaders(position, 25, week);
  const season = getFantasySeasonLeaders(position, 25);
  const waivers = getWaivers(10);

  const rows =
    view === "week"
      ? weekly.map((r) => ({
          playerId: r.playerId,
          value: r.fantasyPoints,
          note: undefined as string | undefined,
        }))
      : season.map((r) => ({
          playerId: r.playerId,
          value: r.total,
          note: `${r.average.toFixed(1)} per game, ${r.games} games`,
        }));
  const max = rows[0]?.value ?? 0;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <SectionHeader
          title={view === "week" ? `Week ${week} scoring` : "Season scoring"}
          description="PPR: 1 point per reception, 6 per touchdown, 4 per passing touchdown."
        >
          <div role="tablist" aria-label="Scoring range" className="tabs">
            <button
              role="tab"
              aria-selected={view === "week"}
              onClick={() => setView("week")}
              className="tab"
            >
              By week
            </button>
            <button
              role="tab"
              aria-selected={view === "season"}
              onClick={() => setView("season")}
              className="tab"
            >
              Season
            </button>
          </div>
        </SectionHeader>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div role="tablist" aria-label="Position filter" className="chips">
            {(["ALL", ...POSITIONS] as Scope[]).map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={scope === option}
                onClick={() => setScope(option)}
              >
                {option === "ALL" ? "All" : option}
              </button>
            ))}
          </div>
          {view === "week" && (
            <Select
              label="Select week"
              value={week}
              options={weeks}
              onChange={setWeek}
              format={(w) => `Week ${w}`}
            />
          )}
        </div>

        {rows.length === 0 ? (
          <div className="panel px-4 py-14 text-center">
            <p className="font-display text-xl text-ink">No scoring yet</p>
            <p className="mt-1 text-sm text-silver-deep">
              Points appear here once week {week} games are played.
            </p>
          </div>
        ) : (
          <ol className="panel overflow-hidden">
            {rows.map((row, i) => (
              <ScorerRow
                key={row.playerId}
                rank={i + 1}
                playerId={row.playerId}
                value={row.value}
                max={max}
                note={row.note}
              />
            ))}
          </ol>
        )}
      </div>

      <aside className="space-y-6 lg:col-span-4">
        <div className="panel p-5">
          <h2 className="font-semibold text-ink">Waiver watch</h2>
          <p className="mt-0.5 text-sm text-silver-deep">
            Last three weeks against the season average.
          </p>
          <ul className="mt-3">
            {waivers.map((w) => {
              const player = getPlayer(w.playerId);
              if (!player) return null;
              const Icon = TREND_ICON[w.trend];
              const delta = w.recentPPG - w.seasonPPG;
              return (
                <li
                  key={w.playerId}
                  className="flex items-center gap-2 border-t border-silver/70 py-2 first:border-t-0"
                >
                  <Link href={`/player/${player.id}`} className="shrink-0">
                    <PlayerHeadshot
                      playerId={player.id}
                      name={player.name}
                      size={28}
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/player/${player.id}`}
                      className="block truncate text-sm font-medium text-ink hover:underline"
                    >
                      {player.name}
                    </Link>
                    <span className="text-xs text-silver-deep">
                      {player.position}, {getTeam(player.teamId)?.abbreviation}
                    </span>
                  </div>
                  <span className="num shrink-0 text-right text-sm text-ink">
                    {w.recentPPG}
                  </span>
                  <span
                    className={`num flex w-12 shrink-0 items-center justify-end gap-0.5 text-xs ${TREND_COLOR[w.trend]}`}
                    aria-label={`${delta >= 0 ? "Up" : "Down"} ${Math.abs(delta).toFixed(1)} per game`}
                  >
                    <Icon size={12} />
                    {Math.abs(delta).toFixed(1)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="hero-silver rounded-[14px] border border-silver p-6">
          <p className="font-display text-xl text-ink">Your fantasy team</p>
          <p className="mt-1 text-sm text-silver-deep">
            Sign in to sync a roster and track your starters against these
            numbers.
          </p>
          <Link href="/login" className="btn btn-primary mt-5">
            Sign in
          </Link>
        </div>
      </aside>
    </div>
  );
}
