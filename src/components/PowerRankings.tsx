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
      <span className="flex w-7 items-center justify-center text-silver-deep">
        <Minus size={12} />
      </span>
    );
  }
  const up = value > 0;
  return (
    <span
      className={`flex w-7 items-center justify-center gap-0.5 text-xs font-bold ${
        up ? "text-emerald-700" : "text-red-600"
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
      <div className="mb-4 flex gap-6 border-b border-silver">
        {SOURCES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSource(s.key)}
            className={`-mb-px border-b-2 px-1 pb-2 text-base font-bold transition-colors ${
              source === s.key
                ? "border-ink text-ink"
                : "border-transparent text-silver-deep hover:text-ink"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {source === "rso" && (
        <p className="mb-3 text-xs text-silver-deep">
          Computed from winning percentage and strength of schedule (quality of
          wins).
        </p>
      )}

      <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {entries.map((entry) => {
          const team = getTeam(entry.teamId);
          if (!team) return null;
          const { wins, losses, ties } = team.record;
          return (
            <div
              key={entry.teamId}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-silver-light/50"
            >
              <span className="w-5 shrink-0 text-right text-sm font-bold tabular-nums text-silver-deep">
                {entry.rank}
              </span>
              <Movement value={entry.movement} />
              <Link
                href={`/team/${team.id}`}
                aria-label={team.name}
                className="shrink-0"
              >
                <TeamLogo teamId={team.id} size={26} />
              </Link>
              <Link
                href={`/team/${team.id}`}
                className="min-w-0 flex-1 truncate font-semibold text-ink hover:underline"
              >
                {team.city} {team.name}
              </Link>
              <span className="shrink-0 text-xs text-silver-deep">
                {wins}-{losses}
                {ties ? `-${ties}` : ""}
              </span>
              {source === "rso" && (
                <span className="w-12 shrink-0 text-right text-sm font-bold tabular-nums text-ink">
                  {entry.score.toFixed(1)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
