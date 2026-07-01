import Link from "next/link";
import { getPlayer, getRankings, getTeam } from "@/data/api";
import type { Position, RankingEntry, RankingSource } from "@/data/types";
import { SOURCE_ORDER, SOURCE_SHORT } from "@/store/rankings";
import { medalStyle } from "@/lib/medal";
import { STAT_LINES, formatStat } from "@/lib/statLines";
import PlayerHeadshot from "./PlayerHeadshot";
import TeamLogo from "./TeamLogo";

// Renders a position ranking as rows. Reused by the full /rankings page and the
// embedded home-page module. Every player and team is a clickable link.
//   - Left: plain rank number.
//   - Middle: headshot, name, then the player's key position stats spread
//     evenly across the row with divider lines between them.
//   - Right: the player's rank in the OTHER two sources — gold/silver/bronze
//     when that rank is 1/2/3.
export default function RankingTable({
  position,
  source,
  limit = 32,
  highlightId,
  entriesOverride,
}: {
  position: Position;
  source: RankingSource;
  limit?: number;
  highlightId?: string;
  // Real entries (e.g. live Fan aggregate from Supabase) instead of the mock.
  entriesOverride?: RankingEntry[];
}) {
  const allEntries =
    entriesOverride ?? getRankings(position, source)?.entries ?? [];

  if (allEntries.length === 0) {
    return (
      <div className="rounded-lg border border-silver bg-silver-light/40 px-4 py-10 text-center text-silver-deep">
        {source === "fan" ? "Waiting for all votes" : "No ranking available."}
      </div>
    );
  }

  // Rank lookups for every source so each row can show its cross-source ranks.
  const rankMaps = Object.fromEntries(
    SOURCE_ORDER.map((s) => [
      s,
      new Map(
        (s === source ? allEntries : getRankings(position, s)?.entries)?.map(
          (e) => [e.playerId, e.rank],
        ),
      ),
    ]),
  ) as Record<RankingSource, Map<string, number | undefined>>;

  const otherSources = SOURCE_ORDER.filter((s) => s !== source);
  const columns = STAT_LINES[position];
  const entries = allEntries.slice(0, limit);

  return (
    <div className="overflow-hidden rounded-lg border border-silver">
      <ul className="divide-y divide-silver">
        {entries.map((entry) => {
          const player = getPlayer(entry.playerId);
          if (!player) return null;
          const team = getTeam(player.teamId);

          return (
            <li
              key={entry.playerId}
              id={`rank-${player.id}`}
              className={`flex items-center gap-3 px-3 py-2 sm:px-4 ${
                highlightId === player.id
                  ? "bg-silver-light ring-2 ring-inset ring-ink/30"
                  : "hover:bg-silver-light/50"
              }`}
            >
              <span className="w-6 shrink-0 text-center text-sm font-bold tabular-nums text-silver-deep">
                {entry.rank}
              </span>

              <Link
                href={`/player/${player.id}`}
                className="shrink-0"
                aria-label={player.name}
              >
                <PlayerHeadshot
                  playerId={player.id}
                  name={player.name}
                  size={36}
                />
              </Link>

              {/* Name / team — fixed-ish width so the stat strip can fill the rest. */}
              <div className="w-32 shrink-0 sm:w-44">
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/player/${player.id}`}
                    className="truncate font-semibold text-ink hover:underline"
                  >
                    {player.name}
                  </Link>
                  {team && (
                    <Link href={`/team/${team.id}`} aria-label={team.name}>
                      <TeamLogo teamId={team.id} size={16} />
                    </Link>
                  )}
                </div>
                <span className="text-xs text-silver-deep">
                  {player.position}
                  {team ? ` · ${team.abbreviation}` : ""}
                </span>
              </div>

              {/* Position stat line — centered, evenly spread, divider lines. */}
              <div className="flex flex-1 items-center">
                {columns.map((col) => {
                  const value = player.seasonStats[col.key];
                  if (col.hideIfZero && (!value || value === 0)) return null;
                  return (
                    <div
                      key={col.key}
                      className="min-w-0 flex-1 border-l border-silver px-1 text-center first:border-l-0"
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-silver-deep">
                        {col.label}
                      </div>
                      <div className="text-sm font-bold tabular-nums text-ink">
                        {formatStat(value, col.decimals)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cross-source ranks (the two sources not currently selected). */}
              <div className="flex shrink-0 pl-2">
                {otherSources.map((s) => {
                  const rank = rankMaps[s].get(player.id);
                  return (
                    <Link
                      key={s}
                      href={`/rankings?source=${s}&position=${position}&player=${player.id}`}
                      aria-label={`View ${player.name} in ${SOURCE_SHORT[s]} rankings`}
                      className="border-l border-silver px-2.5 text-center transition-colors first:border-l-0 hover:bg-silver-light sm:px-3"
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-silver-deep">
                        {SOURCE_SHORT[s]}
                      </div>
                      <div
                        className="text-sm font-bold tabular-nums text-silver-deep underline-offset-2 hover:underline"
                        style={medalStyle(rank)}
                      >
                        {rank ?? "—"}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
