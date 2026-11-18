import type { Position } from "@/data/types";

// The lineup a GM fills: nineteen starters across offense and defense.
export const SALARY_CAP = 240; // $M of average annual value

export const LINEUP: {
  position: Position;
  count: number;
  unit: "Offense" | "Defense";
}[] = [
  { position: "QB", count: 1, unit: "Offense" },
  { position: "RB", count: 2, unit: "Offense" },
  { position: "WR", count: 3, unit: "Offense" },
  { position: "TE", count: 1, unit: "Offense" },
  { position: "EDGE", count: 2, unit: "Defense" },
  { position: "DT", count: 2, unit: "Defense" },
  { position: "LB", count: 3, unit: "Defense" },
  { position: "CB", count: 3, unit: "Defense" },
  { position: "S", count: 2, unit: "Defense" },
];

export const TOTAL_SLOTS = LINEUP.reduce((sum, row) => sum + row.count, 0);

/** Stable slot ids, e.g. "WR-2". */
export const SLOT_IDS: { id: string; position: Position; unit: string }[] =
  LINEUP.flatMap(({ position, count, unit }) =>
    Array.from({ length: count }, (_, i) => ({
      id: `${position}-${i + 1}`,
      position,
      unit,
    })),
  );

export const STORAGE_KEY = "rso-gm-roster";

/** A lineup's letter grade from its total RSO score.
 *
 *  Calibrated against what the pool actually allows: the best lineup money can
 *  buy with no cap scores about 3,800 (and costs ~$480M), the best lineup that
 *  fits under the cap scores about 3,100, and a bargain-hunting roster of
 *  cheap producers lands near 2,100. */
export function gradeFor(score: number): { grade: string; note: string } {
  if (score >= 3000) return { grade: "A+", note: "Super Bowl favorite" };
  if (score >= 2750) return { grade: "A", note: "Conference contender" };
  if (score >= 2450) return { grade: "B+", note: "Playoff team" };
  if (score >= 2100) return { grade: "B", note: "In the wild-card hunt" };
  if (score >= 1700) return { grade: "C", note: "Middle of the pack" };
  if (score >= 1200) return { grade: "D", note: "Rebuilding" };
  return { grade: "F", note: "Top of the draft order" };
}

/** Roughly the strongest lineup that fits under the cap; used to scale the
 *  score meter so a full roster reads as a share of what is achievable. */
export const TARGET_SCORE = 3100;
