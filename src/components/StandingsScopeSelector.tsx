"use client";

import { ChevronDown } from "lucide-react";
import type { StandingsScope } from "@/data/api";

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
// the full chip rows from `sm` up.
export default function StandingsScopeSelector({
  value,
  onChange,
  className = "",
}: {
  value: StandingsScope;
  onChange: (scope: StandingsScope) => void;
  className?: string;
}) {
  function chip(s: StandingsScope) {
    const active = value === s;
    return (
      <button
        key={s}
        type="button"
        onClick={() => onChange(s)}
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
    <div className={className}>
      {/* Mobile: dropdown */}
      <div className="relative inline-block sm:hidden">
        <select
          aria-label="Select standings view"
          value={value}
          onChange={(e) => onChange(e.target.value as StandingsScope)}
          className="appearance-none rounded-md border border-silver bg-white py-1.5 pl-3 pr-9 text-sm font-semibold text-ink outline-none transition-colors hover:border-silver-deep focus:border-silver-deep"
        >
          {ALL.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-silver-deep"
        />
      </div>

      {/* sm+: chip rows */}
      <div className="hidden sm:block">
        <div className="mb-2 flex flex-wrap gap-1.5">{PRIMARY.map(chip)}</div>
        <div className="flex flex-wrap gap-1.5">{DIVISIONS.map(chip)}</div>
      </div>
    </div>
  );
}
