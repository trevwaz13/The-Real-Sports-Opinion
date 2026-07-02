"use client";

import { useState } from "react";
import type { Game } from "@/data/types";
import GameCard from "../GameCard";

// Section 1 — scores & matchups with a week selector (1–18). Games (with their
// precomputed leaders) are passed in so switching weeks is instant client-side.
export default function WeekScores({
  games,
  weeks,
  defaultWeek,
}: {
  games: Game[];
  weeks: number[];
  defaultWeek: number;
}) {
  const [week, setWeek] = useState(defaultWeek);
  const weekGames = games.filter((g) => g.week === week);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {weeks.map((w) => {
          const active = w === week;
          return (
            <button
              key={w}
              type="button"
              onClick={() => setWeek(w)}
              className={`shrink-0 rounded-full border px-3 py-1 text-sm font-semibold transition-colors ${
                active
                  ? "border-ink bg-ink text-white"
                  : "border-silver text-silver-deep hover:bg-silver-light hover:text-ink"
              }`}
            >
              Wk {w}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {weekGames.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
