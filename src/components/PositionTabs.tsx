"use client";

import { POSITIONS, type Position } from "@/data/types";

// Horizontal position selector (QB, RB, WR, …). Controlled so it can be reused
// on the full rankings page and the embedded home module.
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
    <div
      role="tablist"
      aria-label="Position"
      className={`flex gap-1.5 overflow-x-auto pb-1 ${className}`}
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
                ? "border-ink bg-ink text-white"
                : "border-silver text-silver-deep hover:bg-silver-light hover:text-ink"
            }`}
          >
            {position}
          </button>
        );
      })}
    </div>
  );
}
