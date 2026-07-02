"use client";

import { useState } from "react";
import Link from "next/link";
import { getInjuredPlayers, getNews, getTeam, getTopFreeAgents } from "@/data/api";
import { POSITIONS, type InjuryStatus, type Position } from "@/data/types";
import PlayerHeadshot from "../PlayerHeadshot";

const CATEGORY_LABEL = {
  news: "News",
  injury: "Injury",
  "free-agency": "Free Agency",
} as const;

const INJURY_BADGE: Record<InjuryStatus, string> = {
  healthy: "text-emerald-700",
  questionable: "text-amber-600",
  doubtful: "text-orange-600",
  out: "text-red-600",
  ir: "text-red-700",
};

type FaScope = Position | "ALL";

// Section 5 — league news, injury updates, and free agency. Free agents flip
// between "top 10 overall" and top 10 per position.
export default function HomeNews() {
  const [faScope, setFaScope] = useState<FaScope>("ALL");
  const news = getNews();
  const injuries = getInjuredPlayers(6);
  const freeAgents = getTopFreeAgents(
    faScope === "ALL" ? undefined : faScope,
    10,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Headlines */}
      <div className="rounded-lg border border-silver p-4">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-silver-deep">
          Latest News
        </h3>
        <ul className="space-y-3">
          {news.map((item) => (
            <li key={item.id}>
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase text-silver-deep">
                <span className="rounded bg-silver-light px-1.5 py-0.5">
                  {CATEGORY_LABEL[item.category]}
                </span>
                <span>{item.timeAgo}</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-ink">
                {item.headline}
              </p>
              <p className="text-xs text-silver-deep">{item.summary}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Injuries */}
      <div className="rounded-lg border border-silver p-4">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-silver-deep">
          Injury Report
        </h3>
        <ul className="space-y-2">
          {injuries.map((p) => {
            const team = getTeam(p.teamId);
            return (
              <li key={p.id} className="flex items-center gap-2">
                <Link href={`/player/${p.id}`} className="shrink-0">
                  <PlayerHeadshot playerId={p.id} name={p.name} size={28} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/player/${p.id}`}
                    className="block truncate text-sm font-semibold text-ink hover:underline"
                  >
                    {p.name}
                  </Link>
                  <span className="text-xs text-silver-deep">
                    {p.position} · {team?.abbreviation}
                  </span>
                </div>
                <span
                  className={`shrink-0 text-xs font-bold uppercase ${INJURY_BADGE[p.injuryStatus]}`}
                >
                  {p.injuryStatus}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Free agents */}
      <div className="rounded-lg border border-silver p-4">
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-silver-deep">
          Top Free Agents
        </h3>
        <div className="mb-3 flex gap-1 overflow-x-auto pb-1">
          {(["ALL", ...POSITIONS] as FaScope[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFaScope(s)}
              className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                faScope === s
                  ? "border-ink bg-ink text-primary"
                  : "border-silver text-silver-deep hover:bg-silver-light hover:text-ink"
              }`}
            >
              {s === "ALL" ? "All" : s}
            </button>
          ))}
        </div>
        <ol className="space-y-2">
          {freeAgents.map((p, i) => (
            <li key={p.id} className="flex items-center gap-2">
              <span className="w-4 shrink-0 text-xs font-bold tabular-nums text-silver-deep">
                {i + 1}
              </span>
              <Link href={`/player/${p.id}`} className="shrink-0">
                <PlayerHeadshot playerId={p.id} name={p.name} size={26} />
              </Link>
              <Link
                href={`/player/${p.id}`}
                className="min-w-0 flex-1 truncate text-sm font-semibold text-ink hover:underline"
              >
                {p.name}
              </Link>
              <span className="shrink-0 text-xs text-silver-deep">
                {p.position}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
