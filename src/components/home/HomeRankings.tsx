"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getPlayer, getRankings, getTeam } from "@/data/api";
import { fetchFanRanking, fetchMediaRanking } from "@/data/userData";
import type { Position, RankingEntry, RankingSource } from "@/data/types";
import { SOURCE_LABELS, SOURCE_ORDER, SOURCE_SHORT } from "@/store/rankings";
import { medalClass } from "@/lib/medal";
import PlayerHeadshot from "../PlayerHeadshot";
import PositionTabs from "../PositionTabs";
import TeamLogo from "../TeamLogo";

// Section 2: embedded rankings. A shared position selector, then the top 10 for
// Media / RSO Official / Fan side by side. Each row shows headshot, name, team
// plus the player's rank in the other two sources; each column links to the
// full 32-deep ranking.
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SOURCE_ORDER.map((source) => {
          const entries = entriesFor(source);
          const otherSources = SOURCE_ORDER.filter((s) => s !== source);
          return (
            <div key={source} className="panel flex flex-col overflow-hidden">
              <div className="flex items-baseline justify-between gap-2 px-4 pb-2 pt-4">
                <h3 className="font-display text-lg leading-none text-ink">
                  {SOURCE_LABELS[source]}
                </h3>
                <div className="flex">
                  {otherSources.map((s) => (
                    <span key={s} className="label w-9 text-center normal-case tracking-normal">
                      {SOURCE_SHORT[s]}
                    </span>
                  ))}
                </div>
              </div>

              {entries.length === 0 ? (
                <div className="flex flex-1 items-center justify-center px-4 py-10 text-sm text-silver-deep">
                  {source === "fan" ? "Waiting for all votes" : "No ranking yet"}
                </div>
              ) : (
                <ol className="flex-1 px-2">
                  {entries.slice(0, 10).map((entry) => {
                    const player = getPlayer(entry.playerId);
                    if (!player) return null;
                    const team = getTeam(player.teamId);
                    return (
                      <li
                        key={entry.playerId}
                        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-silver-light"
                      >
                        <span className="num w-4 shrink-0 text-right text-xs text-silver-deep">
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
                            size={28}
                          />
                        </Link>
                        <Link
                          href={`/player/${player.id}`}
                          className="min-w-0 flex-1 truncate text-sm font-medium text-ink hover:underline"
                        >
                          {player.name}
                        </Link>
                        {team && (
                          <Link
                            href={`/team/${team.id}`}
                            aria-label={team.name}
                            className="shrink-0"
                          >
                            <TeamLogo teamId={team.id} size={18} />
                          </Link>
                        )}
                        {/* Cross-source ranks */}
                        <div className="flex shrink-0">
                          {otherSources.map((s) => {
                            const crossRank = rankMaps[s].get(player.id);
                            return (
                              <span
                                key={s}
                                aria-label={`${SOURCE_SHORT[s]} rank ${crossRank ?? "none"}`}
                                className={`num w-9 text-center text-sm text-silver-deep ${medalClass(crossRank)}`}
                              >
                                {crossRank ?? "-"}
                              </span>
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
                className="group mt-2 flex items-center justify-between border-t border-silver px-4 py-3 text-sm font-medium text-silver-deep transition-colors hover:bg-silver-light hover:text-ink"
              >
                Full top 32
                <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
