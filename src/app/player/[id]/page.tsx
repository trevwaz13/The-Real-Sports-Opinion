import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getFantasyLeaders,
  getPlayer,
  getRankings,
  getTeam,
} from "@/data/api";
import type { PlayerStats } from "@/data/types";
import { SOURCE_LABELS, SOURCE_ORDER } from "@/store/rankings";
import { STATS_COLUMNS, STAT_FULL_NAMES } from "@/lib/statsColumns";
import { formatStat } from "@/lib/statLines";
import { scorePlayer } from "@/lib/rsoScoring";
import PageContainer from "@/components/PageContainer";
import PlayerHeadshot from "@/components/PlayerHeadshot";
import TeamLogo from "@/components/TeamLogo";

function readableOn(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#0A0A0A" : "#FFFFFF";
}

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
  const accent = team?.primaryColor ?? "#0A0A0A";
  const text = readableOn(accent);

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
      <td key={col.key} className="px-2.5 py-2 text-center tabular-nums">
        {formatStat(stats[col.key], col.decimals)}
      </td>
    ));

  return (
    <div className="pb-12">
      {/* Color-accented header */}
      <div style={{ backgroundColor: accent, color: text }}>
        <PageContainer className="flex items-center gap-4 py-6">
          <div className="rounded-full bg-white p-1 shadow">
            <PlayerHeadshot playerId={player.id} name={player.name} size={72} />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold">{player.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm opacity-90">
              <span>
                {player.position} · #{player.jerseyNumber}
              </span>
              {team && (
                <Link
                  href={`/team/${team.id}`}
                  className="inline-flex items-center gap-1.5 hover:underline"
                >
                  <TeamLogo teamId={team.id} size={18} />
                  {team.city} {team.name}
                </Link>
              )}
              <span>· Age {player.age}</span>
              <span>· {player.yearsPro} yr{player.yearsPro === 1 ? "" : "s"}</span>
            </p>
          </div>
          {player.injuryStatus !== "healthy" && (
            <span className="ml-auto rounded-md bg-white/90 px-2.5 py-1 text-xs font-bold uppercase text-red-600">
              {INJURY_LABEL[player.injuryStatus] ?? player.injuryStatus}
            </span>
          )}
        </PageContainer>
      </div>

      <PageContainer>
        {/* Top-32 callout */}
        {top32.length > 0 && (
          <div className="mt-6 rounded-lg border border-silver bg-silver-light/50 px-4 py-3 text-sm">
            <span className="font-bold text-ink">Top-32 player.</span>{" "}
            <span className="text-silver-deep">
              Ranked{" "}
              {top32
                .map((r) => `#${r.rank} ${SOURCE_LABELS[r.source]}`)
                .join(" · ")}
              {fantasyRank > 0 && fantasyRank <= 32
                ? ` · #${fantasyRank} Fantasy`
                : ""}
              .
            </span>
          </div>
        )}

        {/* Position rankings */}
        <h2 className="mb-3 mt-8 border-b border-silver pb-2 text-2xl font-bold text-ink">
          {player.position} Rankings
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {sourceRanks.map((r) => (
            <div
              key={r.source}
              className="rounded-lg border border-silver px-3 py-3 text-center"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-silver-deep">
                {SOURCE_LABELS[r.source]}
              </div>
              <div className="text-2xl font-black tabular-nums text-ink">
                {r.rank ? `#${r.rank}` : "—"}
              </div>
            </div>
          ))}
          <div className="rounded-lg border border-silver px-3 py-3 text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-silver-deep">
              Fantasy
            </div>
            <div className="text-2xl font-black tabular-nums text-ink">
              {fantasyRank > 0 ? `#${fantasyRank}` : "—"}
            </div>
          </div>
        </div>

        {/* RSO scoring breakdown */}
        <h2 className="mb-3 mt-8 border-b border-silver pb-2 text-2xl font-bold text-ink">
          RSO Score Breakdown
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-silver p-4">
            <h3 className="mb-2 flex items-center justify-between text-sm font-bold uppercase tracking-wide text-silver-deep">
              Production
              <span className="tabular-nums text-ink">
                {score.productionSubtotal}
              </span>
            </h3>
            <ul className="space-y-1 text-sm">
              {score.production.map((line) => (
                <li key={line.stat} className="flex justify-between gap-2">
                  <span className="text-silver-deep">
                    {STAT_FULL_NAMES[line.stat] ?? line.stat}{" "}
                    <span className="text-xs">
                      ({line.value} × {line.multiplier})
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums text-ink">
                    {line.points > 0 ? "+" : ""}
                    {line.points}
                  </span>
                </li>
              ))}
              {score.availabilityAdjustment > 0 && (
                <li className="flex justify-between gap-2 border-t border-silver pt-1">
                  <span className="text-silver-deep">
                    Availability{" "}
                    <span className="text-xs">
                      (prorated to {17} games · played {score.gamesPlayed})
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums text-emerald-700">
                    +{score.availabilityAdjustment}
                  </span>
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-lg border border-silver p-4">
            <h3 className="mb-2 flex items-center justify-between text-sm font-bold uppercase tracking-wide text-silver-deep">
              Bonuses
              <span className="tabular-nums text-ink">
                +{score.bonusTotal.toFixed(1)}
              </span>
            </h3>
            {score.bonuses.length === 0 ? (
              <p className="text-sm text-silver-deep">No bonuses earned.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {score.bonuses.map((b) => (
                  <li key={b.label} className="flex justify-between gap-2">
                    <span className="text-silver-deep">
                      {b.label}{" "}
                      <span className="text-xs">({b.value})</span>
                    </span>
                    <span className="font-semibold tabular-nums text-emerald-700">
                      +{b.points}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex justify-between border-t border-silver pt-2 text-sm font-bold">
              <span className="text-ink">RSO Total</span>
              <span className="tabular-nums text-ink">{score.total}</span>
            </div>
          </div>
        </div>

        {/* Season & career stats */}
        <h2 className="mb-3 mt-8 border-b border-silver pb-2 text-2xl font-bold text-ink">
          Stats
        </h2>
        <div className="overflow-x-auto rounded-lg border border-silver">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-silver bg-silver-light/50 text-xs uppercase text-silver-deep">
                <th className="px-3 py-2 text-left font-semibold">Split</th>
                {statTable.columns.map((col) => (
                  <th
                    key={col.key}
                    title={STAT_FULL_NAMES[col.key]}
                    className="px-2.5 py-2 text-center font-semibold"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-silver">
              <tr className="hover:bg-silver-light/40">
                <td className="px-3 py-2 font-semibold text-ink">2025 Season</td>
                {statRow(player.seasonStats)}
              </tr>
              <tr className="hover:bg-silver-light/40">
                <td className="px-3 py-2 font-semibold text-ink">Career</td>
                {statRow(player.careerStats)}
              </tr>
            </tbody>
          </table>
        </div>
      </PageContainer>
    </div>
  );
}
