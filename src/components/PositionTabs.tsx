"use client";

import { POSITIONS, type Position } from "@/data/types";
import Select from "./Select";

// Position selector (QB, RB, WR, …). Controlled so it can be reused on the full
// rankings page and the embedded home module. A compact dropdown on phones; a
// chip row from `sm` up.
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
      <Select
        label="Select position"
        value={value}
        options={POSITIONS}
        onChange={onChange}
        className="sm:hidden"
      />
      <div role="tablist" aria-label="Position" className="chips hidden sm:flex">
        {POSITIONS.map((position) => (
          <button
            key={position}
            role="tab"
            aria-selected={position === value}
            onClick={() => onChange(position)}
          >
            {position}
          </button>
        ))}
      </div>
    </div>
  );
}
