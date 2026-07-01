"use client";

import { useState } from "react";
import type { StandingsScope } from "@/data/api";
import PageContainer from "@/components/PageContainer";
import PreseasonBadge from "@/components/PreseasonBadge";
import PowerRankings from "@/components/PowerRankings";
import StandingsTable from "@/components/StandingsTable";

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

export default function StandingsPage() {
  const [scope, setScope] = useState<StandingsScope>("NFL");

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
    <PageContainer className="pb-12">
      <section className="py-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-ink">Standings</h1>
          <PreseasonBadge />
        </div>

        <div className="mb-2 flex gap-1.5">{PRIMARY.map(chip)}</div>
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
          {DIVISIONS.map(chip)}
        </div>

        <StandingsTable scope={scope} />
      </section>

      <section className="pb-4">
        <div className="mb-3 border-b border-silver pb-2">
          <h2 className="text-2xl font-bold text-ink">Power Rankings</h2>
        </div>
        <PowerRankings />
      </section>
    </PageContainer>
  );
}
