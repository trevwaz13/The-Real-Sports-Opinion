"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { getTeam } from "@/data/api";
import type { Game } from "@/data/types";
import GameCard from "../GameCard";
import SectionHeader from "../SectionHeader";
import Select from "../Select";

const INITIAL_GAMES = 6;

// A figure in the week summary row: label, then a proportional-figure value
// and a short note.
function StatTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="min-w-0 bg-surface px-5 py-4">
      <div className="text-sm text-silver-deep">{label}</div>
      <div className="font-display mt-1 text-3xl leading-none text-ink">{value}</div>
      {note && <div className="mt-1.5 truncate text-sm text-silver-deep">{note}</div>}
    </div>
  );
}

// Section 1: scores & matchups with a week selector (1-18). Games (with their
// precomputed leaders) are passed in so switching weeks is instant client-side.
// A summary row leads; the first six games show, the rest expand on request.
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
  const [showAll, setShowAll] = useState(false);
  const weekGames = games.filter((g) => g.week === week);
  const visible = showAll ? weekGames : weekGames.slice(0, INITIAL_GAMES);

  const played = weekGames.filter((g) => g.status === "final");
  const abbr = (id: string) => getTeam(id)?.abbreviation ?? id;
  const avgTotal =
    played.length > 0
      ? played.reduce((sum, g) => sum + g.homeScore + g.awayScore, 0) / played.length
      : 0;
  const topScore = played
    .flatMap((g) => [
      { team: g.homeTeamId, score: g.homeScore, opp: g.awayTeamId },
      { team: g.awayTeamId, score: g.awayScore, opp: g.homeTeamId },
    ])
    .sort((a, b) => b.score - a.score)[0];
  const closest = [...played].sort(
    (a, b) =>
      Math.abs(a.homeScore - a.awayScore) - Math.abs(b.homeScore - b.awayScore),
  )[0];

  return (
    <div>
      <SectionHeader title="Scores & Matchups">
        <Select
          label="Select week"
          value={week}
          options={weeks}
          onChange={(w) => {
            setWeek(w);
            setShowAll(false);
          }}
          format={(w) => `Week ${w}`}
        />
      </SectionHeader>

      {played.length > 0 && (
        <div className="panel mb-4 grid grid-cols-2 gap-px overflow-hidden !bg-silver lg:grid-cols-4">
          <StatTile label="Games" value={`${played.length}`} note={`Week ${week}, final`} />
          <StatTile
            label="Points per game"
            value={avgTotal.toFixed(1)}
            note="Both teams combined"
          />
          {topScore && (
            <StatTile
              label="High score"
              value={`${topScore.score}`}
              note={`${abbr(topScore.team)} vs ${abbr(topScore.opp)}`}
            />
          )}
          {closest && (
            <StatTile
              label="Closest finish"
              value={`${Math.abs(closest.homeScore - closest.awayScore)} pt${
                Math.abs(closest.homeScore - closest.awayScore) === 1 ? "" : "s"
              }`}
              note={`${abbr(closest.awayTeamId)} ${closest.awayScore}, ${abbr(closest.homeTeamId)} ${closest.homeScore}`}
            />
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      {weekGames.length > INITIAL_GAMES && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            aria-expanded={showAll}
            className="btn btn-outline"
          >
            {showAll ? "Show fewer games" : `Show all ${weekGames.length} games`}
            <ChevronDown
              size={16}
              className={`transition-transform ${showAll ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      )}
    </div>
  );
}
