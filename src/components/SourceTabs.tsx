"use client";

import type { RankingSource } from "@/data/types";
import { SOURCE_LABELS, SOURCE_ORDER } from "@/store/rankings";

// Ranking-source selector: Media · RSO Official · Fan. Underlined active tab to
// echo the site's header style. Controlled for reuse across pages.
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
    <div
      role="tablist"
      aria-label="Ranking source"
      className={`flex gap-6 border-b border-silver ${className}`}
    >
      {SOURCE_ORDER.map((source) => {
        const active = source === value;
        return (
          <button
            key={source}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(source)}
            className={`-mb-px border-b-2 px-1 pb-2 text-base font-bold transition-colors ${
              active
                ? "border-ink text-ink"
                : "border-transparent text-silver-deep hover:text-ink"
            }`}
          >
            {SOURCE_LABELS[source]}
          </button>
        );
      })}
    </div>
  );
}
