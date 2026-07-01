import Link from "next/link";
import { getTeam, type StatLeader } from "@/data/api";
import PlayerHeadshot from "./PlayerHeadshot";
import TeamLogo from "./TeamLogo";

// A single stat category with its top leaders (clickable players + teams).
export default function StatLeaderCard({
  title,
  leaders,
  decimals = 0,
}: {
  title: string;
  leaders: StatLeader[];
  decimals?: number;
}) {
  return (
    <div className="rounded-lg border border-silver p-3">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-silver-deep">
        {title}
      </h3>
      <ol className="space-y-2">
        {leaders.map((leader, i) => {
          const team = getTeam(leader.player.teamId);
          return (
            <li key={leader.player.id} className="flex items-center gap-2">
              <span className="w-4 shrink-0 text-sm font-bold tabular-nums text-silver-deep">
                {i + 1}
              </span>
              <Link href={`/player/${leader.player.id}`} className="shrink-0">
                <PlayerHeadshot
                  playerId={leader.player.id}
                  name={leader.player.name}
                  size={28}
                />
              </Link>
              <Link
                href={`/player/${leader.player.id}`}
                className="min-w-0 flex-1 truncate text-sm font-semibold text-ink hover:underline"
              >
                {leader.player.name}
              </Link>
              {team && (
                <Link href={`/team/${team.id}`} aria-label={team.name}>
                  <TeamLogo teamId={team.id} size={18} />
                </Link>
              )}
              <span className="w-12 shrink-0 text-right text-sm font-bold tabular-nums text-ink">
                {decimals > 0
                  ? leader.value.toFixed(decimals)
                  : Math.round(leader.value)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
