import { notFound } from "next/navigation";
import Link from "next/link";
import { getRoster, getTeam } from "@/data/api";
import { POSITIONS, type Position } from "@/data/types";
import { STATS_COLUMNS } from "@/lib/statsColumns";
import { formatStat } from "@/lib/statLines";
import PageContainer from "@/components/PageContainer";
import PlayerHeadshot from "@/components/PlayerHeadshot";
import TeamLogo from "@/components/TeamLogo";

// Black or white text depending on the background's luminance.
function readableOn(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#0A0A0A" : "#FFFFFF";
}

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

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-silver px-3 py-2 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-silver-deep">
        {label}
      </div>
      <div className="text-lg font-bold tabular-nums text-ink">{value}</div>
    </div>
  );
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = getTeam(id);
  if (!team) notFound();

  const roster = getRoster(id);
  const text = readableOn(team.primaryColor);
  const rec = team.record;
  const recStr = `${rec.wins}-${rec.losses}${rec.ties ? `-${rec.ties}` : ""}`;
  const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

  return (
    <div className="pb-12">
      {/* Color-accented header */}
      <div style={{ backgroundColor: team.primaryColor, color: text }}>
        <PageContainer className="flex items-center gap-4 py-6">
          <div className="rounded-full bg-white p-1.5 shadow">
            <TeamLogo teamId={team.id} size={64} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {team.city} {team.name}
            </h1>
            <p className="mt-1 text-sm opacity-90">
              {team.conference} {team.division} · {recStr}
            </p>
          </div>
          <div
            className="ml-auto hidden h-12 w-2 rounded-full sm:block"
            style={{ backgroundColor: team.secondaryColor }}
          />
        </PageContainer>
      </div>

      <PageContainer>
        {/* Team stats */}
        <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
          <StatBox label="Points For" value={`${team.pointsFor}`} />
          <StatBox label="Points Against" value={`${team.pointsAgainst}`} />
          <StatBox label="Diff" value={signed(team.pointDifferential)} />
          <StatBox label="Home" value={`${team.homeRecord.wins}-${team.homeRecord.losses}`} />
          <StatBox label="Away" value={`${team.awayRecord.wins}-${team.awayRecord.losses}`} />
          <StatBox label="SOS" value={team.strengthOfSchedule.toFixed(3)} />
        </div>

        {/* Roster grouped by position */}
        <h2 className="mb-3 mt-8 border-b border-silver pb-2 text-2xl font-bold text-ink">
          Roster
        </h2>
        <div className="space-y-6">
          {POSITIONS.map((position) => {
            const players = roster[position];
            if (!players || players.length === 0) return null;
            const statKey = STATS_COLUMNS[position].defaultSort;
            const statCol = STATS_COLUMNS[position].columns.find(
              (c) => c.key === statKey,
            );
            return (
              <div key={position}>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-silver-deep">
                  {POSITION_LABELS[position]}
                </h3>
                <div className="overflow-hidden rounded-lg border border-silver">
                  <ul className="divide-y divide-silver">
                    {players.map((player) => (
                      <li
                        key={player.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-silver-light/50"
                      >
                        <Link href={`/player/${player.id}`} className="shrink-0">
                          <PlayerHeadshot
                            playerId={player.id}
                            name={player.name}
                            size={34}
                          />
                        </Link>
                        <Link
                          href={`/player/${player.id}`}
                          className="flex-1 truncate font-semibold text-ink hover:underline"
                        >
                          <span className="text-silver-deep">
                            #{player.jerseyNumber}
                          </span>{" "}
                          {player.name}
                        </Link>
                        {player.injuryStatus !== "healthy" && (
                          <span className="shrink-0 text-xs font-bold uppercase text-amber-600">
                            {player.injuryStatus}
                          </span>
                        )}
                        <span className="w-24 shrink-0 text-right text-sm tabular-nums text-silver-deep">
                          {statCol?.label}:{" "}
                          <span className="font-bold text-ink">
                            {formatStat(player.seasonStats[statKey], statCol?.decimals)}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </PageContainer>
    </div>
  );
}
