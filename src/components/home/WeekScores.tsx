"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
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
      <div className="relative mb-3 inline-block">
        <select
          aria-label="Select week"
          value={week}
          onChange={(e) => setWeek(Number(e.target.value))}
          className="appearance-none rounded-md border border-silver bg-surface py-1.5 pl-3 pr-9 text-sm font-semibold text-ink outline-none transition-colors hover:border-silver-deep focus:border-silver-deep"
        >
          {weeks.map((w) => (
            <option key={w} value={w}>
              Week {w}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-silver-deep"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {weekGames.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
