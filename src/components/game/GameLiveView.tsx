"use client";

import { useEffect, useRef, useState } from "react";
import type { GameDetail, Team } from "@/data/types";
import BoxScore from "./BoxScore";
import GameField from "./GameField";

type Tab = "field" | "box";

const PLAY_BADGE: Record<string, { label: string; cls: string }> = {
  pass: { label: "PASS", cls: "bg-blue-100 text-blue-700" },
  run: { label: "RUN", cls: "bg-emerald-100 text-emerald-700" },
  sack: { label: "SACK", cls: "bg-red-100 text-red-700" },
};

export default function GameLiveView({
  detail,
  homeTeam,
  awayTeam,
  autoAdvance = false,
}: {
  detail: GameDetail;
  homeTeam: Team;
  awayTeam: Team;
  autoAdvance?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("field");
  const plays = detail.plays;
  // Live games follow along from the opening play; finals open on the result.
  const [idx, setIdx] = useState(autoAdvance ? 0 : plays.length - 1);
  const play = plays[idx];
  const listRef = useRef<HTMLOListElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);

  // Smoothly advance through plays (live gamecast style) up to the latest play.
  useEffect(() => {
    if (!autoAdvance || idx >= plays.length - 1) return;
    const t = setTimeout(
      () => setIdx((i) => Math.min(i + 1, plays.length - 1)),
      2600,
    );
    return () => clearTimeout(t);
  }, [autoAdvance, idx, plays.length]);

  // Keep the active play centered WITHIN the play list only — never scroll the
  // page itself, so the scoreboard stays put.
  useEffect(() => {
    const list = listRef.current;
    const active = activeRef.current;
    if (!list || !active) return;
    const target =
      active.offsetTop - list.clientHeight / 2 + active.clientHeight / 2;
    list.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  }, [idx]);

  const possessionIsAway = play?.possessionTeamId === awayTeam.id;
  const possTeam = possessionIsAway ? awayTeam : homeTeam;
  // First-down line = snap spot + yards to go, in the offense's direction.
  const firstDownAbs =
    play && play.distance !== undefined
      ? play.yardLineAbs + (possessionIsAway ? 1 : -1) * play.distance
      : undefined;

  return (
    <div>
      <div className="mb-3 flex gap-6 border-b border-silver">
        {(["field", "box"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-1 pb-2 text-base font-bold transition-colors ${
              tab === t
                ? "border-ink text-ink"
                : "border-transparent text-silver-deep hover:text-ink"
            }`}
          >
            {t === "field" ? "Play-by-Play" : "Box Score"}
          </button>
        ))}
      </div>

      {tab === "field" ? (
        <div className="space-y-3">
          <GameField
            ballAbs={play?.yardLineAbs ?? 50}
            endAbs={play?.endAbs}
            airEndAbs={play?.airEndAbs}
            completed={play?.completed}
            playType={play?.playType}
            awayAbbr={awayTeam.abbreviation}
            homeAbbr={homeTeam.abbreviation}
            awayColor={awayTeam.primaryColor}
            homeColor={homeTeam.primaryColor}
            firstDownAbs={firstDownAbs}
            possessionIsAway={possessionIsAway}
            possessionTeamId={possTeam.id}
            down={play?.down}
            distance={play?.distance}
          />

          {/* Current play callout */}
          {play && (
            <div className="rounded-lg border border-silver bg-silver-light/40 p-3">
              <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-silver-deep">
                <span>Last play</span>
                <span>·</span>
                <span>
                  Q{play.quarter} {play.clock}
                </span>
                <span
                  className={`rounded px-1 py-0.5 text-[9px] font-bold ${PLAY_BADGE[play.playType].cls}`}
                >
                  {PLAY_BADGE[play.playType].label}
                </span>
                {play.scoring && (
                  <span className="font-bold text-emerald-700">· Score</span>
                )}
              </div>
              <p className="text-sm font-semibold text-ink">{play.description}</p>
            </div>
          )}

          {/* Play list */}
          <ol
            ref={listRef}
            className="relative max-h-72 space-y-1 overflow-y-auto rounded-lg border border-silver p-2"
          >
            {plays.map((p, i) => (
              <li
                key={p.id}
                ref={i === idx ? activeRef : undefined}
                onClick={() => setIdx(i)}
                className={`cursor-pointer rounded px-2 py-1.5 text-sm ${
                  i === idx
                    ? "bg-silver-light font-semibold text-ink ring-1 ring-inset ring-ink/20"
                    : "text-silver-deep hover:bg-silver-light/60"
                }`}
              >
                <span className="mr-2 text-[10px] font-bold uppercase tabular-nums text-silver-deep">
                  Q{p.quarter} {p.clock}
                </span>
                <span
                  className={`mr-2 rounded px-1 py-0.5 text-[9px] font-bold ${PLAY_BADGE[p.playType].cls}`}
                >
                  {PLAY_BADGE[p.playType].label}
                </span>
                {p.description}
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <BoxScore home={detail.boxScore.home} away={detail.boxScore.away} />
      )}
    </div>
  );
}
