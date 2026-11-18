"use client";

import { useState } from "react";
import { getStatLeaders } from "@/data/api";
import type { PlayerStats } from "@/data/types";
import StatLeaderCard from "../StatLeaderCard";

type Category = { key: keyof PlayerStats; title: string; decimals?: number };

const YARDS_CATS: Category[] = [
  { key: "passYds", title: "Passing Yards" },
  { key: "rushYds", title: "Rushing Yards" },
  { key: "recYds", title: "Receiving Yards" },
  { key: "totalTackles", title: "Tackles" },
  { key: "sacks", title: "Sacks", decimals: 1 },
  { key: "interceptions", title: "Interceptions" },
];

const TD_CATS: Category[] = [
  { key: "passTD", title: "Passing TDs" },
  { key: "rushTD", title: "Rushing TDs" },
  { key: "recTD", title: "Receiving TDs" },
];

// Section 3: stat leaders (top 3 per category). Toggle swaps the whole section
// between yardage/defense leaders and touchdown leaders.
export default function HomeStats() {
  const [mode, setMode] = useState<"yards" | "td">("yards");
  const cats = mode === "yards" ? YARDS_CATS : TD_CATS;

  return (
    <div>
      <div role="tablist" aria-label="Stat group" className="tabs mb-5">
        {(["yards", "td"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className="tab"
          >
            {m === "yards" ? "Yards & Defense" : "Touchdowns"}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {cats.map((cat, i) => (
          // An odd count leaves the first card spanning the full row.
          <div
            key={cat.key}
            className={cats.length % 2 === 1 && i === 0 ? "sm:col-span-2" : ""}
          >
            <StatLeaderCard
              title={cat.title}
              leaders={getStatLeaders(cat.key, 3)}
              decimals={cat.decimals}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
