import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getFantasyLeaders,
  getPlayer,
  getPlayersByPosition,
  getRankings,
  getTeam,
} from "@/data/api";
import type { PlayerStats } from "@/data/types";
import { SOURCE_LABELS, SOURCE_ORDER } from "@/store/rankings";
import { STATS_COLUMNS, STAT_FULL_NAMES } from "@/lib/statsColumns";
import { STAT_LINES, formatStat } from "@/lib/statLines";
import { scorePlayer } from "@/lib/rsoScoring";
import { SEASON_YEAR } from "@/data/season";
import PageContainer from "@/components/PageContainer";
import PlayerHeadshot from "@/components/PlayerHeadshot";
import SectionHeader from "@/components/SectionHeader";
import TeamLogo from "@/components/TeamLogo";

const INJURY_LABEL: Record<string, string> = {
  questionable: "Questionable",
  doubtful: "Doubtful",
  out: "Out",
  ir: "Injured Reserve",
};

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = getPlayer(id);
  if (!player) notFound();
  const team = getTeam(player.teamId);
  const accent = team?.primaryColor ?? "#62646B";

  // Rank across the three sources + fantasy.
  const sourceRanks = SOURCE_ORDER.map((source) => ({
    source,
    rank: getRankings(player.position, source)?.entries.find(
      (e) => e.playerId === id,
    )?.rank,
  }));
  const fantasyRank =
    getFantasyLeaders(player.position, 999).findIndex(
      (f) => f.playerId === id,
    ) + 1;
  const top32 = sourceRanks.filter((r) => r.rank !== undefined && r.rank <= 32);

  const score = scorePlayer(player);
  const statTable = STATS_COLUMNS[player.position];

  const statRow = (stats: PlayerStats) =>
    statTable.columns.map((col) => (
      <td key={col.key} className="num px-2.5 py-2.5 text-right text-sm">
        {formatStat(stats[col.key], col.decimals)}
      </td>
    ));

  // Key season stats (where more is better) and where the player sits among
  // his position group.
  const LOWER_IS_BETTER = new Set(["interceptionsThrown", "fumbles"]);
  const peers = getPlayersByPosition(player.position);
  const glance = STAT_LINES[player.position]
    .filter((col) => !LOWER_IS_BETTER.has(col.key))
    .slice(0, 4)
    .map((col) => {
      const value = player.seasonStats[col.key] ?? 0;
      const values = peers.map((p) => p.seasonStats[col.key] ?? 0);
      const max = Math.max(...values, 0);
      const rank = values.filter((v) => v > value).length + 1;
      return { col, value, max, rank };
    });

  const rankTiles = [
    ...sourceRanks.map((r) => ({
      label: SOURCE_LABELS[r.source],
      rank: r.rank,
    })),
    { label: "Fantasy", rank: fantasyRank > 0 ? fantasyRank : undefined },
  ];

  return (
    <div>
      {/* Brushed-silver hero; the team color appears as a thin accent rule */}
      <div className="hero-silver relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: accent }}
        />
        <span
          aria-hidden
          className="font-display pointer-events-none absolute -bottom-14 right-2 select-none text-[12rem] leading-none text-ink/[0.045] sm:right-10 sm:text-[18rem]"
        >
          {player.jerseyNumber}
        </span>
        <PageContainer className="reveal relative flex flex-col gap-6 pb-10 pt-10 sm:flex-row sm:items-end sm:pt-14">
          <PlayerHeadshot
            playerId={player.id}
            name={player.name}
            size={124}
            className="!bg-surface shadow-float ring-1 ring-silver"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="tag bg-ink text-primary">{player.position}</span>
              <span className="tag border border-silver bg-surface text-ink">
                #{player.jerseyNumber}
              </span>
              {player.injuryStatus !== "healthy" && (
                <span className="tag bg-down/10 text-down">
                  {INJURY_LABEL[player.injuryStatus] ?? player.injuryStatus}
                </span>
              )}
            </div>
            <h1 className="font-display mt-3 text-4xl leading-[1.05] text-ink sm:text-6xl">
              {player.name}
            </h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-silver-deep">
              {team && (
                <Link
                  href={`/team/${team.id}`}
                  className="inline-flex items-center gap-2 font-medium text-ink hover:underline"
                >
                  <TeamLogo teamId={team.id} size={20} />
                  {team.city} {team.name}
                </Link>
              )}
              <span>Age {player.age}</span>
              <span>
                {player.yearsPro} yr{player.yearsPro === 1 ? "" : "s"} pro
              </span>
            </p>
          </div>
        </PageContainer>
      </div>

      <PageContainer>
        {/* Top-32 callout */}
        {top32.length > 0 && (
          <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="tag bg-ink text-primary">Top-32 player</span>
            <span className="text-silver-deep">
              Ranked{" "}
              {top32
                .map((r) => `#${r.rank} ${SOURCE_LABELS[r.source]}`)
                .join(", ")}
              {fantasyRank > 0 && fantasyRank <= 32
                ? `, #${fantasyRank} Fantasy`
                : ""}
              .
            </span>
          </p>
        )}

        {/* Season at a glance */}
        <section className="mt-10">
          <SectionHeader
            title={`${SEASON_YEAR} at a glance`}
            description={`Bars scale to the ${player.position} leader in each stat.`}
          />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {glance.map(({ col, value, max, rank }) => (
              <div key={col.key} className="panel px-5 py-4">
                <div className="text-sm text-silver-deep">{col.label}</div>
                <div className="font-display mt-1 text-3xl leading-none text-ink">
                  {formatStat(value, col.decimals)}
                </div>
                <div
                  className="meter mt-4"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={max}
                  aria-valuenow={value}
                  aria-label={`${col.label} relative to position leader`}
                  style={
                    {
                      "--value": max > 0 ? (value / max) * 100 : 0,
                    } as React.CSSProperties
                  }
                />
                <div className="mt-2 text-xs text-silver-deep">
                  #{rank} of {peers.length} {player.position}s
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Position rankings */}
        <section className="mt-10">
          <SectionHeader title={`${player.position} Rankings`} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {rankTiles.map((tile) => (
              <div key={tile.label} className="panel px-5 py-4">
                <div className="text-sm text-silver-deep">{tile.label}</div>
                <div className="font-display mt-1 flex items-center gap-2 text-4xl leading-none text-ink">
                  {tile.rank ? (
                    <>
                      <span>
                        <span className="text-silver-deep">#</span>
                        {tile.rank}
                      </span>
                      {tile.rank <= 3 && (
                        <span className="chrome tag ml-1 text-[11px]">
                          Top 3
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-silver-deep">-</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RSO scoring breakdown */}
        <section className="mt-12">
          <SectionHeader title="RSO Score Breakdown" />
          <div className="grid gap-3 lg:grid-cols-12">
            <div className="panel p-5 lg:col-span-5">
              <h3 className="mb-2 flex items-baseline justify-between">
                <span className="font-semibold">Production</span>
                <span className="num font-semibold">
                  {score.productionSubtotal}
                </span>
              </h3>
              <ul className="divide-y divide-silver/70 text-sm">
                {score.production.map((line) => (
                  <li
                    key={line.stat}
                    className="flex justify-between gap-2 py-2"
                  >
                    <span className="text-silver-deep">
                      {STAT_FULL_NAMES[line.stat] ?? line.stat}{" "}
                      <span className="num text-xs">
                        ({line.value} × {line.multiplier})
                      </span>
                    </span>
                    <span className="num font-medium text-ink">
                      {line.points > 0 ? "+" : ""}
                      {line.points}
                    </span>
                  </li>
                ))}
                {score.availabilityAdjustment > 0 && (
                  <li className="flex justify-between gap-2 py-2">
                    <span className="text-silver-deep">
                      Availability{" "}
                      <span className="text-xs">
                        (prorated to 17 games, played {score.gamesPlayed})
                      </span>
                    </span>
                    <span className="num font-medium text-up">
                      +{score.availabilityAdjustment}
                    </span>
                  </li>
                )}
              </ul>
            </div>

            <div className="panel p-5 lg:col-span-4">
              <h3 className="mb-2 flex items-baseline justify-between">
                <span className="font-semibold">Bonuses</span>
                <span className="num font-semibold">
                  +{score.bonusTotal.toFixed(1)}
                </span>
              </h3>
              {score.bonuses.length === 0 ? (
                <p className="py-2 text-sm text-silver-deep">
                  No bonuses earned.
                </p>
              ) : (
                <ul className="divide-y divide-silver/70 text-sm">
                  {score.bonuses.map((b) => (
                    <li
                      key={b.label}
                      className="flex justify-between gap-2 py-2"
                    >
                      <span className="text-silver-deep">
                        {b.label}{" "}
                        <span className="num text-xs">({b.value})</span>
                      </span>
                      <span className="num font-medium text-up">
                        +{b.points}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="hero-silver flex flex-col justify-between rounded-[14px] border border-silver p-5 lg:col-span-3">
              <span className="text-sm text-silver-deep">RSO total</span>
              <span className="font-display mt-6 text-6xl leading-none text-ink">
                {score.total}
              </span>
              <span className="mt-3 text-xs text-silver-deep">
                Production {score.productionSubtotal} + bonuses{" "}
                {score.bonusTotal.toFixed(1)}
              </span>
            </div>
          </div>
        </section>

        {/* Season & career stats */}
        <section className="mt-12">
          <SectionHeader title="Stats" />
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-silver">
                  <th className="label px-4 py-3 text-left font-medium">
                    Split
                  </th>
                  {statTable.columns.map((col) => (
                    <th
                      key={col.key}
                      title={STAT_FULL_NAMES[col.key]}
                      className="label whitespace-nowrap px-2.5 py-3 text-right font-medium"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-silver-light/60">
                  <td className="px-4 py-2.5 text-sm font-medium text-ink">
                    {SEASON_YEAR} Season
                  </td>
                  {statRow(player.seasonStats)}
                </tr>
                <tr className="border-t border-silver/60 text-silver-deep hover:bg-silver-light/60">
                  <td className="px-4 py-2.5 text-sm font-medium text-ink">
                    Career
                  </td>
                  {statRow(player.careerStats)}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </PageContainer>
    </div>
  );
}
