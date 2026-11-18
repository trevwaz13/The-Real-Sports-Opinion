"use client";

import { useState } from "react";
import type { StandingsScope } from "@/data/api";
import Select from "../Select";
import StandingsTable from "../StandingsTable";

const SCOPES: StandingsScope[] = [
  "NFL",
  "AFC",
  "NFC",
  "AFC East",
  "AFC North",
  "AFC South",
  "AFC West",
  "NFC East",
  "NFC North",
  "NFC South",
  "NFC West",
];

// Section 4: embedded standings. Flip scope across NFL / conference / division.
// The home column is narrow, so this uses the dropdown at every width.
export default function HomeStandings() {
  const [scope, setScope] = useState<StandingsScope>("AFC");

  return (
    <div>
      <Select
        label="Select standings view"
        value={scope}
        options={SCOPES}
        onChange={setScope}
        className="mb-4"
      />
      <StandingsTable scope={scope} compact />
    </div>
  );
}
