"use client";

import { useEffect, useRef, useState } from "react";
import type { GameDetail, Team } from "@/data/types";
import BoxScore from "./BoxScore";
import GameField from "./GameField";

type Tab = "field" | "box";

const PLAY_BADGE: Record<string, { label: string; cls: string }> = {
  pass: { label: "Pass", cls: "bg-ink text-primary" },
  run: { label: "Run", cls: "bg-silver-light text-ink" },
  sack: { label: "Sack", cls: "bg-down/10 text-down" },
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
      <div role="tablist" aria-label="Game view" className="tabs mb-5">
        {(["field", "box"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className="tab"
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
            <div className="panel px-5 py-4">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-silver-deep">Last play</span>
                <span className="num text-xs text-silver-deep">
                  Q{play.quarter} {play.clock}
                </span>
                <span className={`tag ${PLAY_BADGE[play.playType].cls}`}>
                  {PLAY_BADGE[play.playType].label}
                </span>
                {play.scoring && (
                  <span className="tag bg-up/10 text-up">
                    Score
                  </span>
                )}
              </div>
              <p className="font-medium text-ink">{play.description}</p>
            </div>
          )}

          {/* Play list */}
          <ol
            ref={listRef}
            className="panel relative max-h-80 overflow-y-auto p-1.5"
          >
            {plays.map((p, i) => (
              <li
                key={p.id}
                ref={i === idx ? activeRef : undefined}
                onClick={() => setIdx(i)}
                className={`flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2 text-sm ${
                  i === idx
                    ? "bg-silver-light font-medium text-ink"
                    : "text-silver-deep hover:bg-silver-light hover:text-ink"
                }`}
              >
                <span className="num w-16 shrink-0 pt-0.5 text-xs">
                  Q{p.quarter} {p.clock}
                </span>
                <span
                  className={`tag mt-0.5 w-12 shrink-0 justify-center ${PLAY_BADGE[p.playType].cls}`}
                >
                  {PLAY_BADGE[p.playType].label}
                </span>
                <span>{p.description}</span>
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
