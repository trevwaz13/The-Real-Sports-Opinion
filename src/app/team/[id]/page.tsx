import { notFound } from "next/navigation";
import Link from "next/link";
import { getRoster, getTeam } from "@/data/api";
import { POSITIONS, type Position } from "@/data/types";
import { STATS_COLUMNS } from "@/lib/statsColumns";
import { formatStat } from "@/lib/statLines";
import PageContainer from "@/components/PageContainer";
import PlayerHeadshot from "@/components/PlayerHeadshot";
import SectionHeader from "@/components/SectionHeader";
import TeamLogo from "@/components/TeamLogo";

const POSITION_LABELS: Record<Position, string> = {
  QB: "Quarterbacks",
  RB: "Running Backs",
  WR: "Wide Receivers",
  TE: "Tight Ends",
  EDGE: "Edge Rushers",
  DT: "Defensive Tackles",
  LB: "Linebackers",
  CB: "Cornerbacks",
  S: "Safeties",
};

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = getTeam(id);
  if (!team) notFound();

  const roster = getRoster(id);
  const rec = team.record;
  const recStr = `${rec.wins}-${rec.losses}${rec.ties ? `-${rec.ties}` : ""}`;
  const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

  const stats: { label: string; value: string; tone?: string }[] = [
    { label: "Points for", value: `${team.pointsFor}` },
    { label: "Points against", value: `${team.pointsAgainst}` },
    {
      label: "Diff",
      value: signed(team.pointDifferential),
      tone:
        team.pointDifferential > 0
          ? "text-up"
          : team.pointDifferential < 0
            ? "text-down"
            : undefined,
    },
    {
      label: "Home",
      value: `${team.homeRecord.wins}-${team.homeRecord.losses}`,
    },
    {
      label: "Away",
      value: `${team.awayRecord.wins}-${team.awayRecord.losses}`,
    },
    { label: "SOS", value: team.strengthOfSchedule.toFixed(3) },
  ];

  return (
    <div>
      {/* Brushed-silver hero; the team's primary color is the accent rule */}
      <div className="hero-silver relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: team.primaryColor }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 top-1/2 hidden -translate-y-1/2 opacity-[0.07] grayscale sm:block"
        >
          <TeamLogo teamId={team.id} size={420} />
        </div>
        <PageContainer className="reveal relative flex flex-col gap-6 pb-10 pt-10 sm:flex-row sm:items-end sm:pt-14">
          <div className="grid h-28 w-28 shrink-0 place-items-center rounded-[22px] border border-silver bg-white shadow-float">
            <TeamLogo teamId={team.id} size={80} />
          </div>
          <div>
            <span className="tag border border-silver bg-surface text-ink">
              {team.conference} {team.division}
            </span>
            <h1 className="font-display mt-3 text-4xl leading-[1.05] text-ink sm:text-6xl">
              {team.city} {team.name}
            </h1>
          </div>
          <div className="sm:ml-auto sm:text-right">
            <div className="text-sm text-silver-deep">Record</div>
            <div className="font-display text-5xl leading-none text-ink">
              {recStr}
            </div>
          </div>
        </PageContainer>
      </div>

      <PageContainer>
        {/* Team stats */}
        <dl className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {stats.map((s) => (
            <div key={s.label} className="panel px-4 py-3.5">
              <dt className="text-xs text-silver-deep">{s.label}</dt>
              <dd
                className={`mt-1 text-2xl font-semibold tracking-tight ${s.tone ?? "text-ink"}`}
              >
                {s.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* Roster grouped by position */}
        <section className="mt-12">
          <SectionHeader title="Roster" />
          <div className="gap-4 md:columns-2">
            {POSITIONS.map((position) => {
              const players = roster[position];
              if (!players || players.length === 0) return null;
              const statKey = STATS_COLUMNS[position].defaultSort;
              const statCol = STATS_COLUMNS[position].columns.find(
                (c) => c.key === statKey,
              );
              return (
                <div
                  key={position}
                  className="panel mb-4 break-inside-avoid p-3"
                >
                  <h3 className="flex items-baseline justify-between px-2 pb-1.5 pt-1">
                    <span className="font-semibold text-ink">
                      {POSITION_LABELS[position]}
                    </span>
                    <span className="label">{statCol?.label}</span>
                  </h3>
                  <ul>
                    {players.map((player) => (
                      <li
                        key={player.id}
                        className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-silver-light"
                      >
                        <span className="num w-6 shrink-0 text-right text-xs text-silver-deep">
                          {player.jerseyNumber}
                        </span>
                        <Link
                          href={`/player/${player.id}`}
                          className="shrink-0"
                        >
                          <PlayerHeadshot
                            playerId={player.id}
                            name={player.name}
                            size={32}
                          />
                        </Link>
                        <Link
                          href={`/player/${player.id}`}
                          className="min-w-0 flex-1 truncate text-sm font-medium text-ink hover:underline"
                        >
                          {player.name}
                        </Link>
                        {player.injuryStatus !== "healthy" && (
                          <span className="tag shrink-0 bg-warn/10 uppercase text-warn">
                            {player.injuryStatus}
                          </span>
                        )}
                        <span className="num w-14 shrink-0 text-right text-sm font-medium text-ink">
                          {formatStat(
                            player.seasonStats[statKey],
                            statCol?.decimals,
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      </PageContainer>
    </div>
  );
}
