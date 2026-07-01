"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { getPlayersByPosition, getTeam } from "@/data/api";
import { STATS_SEASON_YEAR } from "@/data/season";
import type { PlayerStats, Position } from "@/data/types";
import { STATS_COLUMNS, STAT_FULL_NAMES } from "@/lib/statsColumns";
import { formatStat } from "@/lib/statLines";
import PageContainer from "@/components/PageContainer";
import PlayerHeadshot from "@/components/PlayerHeadshot";
import PositionTabs from "@/components/PositionTabs";
import PreseasonBadge from "@/components/PreseasonBadge";

type SortKey = "name" | keyof PlayerStats;
type SortDir = "asc" | "desc";

function sortIcon(active: boolean, dir: SortDir) {
  if (!active) return null;
  return dir === "asc" ? (
    <ChevronUp size={12} className="inline" />
  ) : (
    <ChevronDown size={12} className="inline" />
  );
}

export default function StatsPage() {
  const [position, setPosition] = useState<Position>("QB");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>(STATS_COLUMNS.QB.defaultSort);
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const table = STATS_COLUMNS[position];

  function changePosition(next: Position) {
    setPosition(next);
    setSortKey(STATS_COLUMNS[next].defaultSort);
    setSortDir("desc");
  }

  function sortBy(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  const q = search.trim().toLowerCase();
  const players = getPlayersByPosition(position)
    .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
    .sort((a, b) => {
      if (sortKey === "name") {
        return sortDir === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      const av = a.seasonStats[sortKey] ?? 0;
      const bv = b.seasonStats[sortKey] ?? 0;
      return sortDir === "asc" ? av - bv : bv - av;
    });

  return (
    <PageContainer className="pb-12">
      <section className="py-8">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-ink">Stats</h1>
          <PreseasonBadge />
        </div>

        {/* Season type + year tabs */}
        <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-silver">
          <div className="flex gap-5">
            <span className="-mb-px border-b-2 border-ink pb-2 text-sm font-bold text-ink">
              Regular Season
            </span>
            <span
              className="-mb-px cursor-not-allowed border-b-2 border-transparent pb-2 text-sm font-bold text-silver"
              title="No playoff data yet"
            >
              Playoffs
            </span>
          </div>
          <div className="flex gap-3 pb-2">
            <span className="rounded-full border border-ink bg-ink px-3 py-0.5 text-xs font-bold text-white">
              {STATS_SEASON_YEAR}
            </span>
          </div>
        </div>

        {/* Position filter + search */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <PositionTabs value={position} onChange={changePosition} />
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-silver-deep"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search player"
              className="w-48 rounded-md border border-silver py-1.5 pl-8 pr-3 text-sm text-ink outline-none placeholder:text-silver-deep focus:border-silver-deep"
            />
          </div>
        </div>

        {/* Stat table */}
        <div className="overflow-x-auto rounded-lg border border-silver">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-silver bg-silver-light/50 text-xs uppercase text-silver-deep">
                <th
                  onClick={() => sortBy("name")}
                  className="sticky left-0 z-10 cursor-pointer bg-silver-light px-3 py-2 text-left font-semibold hover:text-ink"
                >
                  Player {sortIcon(sortKey === "name", sortDir)}
                </th>
                {table.columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => sortBy(col.key)}
                    title={STAT_FULL_NAMES[col.key]}
                    className={`cursor-pointer px-2.5 py-2 text-center font-semibold hover:text-ink ${
                      sortKey === col.key ? "text-ink" : ""
                    }`}
                  >
                    {col.label} {sortIcon(sortKey === col.key, sortDir)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-silver">
              {players.map((player) => {
                const team = getTeam(player.teamId);
                return (
                  <tr key={player.id} className="hover:bg-silver-light/40">
                    <td className="sticky left-0 z-10 bg-white px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Link href={`/player/${player.id}`} className="shrink-0">
                          <PlayerHeadshot
                            playerId={player.id}
                            name={player.name}
                            size={26}
                          />
                        </Link>
                        <Link
                          href={`/player/${player.id}`}
                          className="font-semibold text-ink hover:underline"
                        >
                          {player.name}
                        </Link>
                        {team && (
                          <span className="text-xs text-silver-deep">
                            {team.abbreviation}
                          </span>
                        )}
                      </div>
                    </td>
                    {table.columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-2.5 py-2 text-center tabular-nums ${
                          sortKey === col.key
                            ? "font-bold text-ink"
                            : "text-silver-deep"
                        }`}
                      >
                        {formatStat(player.seasonStats[col.key], col.decimals)}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {players.length === 0 && (
                <tr>
                  <td
                    colSpan={table.columns.length + 1}
                    className="px-3 py-10 text-center text-silver-deep"
                  >
                    No players match “{search}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-silver-deep">
          Showing {STATS_SEASON_YEAR} regular-season stats. Live {STATS_SEASON_YEAR + 1}{" "}
          stats update here once the season kicks off.
        </p>
      </section>
    </PageContainer>
  );
}
