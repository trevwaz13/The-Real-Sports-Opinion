import Link from "next/link";
import { getPlayer, getTeam } from "@/data/api";
import type { GameStatLine, StatCategory, TeamBoxScore } from "@/data/types";

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
      <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-silver-deep">
        {CATEGORY_TITLE[category]}
      </h4>
      <div className="overflow-x-auto rounded-lg border border-silver">
        <table className="w-full min-w-[320px] text-sm">
          <thead>
            <tr className="border-b border-silver text-[10px] uppercase text-silver-deep">
              <th className="px-3 py-1.5 text-left font-semibold">Player</th>
              {cols.map((c) => (
                <th key={c.label} className="px-2 py-1.5 text-center font-semibold">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-silver">
            {rows.map((row) => {
              const player = getPlayer(row.playerId);
              return (
                <tr key={row.playerId}>
                  <td className="px-3 py-1.5">
                    <Link
                      href={`/player/${row.playerId}`}
                      className="font-semibold text-ink hover:underline"
                    >
                      {player?.name ?? row.playerId}
                    </Link>
                  </td>
                  {cols.map((c) => (
                    <td
                      key={c.label}
                      className="px-2 py-1.5 text-center tabular-nums"
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
      <h3 className="text-lg font-bold text-ink">
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
