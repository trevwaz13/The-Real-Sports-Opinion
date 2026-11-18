"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Check, Copy, Search, X } from "lucide-react";
import { getPlayersByPosition, getTeam } from "@/data/api";
import type { BallotType } from "@/data/userData";
import type { Position } from "@/data/types";
import { submitBallot } from "@/app/rankings/voteActions";
import PlayerHeadshot from "../PlayerHeadshot";

export default function BallotBuilder({
  position,
  initial,
  onClose,
}: {
  position: Position;
  initial?: { ballotType: BallotType; playerIds: string[] } | null;
  onClose: () => void;
}) {
  const [ballotType, setBallotType] = useState<BallotType>(
    initial?.ballotType ?? "top10",
  );
  const [ballot, setBallot] = useState<string[]>(initial?.playerIds ?? []);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const [copied, setCopied] = useState(false);

  const limit = ballotType === "top20" ? 20 : 10;
  const q = search.trim().toLowerCase();
  const available = getPlayersByPosition(position)
    .filter((p) => !ballot.includes(p.id))
    .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
    .slice(0, 40);

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= ballot.length) return;
    const next = [...ballot];
    [next[i], next[j]] = [next[j], next[i]];
    setBallot(next);
  }

  async function onSubmit() {
    setSubmitting(true);
    setError(null);
    const res = await submitBallot(position, ballotType, ballot);
    setSubmitting(false);
    if (res.error) setError(res.error);
    else setShared(true);
  }

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/rankings?source=fan&position=${position}&ballot=1`
      : "";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgb(5_5_6/0.55)] p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-silver bg-surface shadow-float">
        <div className="flex items-center justify-between border-b border-silver px-4 py-3">
          <h2 className="font-display text-lg text-ink">
            {shared ? "Ballot submitted" : `Your ${position} ballot`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full text-silver-deep hover:bg-silver-light hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        {shared ? (
          <div className="space-y-4 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink text-primary">
              <Check size={24} />
            </div>
            <p className="text-sm text-silver-deep">
              Your {position} ballot is in and counts toward the live Fan
              ranking. Share with a friend so they can vote too:
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="field flex-1 truncate px-3 py-2 text-sm text-silver-deep"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(shareUrl);
                  setCopied(true);
                }}
                className="btn btn-primary"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-silver-deep hover:text-ink"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Ballot type */}
            <div className="flex items-center gap-2 border-b border-silver px-4 py-3">
              <span className="label">Ballot</span>
              <div className="chips chips-sm">
              {(["top10", "top20"] as BallotType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setBallotType(t);
                    if (t === "top10") setBallot((b) => b.slice(0, 10));
                  }}
                  data-active={ballotType === t}
                >
                  {t === "top10" ? "Top 10" : "Top 20"}
                </button>
              ))}
              </div>
              <span className="num ml-auto text-sm font-medium text-ink">
                {ballot.length} / {limit}
              </span>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 sm:grid-cols-2">
              {/* Your ballot */}
              <div>
                <h3 className="label mb-2">
                  Your ballot
                </h3>
                {ballot.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-silver px-3 py-8 text-center text-sm text-silver-deep">
                    Add players from the list
                  </p>
                ) : (
                  <ol className="space-y-1">
                    {ballot.map((id, i) => {
                      const player = getPlayersByPosition(position).find(
                        (p) => p.id === id,
                      );
                      const team = player ? getTeam(player.teamId) : undefined;
                      return (
                        <li
                          key={id}
                          className="flex items-center gap-2 rounded-xl border border-silver bg-primary px-2.5 py-1.5"
                        >
                          <span className="num w-5 text-right text-sm text-silver-deep">
                            {i + 1}
                          </span>
                          <span className="flex-1 truncate text-sm font-semibold text-ink">
                            {player?.name}
                            <span className="ml-1 text-xs text-silver-deep">
                              {team?.abbreviation}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => move(i, -1)}
                            disabled={i === 0}
                            aria-label="Up"
                            className="grid h-6 w-6 place-items-center rounded-full text-ink hover:bg-silver-light disabled:opacity-30"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => move(i, 1)}
                            disabled={i === ballot.length - 1}
                            aria-label="Down"
                            className="grid h-6 w-6 place-items-center rounded-full text-ink hover:bg-silver-light disabled:opacity-30"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setBallot(ballot.filter((x) => x !== id))
                            }
                            aria-label="Remove"
                            className="grid h-6 w-6 place-items-center rounded-full text-down hover:bg-silver-light"
                          >
                            <X size={14} />
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>

              {/* Available players */}
              <div>
                <div className="relative mb-2">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-silver-deep"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search players"
                    className="field w-full !rounded-full py-1.5 pl-8 pr-3"
                  />
                </div>
                <ul className="max-h-72 space-y-1 overflow-y-auto">
                  {available.map((player) => {
                    const team = getTeam(player.teamId);
                    const full = ballot.length >= limit;
                    return (
                      <li key={player.id}>
                        <button
                          type="button"
                          disabled={full}
                          onClick={() => setBallot([...ballot, player.id])}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-silver-light disabled:opacity-40"
                        >
                          <PlayerHeadshot
                            playerId={player.id}
                            name={player.name}
                            size={24}
                          />
                          <span className="flex-1 truncate text-sm font-semibold text-ink">
                            {player.name}
                          </span>
                          <span className="label">
                            {team?.abbreviation}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-silver px-4 py-3">
              <button
                type="button"
                onClick={onSubmit}
                disabled={submitting || ballot.length === 0}
                className="btn btn-primary"
              >
                {submitting ? "Submitting…" : "Submit ballot"}
              </button>
              {error && (
                <span className="text-sm font-semibold text-down">
                  {error}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
