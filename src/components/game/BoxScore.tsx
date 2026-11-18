import Link from "next/link";
import { getPlayer, getTeam } from "@/data/api";
import type { GameStatLine, StatCategory, TeamBoxScore } from "@/data/types";
import TeamLogo from "../TeamLogo";

const COLUMNS: Record<
  StatCategory,
  { label: string; render: (s: GameStatLine) => string }[]
> = {
  passing: [
    { label: "C/ATT", render: (s) => `${s.completions ?? 0}/${s.attempts ?? 0}` },
    { label: "YDS", render: (s) => `${s.passYds ?? 0}` },
    { label: "TD", render: (s) => `${s.passTD ?? 0}` },
    { label: "INT", render: (s) => `${s.passInt ?? 0}` },
  ],
  rushing: [
    { label: "CAR", render: (s) => `${s.carries ?? 0}` },
    { label: "YDS", render: (s) => `${s.rushYds ?? 0}` },
    { label: "TD", render: (s) => `${s.rushTD ?? 0}` },
  ],
  receiving: [
    { label: "REC", render: (s) => `${s.receptions ?? 0}` },
    { label: "YDS", render: (s) => `${s.recYds ?? 0}` },
    { label: "TD", render: (s) => `${s.recTD ?? 0}` },
    { label: "TGT", render: (s) => `${s.targets ?? 0}` },
  ],
  defense: [
    { label: "TKL", render: (s) => `${s.tackles ?? 0}` },
    { label: "SACK", render: (s) => `${(s.sacks ?? 0).toFixed(1)}` },
    { label: "INT", render: (s) => `${s.defInt ?? 0}` },
  ],
};

const CATEGORY_TITLE: Record<StatCategory, string> = {
  passing: "Passing",
  rushing: "Rushing",
  receiving: "Receiving",
  defense: "Defense",
};

function StatTable({
  category,
  rows,
}: {
  category: StatCategory;
  rows: GameStatLine[];
}) {
  if (rows.length === 0) return null;
  const cols = COLUMNS[category];
  return (
    <div>
      <h4 className="mb-2 text-sm font-medium text-silver-deep">
        {CATEGORY_TITLE[category]}
      </h4>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[320px]">
          <thead>
            <tr className="border-b border-silver">
              <th className="label px-4 py-2.5 text-left font-medium">Player</th>
              {cols.map((c) => (
                <th key={c.label} className="label px-2 py-2 text-right font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const player = getPlayer(row.playerId);
              return (
                <tr key={row.playerId} className="border-t border-silver/60 first:border-t-0 hover:bg-silver-light/60">
                  <td className="px-4 py-2">
                    <Link
                      href={`/player/${row.playerId}`}
                      className="text-sm font-medium text-ink hover:underline"
                    >
                      {player?.name ?? row.playerId}
                    </Link>
                  </td>
                  {cols.map((c) => (
                    <td
                      key={c.label}
                      className="num px-2 py-2 text-right text-sm"
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeamBox({ box }: { box: TeamBoxScore }) {
  const team = getTeam(box.teamId);
  return (
    <div className="space-y-4">
      <h3 className="font-display flex items-center gap-3 text-xl text-ink">
        {team && <TeamLogo teamId={team.id} size={30} />}
        {team ? `${team.city} ${team.name}` : box.teamId}
      </h3>
      <StatTable category="passing" rows={box.passing} />
      <StatTable category="rushing" rows={box.rushing} />
      <StatTable category="receiving" rows={box.receiving} />
      <StatTable category="defense" rows={box.defense} />
    </div>
  );
}

// Full box score — both teams, every category. Player names are clickable.
export default function BoxScore({
  home,
  away,
}: {
  home: TeamBoxScore;
  away: TeamBoxScore;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <TeamBox box={away} />
      <TeamBox box={home} />
    </div>
  );
}
