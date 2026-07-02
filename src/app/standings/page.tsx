"use client";

import { useState } from "react";
import type { StandingsScope } from "@/data/api";
import PageContainer from "@/components/PageContainer";
import PreseasonBadge from "@/components/PreseasonBadge";
import PowerRankings from "@/components/PowerRankings";
import StandingsScopeSelector from "@/components/StandingsScopeSelector";
import StandingsTable from "@/components/StandingsTable";

export default function StandingsPage() {
  const [scope, setScope] = useState<StandingsScope>("NFL");

  return (
    <PageContainer className="pb-12">
      <section className="py-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-ink">Standings</h1>
          <PreseasonBadge />
        </div>

        <StandingsScopeSelector
          value={scope}
          onChange={setScope}
          className="mb-4"
        />

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
