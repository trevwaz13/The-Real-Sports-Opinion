"use client";

import { useState } from "react";
import type { StandingsScope } from "@/data/api";
import StandingsScopeSelector from "../StandingsScopeSelector";
import StandingsTable from "../StandingsTable";

// Section 4 — embedded standings. Flip scope across NFL / conference / division.
export default function HomeStandings() {
  const [scope, setScope] = useState<StandingsScope>("AFC");

  return (
    <div>
      <StandingsScopeSelector
        value={scope}
        onChange={setScope}
        className="mb-3"
      />
      <StandingsTable scope={scope} compact />
    </div>
  );
}
