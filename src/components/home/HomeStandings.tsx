"use client";

import { useState } from "react";
import type { StandingsScope } from "@/data/api";
import StandingsTable from "../StandingsTable";

const PRIMARY: StandingsScope[] = ["NFL", "AFC", "NFC"];
const DIVISIONS: StandingsScope[] = [
  "AFC East",
  "AFC North",
  "AFC South",
  "AFC West",
  "NFC East",
  "NFC North",
  "NFC South",
  "NFC West",
];

// Section 4 — embedded standings. Flip scope across NFL / conference / division.
export default function HomeStandings() {
  const [scope, setScope] = useState<StandingsScope>("AFC");

  function chip(s: StandingsScope) {
    const active = scope === s;
    return (
      <button
        key={s}
        type="button"
        onClick={() => setScope(s)}
        className={`shrink-0 rounded-full border px-3 py-1 text-sm font-semibold transition-colors ${
          active
            ? "border-ink bg-ink text-white"
            : "border-silver text-silver-deep hover:bg-silver-light hover:text-ink"
        }`}
      >
        {s}
      </button>
    );
  }

  return (
    <div>
      <div className="mb-2 flex gap-1.5">{PRIMARY.map(chip)}</div>
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {DIVISIONS.map(chip)}
      </div>
      <StandingsTable scope={scope} compact />
    </div>
  );
}
