import Link from "next/link";
import { getStandings, type StandingsScope } from "@/data/api";
import type { Team, WinLossRecord } from "@/data/types";
import TeamLogo from "./TeamLogo";

function rec(r: WinLossRecord): string {
  return r.ties ? `${r.wins}-${r.losses}-${r.ties}` : `${r.wins}-${r.losses}`;
}

function pct(team: Team): string {
  const { wins, losses, ties } = team.record;
  const g = wins + losses + ties;
  const p = g === 0 ? 0 : (wins + 0.5 * ties) / g;
  return p.toFixed(3).replace(/^0/, "");
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

// Standings for a scope. `compact` (home) drops the PF/PA and home/away
// columns; the full page shows everything. Team logos and names are clickable.
export default function StandingsTable({
  scope = "NFL",
  compact = false,
}: {
  scope?: StandingsScope;
  compact?: boolean;
}) {
  const teams = getStandings(scope);
  const th = "label px-2 py-2.5 text-right font-medium";
  const td = "num px-2 py-2 text-right text-sm";

  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[320px]">
        <thead>
          <tr className="border-b border-silver">
            <th className="label px-4 py-2.5 text-left font-medium">Team</th>
            <th className={th}>W</th>
            <th className={th}>L</th>
            <th className={th}>T</th>
            <th className={th}>Pct</th>
            {!compact && (
              <>
                <th className={`${th} hidden sm:table-cell`}>PF</th>
                <th className={`${th} hidden sm:table-cell`}>PA</th>
              </>
            )}
            {!compact && (
              <th className={`${th} hidden w-28 lg:table-cell`}>
                <span className="sr-only">Win percentage bar</span>
              </th>
            )}
            <th className={`${th} pr-4`}>Diff</th>
            {!compact && (
              <>
                <th className={`${th} hidden md:table-cell`}>Home</th>
                <th className={`${th} hidden pr-4 md:table-cell`}>Away</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {teams.map((team, i) => (
            <tr
              key={team.id}
              className="border-t border-silver/60 transition-colors first:border-t-0 hover:bg-silver-light/60"
            >
              <td className="px-4 py-2">
                <div className="flex items-center gap-2.5">
                  <span className="num w-5 shrink-0 text-right text-xs text-silver-deep">
                    {i + 1}
                  </span>
                  <Link
                    href={`/team/${team.id}`}
                    aria-label={team.name}
                    className="shrink-0"
                  >
                    <TeamLogo teamId={team.id} size={24} />
                  </Link>
                  <Link
                    href={`/team/${team.id}`}
                    className="truncate text-sm font-medium text-ink hover:underline"
                  >
                    {!compact && (
                      <span className="hidden font-normal text-silver-deep lg:inline">
                        {team.city}{" "}
                      </span>
                    )}
                    {team.name}
                  </Link>
                </div>
              </td>
              <td className={`${td} font-semibold text-ink`}>{team.record.wins}</td>
              <td className={td}>{team.record.losses}</td>
              <td className={`${td} text-silver-deep`}>{team.record.ties}</td>
              <td className={td}>{pct(team)}</td>
              {!compact && (
                <>
                  <td className={`${td} hidden text-silver-deep sm:table-cell`}>
                    {team.pointsFor}
                  </td>
                  <td className={`${td} hidden text-silver-deep sm:table-cell`}>
                    {team.pointsAgainst}
                  </td>
                </>
              )}
              {!compact && (
                <td className="hidden px-2 lg:table-cell" aria-hidden>
                  <div
                    className="meter"
                    style={{ "--value": Number(pct(team)) * 100 } as React.CSSProperties}
                  />
                </td>
              )}
              <td
                className={`${td} pr-4 font-medium ${
                  team.pointDifferential > 0
                    ? "text-up"
                    : team.pointDifferential < 0
                      ? "text-down"
                      : "text-silver-deep"
                }`}
              >
                {signed(team.pointDifferential)}
              </td>
              {!compact && (
                <>
                  <td className={`${td} hidden text-silver-deep md:table-cell`}>
                    {rec(team.homeRecord)}
                  </td>
                  <td className={`${td} hidden pr-4 text-silver-deep md:table-cell`}>
                    {rec(team.awayRecord)}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
