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

// Standings for a scope. `compact` (home) drops the home/away columns; the full
// Phase 7 page shows everything. Team logos and names are clickable.
export default function StandingsTable({
  scope = "NFL",
  compact = false,
}: {
  scope?: StandingsScope;
  compact?: boolean;
}) {
  const teams = getStandings(scope);

  return (
    <div className="overflow-x-auto rounded-lg border border-silver">
      <table className="w-full min-w-[300px] text-sm sm:min-w-[420px]">
        <thead>
          <tr className="border-b border-silver text-xs uppercase text-silver-deep">
            <th className="px-3 py-2 text-left font-semibold">Team</th>
            <th className="px-2 py-2 text-center font-semibold">W</th>
            <th className="px-2 py-2 text-center font-semibold">L</th>
            <th className="px-2 py-2 text-center font-semibold">T</th>
            <th className="px-2 py-2 text-center font-semibold">PCT</th>
            <th className="hidden px-2 py-2 text-center font-semibold sm:table-cell">
              PF
            </th>
            <th className="hidden px-2 py-2 text-center font-semibold sm:table-cell">
              PA
            </th>
            <th className="px-2 py-2 text-center font-semibold">DIFF</th>
            {!compact && (
              <>
                <th className="px-2 py-2 text-center font-semibold">HOME</th>
                <th className="px-2 py-2 text-center font-semibold">AWAY</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-silver">
          {teams.map((team, i) => (
            <tr key={team.id} className="hover:bg-silver-light/50">
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="w-4 shrink-0 text-xs font-bold tabular-nums text-silver-deep">
                    {i + 1}
                  </span>
                  <Link
                    href={`/team/${team.id}`}
                    aria-label={team.name}
                    className="shrink-0"
                  >
                    <TeamLogo teamId={team.id} size={22} />
                  </Link>
                  <Link
                    href={`/team/${team.id}`}
                    className="truncate font-semibold text-ink hover:underline"
                  >
                    <span className="hidden sm:inline">{team.city} </span>
                    {team.name}
                  </Link>
                </div>
              </td>
              <td className="px-2 py-2 text-center tabular-nums">
                {team.record.wins}
              </td>
              <td className="px-2 py-2 text-center tabular-nums">
                {team.record.losses}
              </td>
              <td className="px-2 py-2 text-center tabular-nums">
                {team.record.ties}
              </td>
              <td className="px-2 py-2 text-center tabular-nums">{pct(team)}</td>
              <td className="hidden px-2 py-2 text-center tabular-nums sm:table-cell">
                {team.pointsFor}
              </td>
              <td className="hidden px-2 py-2 text-center tabular-nums sm:table-cell">
                {team.pointsAgainst}
              </td>
              <td
                className={`px-2 py-2 text-center font-semibold tabular-nums ${
                  team.pointDifferential > 0
                    ? "text-emerald-700"
                    : team.pointDifferential < 0
                      ? "text-red-600"
                      : "text-silver-deep"
                }`}
              >
                {signed(team.pointDifferential)}
              </td>
              {!compact && (
                <>
                  <td className="px-2 py-2 text-center tabular-nums text-silver-deep">
                    {rec(team.homeRecord)}
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums text-silver-deep">
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
