import Link from "next/link";
import { getPlayer, getRankings, getTeam } from "@/data/api";
import type { Position, RankingEntry, RankingSource } from "@/data/types";
import { SOURCE_ORDER, SOURCE_SHORT } from "@/store/rankings";
import { medalClass } from "@/lib/medal";
import { STAT_LINES, formatStat } from "@/lib/statLines";
import PlayerHeadshot from "./PlayerHeadshot";
import TeamLogo from "./TeamLogo";

// Renders a position ranking as rows. Reused by the full /rankings page and the
// embedded home-page module. Every player and team is a clickable link.
//   - Left: rank number (top 3 on a chrome badge).
//   - Middle: headshot, name, then the player's key position stats.
//   - Right: the player's rank in the OTHER two sources, in chrome tiers
//     when that rank is 1/2/3.
export default function RankingTable({
  position,
  source,
  limit = 32,
  highlightId,
  entriesOverride,
  podium = false,
}: {
  position: Position;
  source: RankingSource;
  limit?: number;
  highlightId?: string;
  // Real entries (e.g. live Fan aggregate from Supabase) instead of the mock.
  entriesOverride?: RankingEntry[];
  // Set ranks 1-3 as feature cards above the list (full rankings page).
  podium?: boolean;
}) {
  const allEntries =
    entriesOverride ?? getRankings(position, source)?.entries ?? [];

  if (allEntries.length === 0) {
    return (
      <div className="panel px-4 py-14 text-center">
        <p className="font-display text-xl text-ink">
          {source === "fan" ? "Waiting for all votes" : "No ranking available"}
        </p>
        {source === "fan" && (
          <p className="mt-1 text-sm text-silver-deep">
            The Fan ranking appears once ballots come in.
          </p>
        )}
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
  // With `podium`, ranks 1-3 are set as feature cards above the list.
  const top = podium ? entries.slice(0, 3) : [];
  const listed = podium ? entries.slice(3) : entries;

  const crossRanks = (playerId: string, playerName: string, compact = false) =>
    otherSources.map((s) => {
      const rank = rankMaps[s].get(playerId);
      return (
        <Link
          key={s}
          href={`/rankings?source=${s}&position=${position}&player=${playerId}`}
          aria-label={`View ${playerName} in ${SOURCE_SHORT[s]} rankings`}
          className={`rounded-lg text-center transition-colors hover:bg-silver-light ${
            compact ? "w-12 py-0.5" : "flex-1 py-1.5"
          }`}
        >
          <div className="text-[11px] text-silver-deep">{SOURCE_SHORT[s]}</div>
          <div
            className={`num text-sm font-medium text-silver-deep ${medalClass(rank)}`}
          >
            {rank ?? "-"}
          </div>
        </Link>
      );
    });

  return (
    <div className="space-y-4">
      {top.length > 0 && (
        <ol className="grid gap-3 md:grid-cols-3">
          {top.map((entry) => {
            const player = getPlayer(entry.playerId);
            if (!player) return null;
            const team = getTeam(player.teamId);
            return (
              <li
                key={entry.playerId}
                id={`rank-${player.id}`}
                className={`panel panel-hover relative flex scroll-mt-28 flex-col overflow-hidden ${
                  highlightId === player.id ? "!border-ink" : ""
                }`}
              >
                <div className="hero-silver flex items-center gap-4 px-5 pb-4 pt-5">
                  <Link
                    href={`/player/${player.id}`}
                    className="relative shrink-0"
                  >
                    <PlayerHeadshot
                      playerId={player.id}
                      name={player.name}
                      size={72}
                      className="!bg-surface ring-1 ring-silver"
                    />
                    <span className="chrome num absolute -right-1 -top-1 grid h-8 w-8 place-items-center rounded-full text-sm font-semibold">
                      {entry.rank}
                    </span>
                  </Link>
                  <div className="min-w-0">
                    <Link
                      href={`/player/${player.id}`}
                      className="font-display block truncate text-xl leading-tight text-ink hover:underline"
                    >
                      {player.name}
                    </Link>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-silver-deep">
                      {team && (
                        <Link href={`/team/${team.id}`} aria-label={team.name}>
                          <TeamLogo teamId={team.id} size={18} />
                        </Link>
                      )}
                      {player.position}, {team?.abbreviation}
                    </div>
                  </div>
                </div>
                <dl className="grid grid-cols-3 gap-px border-y border-silver bg-silver">
                  {columns.slice(0, 3).map((col) => (
                    <div key={col.key} className="bg-surface px-4 py-3">
                      <dt className="text-xs text-silver-deep">{col.label}</dt>
                      <dd className="mt-0.5 text-lg font-semibold text-ink">
                        {formatStat(player.seasonStats[col.key], col.decimals)}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="flex px-3 py-2">
                  {crossRanks(player.id, player.name)}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {listed.length > 0 && (
        <div className="panel overflow-hidden">
          <ul>
            {listed.map((entry) => {
              const player = getPlayer(entry.playerId);
              if (!player) return null;
              const team = getTeam(player.teamId);
              const onPodium = entry.rank !== undefined && entry.rank <= 3;

              return (
                <li
                  key={entry.playerId}
                  id={`rank-${player.id}`}
                  className={`flex scroll-mt-28 flex-wrap items-center gap-x-3 gap-y-2 border-t border-silver/70 px-3 py-3 first:border-t-0 sm:flex-nowrap sm:gap-4 sm:px-5 ${
                    highlightId === player.id
                      ? "bg-silver-light"
                      : "transition-colors hover:bg-silver-light/60"
                  }`}
                >
                  <span
                    className={`num order-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                      onPodium ? "chrome" : "text-silver-deep"
                    }`}
                  >
                    {entry.rank}
                  </span>

                  <Link
                    href={`/player/${player.id}`}
                    className="order-2 shrink-0"
                    aria-label={player.name}
                  >
                    <PlayerHeadshot
                      playerId={player.id}
                      name={player.name}
                      size={40}
                    />
                  </Link>

                  {/* Name / team: grows on mobile, fixed width beside the stat strip on desktop. */}
                  <div className="order-3 min-w-0 flex-1 sm:w-48 sm:flex-none">
                    <Link
                      href={`/player/${player.id}`}
                      className="block truncate font-semibold leading-tight text-ink hover:underline"
                    >
                      {player.name}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      {team && (
                        <Link href={`/team/${team.id}`} aria-label={team.name}>
                          <TeamLogo teamId={team.id} size={16} />
                        </Link>
                      )}
                      <span className="text-xs text-silver-deep">
                        {player.position}, {team?.abbreviation}
                      </span>
                    </div>
                  </div>

                  {/* Position stat line: own row on mobile, inline on desktop. */}
                  <div className="order-5 grid basis-full auto-cols-fr grid-flow-col gap-2 sm:order-4 sm:basis-auto sm:flex-1">
                    {columns.map((col) => {
                      const value = player.seasonStats[col.key];
                      if (col.hideIfZero && (!value || value === 0))
                        return null;
                      return (
                        <div key={col.key} className="min-w-0 text-center">
                          <div className="truncate text-[11px] text-silver-deep">
                            {col.label}
                          </div>
                          <div className="num text-sm font-medium text-ink">
                            {formatStat(value, col.decimals)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cross-source ranks (the two sources not currently selected). */}
                  <div className="order-4 flex shrink-0 gap-1 sm:order-5">
                    {crossRanks(player.id, player.name, true)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
