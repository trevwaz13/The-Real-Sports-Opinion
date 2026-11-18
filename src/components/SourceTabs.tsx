"use client";

import type { RankingSource } from "@/data/types";
import { SOURCE_LABELS, SOURCE_ORDER } from "@/store/rankings";

// Ranking-source selector: Media, RSO Official, Fan. Controlled for reuse
// across pages.
export default function SourceTabs({
  value,
  onChange,
  className = "",
}: {
  value: RankingSource;
  onChange: (source: RankingSource) => void;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label="Ranking source" className={`tabs ${className}`}>
      {SOURCE_ORDER.map((source) => (
        <button
          key={source}
          role="tab"
          aria-selected={source === value}
          onClick={() => onChange(source)}
          className="tab"
        >
          {SOURCE_LABELS[source]}
        </button>
      ))}
    </div>
  );
}
