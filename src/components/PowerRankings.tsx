"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import {
  getPowerRanking,
  getTeam,
  type PowerRankingEntry,
  type PowerSource,
} from "@/data/api";
import { fetchMediaPowerRanking } from "@/data/userData";
import TeamLogo from "./TeamLogo";

const SOURCES: { key: PowerSource; label: string }[] = [
  { key: "rso", label: "RSO Official" },
  { key: "media", label: "Media" },
];

function Movement({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span
        aria-label="No change"
        className="flex w-9 items-center justify-center text-silver-deep"
      >
        <Minus size={12} />
      </span>
    );
  }
  const up = value > 0;
  return (
    <span
      aria-label={`${up ? "Up" : "Down"} ${Math.abs(value)}`}
      className={`num flex w-9 items-center justify-center gap-0.5 text-xs font-medium ${
        up ? "text-up" : "text-down"
      }`}
    >
      {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      {Math.abs(value)}
    </span>
  );
}

// RSO Official (computed from win% + strength of schedule) and Media (editor-set)
// team power rankings, with weekly movement arrows. Team logos/names clickable.
export default function PowerRankings() {
  const [source, setSource] = useState<PowerSource>("rso");
  // Editor-set Media order from Supabase (null → use the mock).
  const [mediaOverride, setMediaOverride] = useState<PowerRankingEntry[] | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    fetchMediaPowerRanking().then((r) => {
      if (!cancelled) setMediaOverride(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const entries =
    source === "media" && mediaOverride
      ? mediaOverride
      : getPowerRanking(source);

  return (
    <div>
      <div role="tablist" aria-label="Power ranking source" className="tabs mb-4">
        {SOURCES.map((s) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={source === s.key}
            onClick={() => setSource(s.key)}
            className="tab"
          >
            {s.label}
          </button>
        ))}
      </div>

      {source === "rso" && (
        <p className="mb-4 text-sm text-silver-deep">
          Computed from winning percentage and strength of schedule (quality of
          wins).
        </p>
      )}

      <ol className="panel grid grid-cols-[minmax(0,1fr)] gap-x-2 p-2 sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-[repeat(16,auto)]">
        {entries.map((entry) => {
          const team = getTeam(entry.teamId);
          if (!team) return null;
          const { wins, losses, ties } = team.record;
          return (
            <li
              key={entry.teamId}
              className="flex min-w-0 items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-silver-light"
            >
              <span
                className={`num grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                  entry.rank <= 3 ? "chrome" : "text-silver-deep"
                }`}
              >
                {entry.rank}
              </span>
              <Movement value={entry.movement} />
              <Link
                href={`/team/${team.id}`}
                aria-label={team.name}
                className="shrink-0"
              >
                <TeamLogo teamId={team.id} size={28} />
              </Link>
              <Link
                href={`/team/${team.id}`}
                className="min-w-0 flex-1 truncate font-medium text-ink hover:underline"
              >
                {team.city} {team.name}
              </Link>
              <span className="num shrink-0 text-xs text-silver-deep">
                {wins}-{losses}
                {ties ? `-${ties}` : ""}
              </span>
              {source === "rso" && (
                <span className="num w-12 shrink-0 text-right text-sm font-semibold text-ink">
                  {entry.score.toFixed(1)}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
