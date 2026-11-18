import Link from "next/link";
import { getTeam, type StatLeader } from "@/data/api";
import PlayerHeadshot from "./PlayerHeadshot";
import TeamLogo from "./TeamLogo";

// A single stat category: the leader gets a larger headshot and figure; the
// chasers carry a meter scaled to the leader's value so the gap reads at a
// glance. Players and teams are clickable.
export default function StatLeaderCard({
  title,
  leaders,
  decimals = 0,
}: {
  title: string;
  leaders: StatLeader[];
  decimals?: number;
}) {
  const fmt = (v: number) =>
    decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString();
  const [first, ...rest] = leaders;
  const max = first?.value || 1;

  return (
    <div className="panel flex h-full flex-col p-4">
      <h3 className="text-sm font-medium text-silver-deep">{title}</h3>
      {first && (
        <div className="mt-3 flex items-center gap-3">
          <Link href={`/player/${first.player.id}`} className="shrink-0">
            <PlayerHeadshot
              playerId={first.player.id}
              name={first.player.name}
              size={44}
            />
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={`/player/${first.player.id}`}
              className="block truncate font-semibold leading-tight text-ink hover:underline"
            >
              {first.player.name}
            </Link>
            <span className="text-xs text-silver-deep">
              {getTeam(first.player.teamId)?.abbreviation}
            </span>
          </div>
          <span className="font-display text-[1.75rem] leading-none text-ink">
            {fmt(first.value)}
          </span>
        </div>
      )}
      <ol start={2} className="mt-3 space-y-2 border-t border-silver pt-3">
        {rest.map((leader, i) => {
          const team = getTeam(leader.player.teamId);
          return (
            <li key={leader.player.id}>
              <div className="flex items-center gap-2">
                <span className="num w-3 shrink-0 text-xs text-silver-deep">
                  {i + 2}
                </span>
                <Link
                  href={`/player/${leader.player.id}`}
                  className="min-w-0 flex-1 truncate text-sm text-ink hover:underline"
                >
                  {leader.player.name}
                </Link>
                {team && (
                  <Link href={`/team/${team.id}`} aria-label={team.name}>
                    <TeamLogo teamId={team.id} size={18} />
                  </Link>
                )}
                <span className="num w-14 shrink-0 text-right text-sm text-ink">
                  {fmt(leader.value)}
                </span>
              </div>
              <div
                className="meter meter-soft ml-5 mt-1.5"
                style={
                  {
                    "--value": (leader.value / max) * 100,
                  } as React.CSSProperties
                }
                aria-hidden
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
