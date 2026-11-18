"use client";

import type { StandingsScope } from "@/data/api";
import Select from "./Select";

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
const ALL: StandingsScope[] = [...PRIMARY, ...DIVISIONS];

// Standings scope selector (NFL / conference / division). Controlled and shared
// by the home module and the full standings page. A compact dropdown on phones;
// league/conference and division strips from `sm` up.
export default function StandingsScopeSelector({
  value,
  onChange,
  className = "",
}: {
  value: StandingsScope;
  onChange: (scope: StandingsScope) => void;
  className?: string;
}) {
  const cell = (s: StandingsScope) => (
    <button
      key={s}
      type="button"
      data-active={value === s}
      aria-pressed={value === s}
      onClick={() => onChange(s)}
    >
      {s}
    </button>
  );

  return (
    <div className={className}>
      <Select
        label="Select standings view"
        value={value}
        options={ALL}
        onChange={onChange}
        className="sm:hidden"
      />
      <div className="hidden flex-wrap items-center gap-x-4 gap-y-2 sm:flex">
        <div className="chips">{PRIMARY.map((s) => cell(s))}</div>
        <span aria-hidden className="h-5 w-px bg-silver" />
        <div className="chips">
          {DIVISIONS.map((s) => cell(s))}
        </div>
      </div>
    </div>
  );
}
