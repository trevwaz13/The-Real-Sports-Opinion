"use client";

import { ChevronDown } from "lucide-react";

// Square native select used for compact pickers (week, position on phones,
// standings scope on phones).
export default function Select<T extends string | number>({
  label,
  value,
  options,
  onChange,
  format = (v) => String(v),
  className = "",
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  format?: (value: T) => string;
  className?: string;
}) {
  return (
    <div className={`relative inline-block ${className}`}>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          const match = options.find((o) => String(o) === raw);
          if (match !== undefined) onChange(match);
        }}
        className="field appearance-none !rounded-full py-1.5 pl-3.5 pr-9 text-sm font-medium"
      >
        {options.map((o) => (
          <option key={String(o)} value={String(o)}>
            {format(o)}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-silver-deep"
      />
    </div>
  );
}
