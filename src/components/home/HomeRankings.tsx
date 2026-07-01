"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPlayer, getRankings, getTeam } from "@/data/api";
import { fetchFanRanking, fetchMediaRanking } from "@/data/userData";
import type { Position, RankingEntry, RankingSource } from "@/data/types";
import { SOURCE_LABELS, SOURCE_ORDER, SOURCE_SHORT } from "@/store/rankings";
import { medalStyle } from "@/lib/medal";
import PlayerHeadshot from "../PlayerHeadshot";
import PositionTabs from "../PositionTabs";
import TeamLogo from "../TeamLogo";

// Section 2 — embedded rankings: a shared position selector, then the top 10 for
// Media / RSO Official / Fan side by side. Each row shows headshot · name · team
// plus the player's rank in the other two sources; each box links to the full
// 32-deep ranking.
export default function HomeRankings() {
  const [position, setPosition] = useState<Position>("QB");
  // Live Media (editor-set) and Fan (vote aggregate) rankings from Supabase,
  // tagged with their position so a pending fetch never shows the previous
  // position's players. null → fall back to the mock; for Fan an empty array
  // means "configured but no votes yet" (→ the "Waiting for all votes" state).
  const [remote, setRemote] = useState<{
    pos: Position;
    media: RankingEntry[] | null;
    fan: RankingEntry[] | null;
  }>({ pos: position, media: null, fan: null });

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMediaRanking(position), fetchFanRanking(position)]).then(
      ([media, fan]) => {
        if (!cancelled) setRemote({ pos: position, media, fan });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [position]);

  // Prefer the live Supabase ranking, else the mock. For Fan, an empty array
  // (no votes) is kept as-is so the column shows its "waiting" state instead of
  // the mock list.
  const loaded = remote.pos === position;
  const entriesFor = (s: RankingSource): RankingEntry[] => {
    if (s === "media" && loaded && remote.media) return remote.media;
    if (s === "fan" && loaded && remote.fan !== null) return remote.fan;
    return getRankings(position, s)?.entries ?? [];
  };

  // Rank lookups for every source so each row can show its cross-source ranks.
  const rankMaps = Object.fromEntries(
    SOURCE_ORDER.map((s) => [
      s,
      new Map(entriesFor(s).map((e) => [e.playerId, e.rank])),
    ]),
  ) as Record<RankingSource, Map<string, number | undefined>>;

  return (
    <div>
      <PositionTabs value={position} onChange={setPosition} className="mb-4" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SOURCE_ORDER.map((source) => {
          const entries = entriesFor(source);
          const otherSources = SOURCE_ORDER.filter((s) => s !== source);
          return (
            <div
              key={source}
              className="flex flex-col overflow-hidden rounded-lg border border-silver"
            >
              <div className="border-b border-silver bg-silver-light/50 px-3 py-2 text-sm font-bold text-ink">
                {SOURCE_LABELS[source]}
              </div>

              {entries.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-silver-deep">
                  {source === "fan"
                    ? "Waiting for all votes"
                    : "No ranking yet"}
                </div>
              ) : (
                <ol className="flex-1 divide-y divide-silver">
                  {entries.slice(0, 10).map((entry) => {
                    const player = getPlayer(entry.playerId);
                    if (!player) return null;
                    const team = getTeam(player.teamId);
                    return (
                      <li
                        key={entry.playerId}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-silver-light/50"
                      >
                        <span className="w-4 shrink-0 text-right text-xs font-bold tabular-nums text-silver-deep">
                          {entry.rank}
                        </span>
                        <Link
                          href={`/player/${player.id}`}
                          aria-label={player.name}
                          className="shrink-0"
                        >
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
                        {team && (
                          <Link
                            href={`/team/${team.id}`}
                            aria-label={team.name}
                            className="shrink-0"
                          >
                            <TeamLogo teamId={team.id} size={16} />
                          </Link>
                        )}
                        {/* Cross-source ranks */}
                        <div className="flex shrink-0">
                          {otherSources.map((s, i) => {
                            const crossRank = rankMaps[s].get(player.id);
                            return (
                              <div
                                key={s}
                                className={`px-1.5 text-center ${
                                  i > 0 ? "border-l border-silver" : ""
                                }`}
                              >
                                <div className="text-[8px] font-semibold uppercase leading-tight text-silver-deep">
                                  {SOURCE_SHORT[s]}
                                </div>
                                <div
                                  className="text-xs font-bold leading-tight tabular-nums text-silver-deep"
                                  style={medalStyle(crossRank)}
                                >
                                  {crossRank ?? "—"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}

              <Link
                href={`/rankings?source=${source}&position=${position}`}
                className="block border-t border-silver px-3 py-2 text-center text-xs font-bold text-silver-deep transition-colors hover:bg-silver-light hover:text-ink"
              >
                Show full 32
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
