"use client";

import { ChevronDown } from "lucide-react";
import { POSITIONS, type Position } from "@/data/types";

// Position selector (QB, RB, WR, …). Controlled so it can be reused on the full
// rankings page and the embedded home module. A compact dropdown on phones; the
// full pill row from `sm` up.
export default function PositionTabs({
  value,
  onChange,
  className = "",
}: {
  value: Position;
  onChange: (position: Position) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      {/* Mobile: dropdown */}
      <div className="relative inline-block sm:hidden">
        <select
          aria-label="Select position"
          value={value}
          onChange={(e) => onChange(e.target.value as Position)}
          className="appearance-none rounded-md border border-silver bg-surface py-1.5 pl-3 pr-9 text-sm font-semibold text-ink outline-none transition-colors hover:border-silver-deep focus:border-silver-deep"
        >
          {POSITIONS.map((position) => (
            <option key={position} value={position}>
              {position}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-silver-deep"
        />
      </div>

      {/* sm+: pill tabs */}
      <div
        role="tablist"
        aria-label="Position"
        className="hidden flex-wrap gap-1.5 sm:flex"
      >
        {POSITIONS.map((position) => {
          const active = position === value;
          return (
            <button
              key={position}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(position)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                active
                  ? "border-ink bg-ink text-primary"
                  : "border-silver text-silver-deep hover:bg-silver-light hover:text-ink"
              }`}
            >
              {position}
            </button>
          );
        })}
      </div>
    </div>
  );
}
