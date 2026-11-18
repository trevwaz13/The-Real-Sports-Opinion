"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { getPlayersByPosition, getTeam } from "@/data/api";
import { LAST_COMPLETED_WEEK, STATS_SEASON_YEAR } from "@/data/season";
import type { PlayerStats, Position } from "@/data/types";
import { STATS_COLUMNS, STAT_FULL_NAMES } from "@/lib/statsColumns";
import { formatStat } from "@/lib/statLines";
import PageContainer from "@/components/PageContainer";
import PageHeading from "@/components/PageHeading";
import PlayerHeadshot from "@/components/PlayerHeadshot";
import PositionTabs from "@/components/PositionTabs";

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
    <PageContainer>
      <PageHeading title="Stats" badge />

      {/* Season type + year */}
      <div className="tabs mb-5 items-end">
        <div role="tablist" aria-label="Season type" className="contents">
          <span role="tab" aria-selected="true" className="tab">
            Regular Season
          </span>
          <span
            role="tab"
            aria-selected="false"
            aria-disabled="true"
            className="tab cursor-not-allowed opacity-50"
            title="No playoff data yet"
          >
            Playoffs
          </span>
        </div>
        <span className="tag mb-2 ml-auto border border-silver bg-band text-silver-deep">
          {STATS_SEASON_YEAR} season
        </span>
      </div>

      {/* Position filter + search */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <PositionTabs value={position} onChange={changePosition} />
        <label className="relative">
          <span className="sr-only">Search player</span>
          <Search
            size={16}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-silver-deep"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search player"
            className="field w-56 !rounded-full py-1.5 pl-8 pr-3"
          />
        </label>
      </div>

      {/* Stat table */}
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b border-silver bg-band">
              <th
                onClick={() => sortBy("name")}
                className={`label sticky left-0 z-10 cursor-pointer bg-band px-4 py-3 text-left font-medium hover:text-ink ${
                  sortKey === "name" ? "!text-ink" : ""
                }`}
              >
                Player {sortIcon(sortKey === "name", sortDir)}
              </th>
              {table.columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => sortBy(col.key)}
                  title={STAT_FULL_NAMES[col.key]}
                  aria-sort={
                    sortKey === col.key
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  className={`label cursor-pointer whitespace-nowrap px-2.5 py-3 text-right font-medium hover:text-ink ${
                    sortKey === col.key ? "!font-semibold !text-ink" : ""
                  }`}
                >
                  {col.label} {sortIcon(sortKey === col.key, sortDir)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((player, i) => {
              const team = getTeam(player.teamId);
              return (
                <tr
                  key={player.id}
                  className="group border-t border-silver/60 first:border-t-0 hover:bg-silver-light/60"
                >
                  <td className="sticky left-0 z-10 bg-surface px-4 py-2 group-hover:bg-silver-light">
                    <div className="flex items-center gap-2.5">
                      <span className="num w-5 text-right text-xs text-silver-deep">
                        {i + 1}
                      </span>
                      <Link href={`/player/${player.id}`} className="shrink-0">
                        <PlayerHeadshot
                          playerId={player.id}
                          name={player.name}
                          size={28}
                        />
                      </Link>
                      <Link
                        href={`/player/${player.id}`}
                        className="whitespace-nowrap text-sm font-medium text-ink hover:underline"
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
                      className={`num px-2.5 py-2 text-right text-sm ${
                        sortKey === col.key
                          ? "bg-silver-light/50 font-semibold text-ink"
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
                  className="px-3 py-12 text-center text-silver-deep"
                >
                  No players match &ldquo;{search}&rdquo;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-sm text-silver-deep">
        {STATS_SEASON_YEAR} regular-season totals through week{" "}
        {LAST_COMPLETED_WEEK}. Refreshed from nflverse after each slate.
      </p>
    </PageContainer>
  );
}
