import type { Team } from "@/data/types";

// RSO Official team power ranking — a small, data-driven engine mirroring the
// player scoring style. A team's power score is a weighted blend of winning
// percentage and strength of schedule (rewarding quality of wins).

export function winPct(team: Team): number {
  const { wins, losses, ties } = team.record;
  const games = wins + losses + ties;
  return games === 0 ? 0 : (wins + 0.5 * ties) / games;
}

interface PowerMetricDef {
  label: string;
  weight: number;
  value: (team: Team) => number; // expected ~0..1
}

// Encoded as data: each metric contributes value × weight.
export const POWER_METRICS: PowerMetricDef[] = [
  { label: "Win %", weight: 70, value: winPct },
  {
    label: "Strength of Schedule",
    weight: 30,
    value: (t) => t.strengthOfSchedule,
  },
];

export interface PowerMetric {
  label: string;
  value: number;
  weight: number;
  points: number;
}

export interface TeamPowerScore {
  teamId: string;
  total: number;
  metrics: PowerMetric[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function scoreTeam(team: Team): TeamPowerScore {
  const metrics = POWER_METRICS.map((m) => {
    const value = m.value(team);
    return {
      label: m.label,
      value,
      weight: m.weight,
      points: round1(value * m.weight),
    };
  });
  return {
    teamId: team.id,
    total: round1(metrics.reduce((s, m) => s + m.points, 0)),
    metrics,
  };
}

/** Rank teams by RSO power score (desc), id as a stable tiebreak. */
export function rankTeamsByPower(teams: Team[]): TeamPowerScore[] {
  return teams
    .map(scoreTeam)
    .sort((a, b) => b.total - a.total || a.teamId.localeCompare(b.teamId));
}
