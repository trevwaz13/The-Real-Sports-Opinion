"use client";

import { useState } from "react";
import type { StandingsScope } from "@/data/api";
import PageContainer from "@/components/PageContainer";
import PageHeading from "@/components/PageHeading";
import PowerRankings from "@/components/PowerRankings";
import SectionHeader from "@/components/SectionHeader";
import StandingsScopeSelector from "@/components/StandingsScopeSelector";
import StandingsTable from "@/components/StandingsTable";

export default function StandingsPage() {
  const [scope, setScope] = useState<StandingsScope>("NFL");

  return (
    <PageContainer>
      <PageHeading title="Standings" badge />

      <section className="pb-14">
        <StandingsScopeSelector
          value={scope}
          onChange={setScope}
          className="mb-4"
        />
        <StandingsTable scope={scope} />
      </section>

      <section>
        <SectionHeader title="Power Rankings" />
        <PowerRankings />
      </section>
    </PageContainer>
  );
}
