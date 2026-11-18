"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Check, Repeat2, RotateCcw, Search, Sparkles, X } from "lucide-react";
import { getScoredPool, getTeam } from "@/data/api";
import type { Player, Position } from "@/data/types";
import PlayerHeadshot from "../PlayerHeadshot";
import TeamLogo from "../TeamLogo";
import {
  SALARY_CAP,
  SLOT_IDS,
  TARGET_SCORE,
  TOTAL_SLOTS,
  gradeFor,
} from "./roster";
import {
  getServerSnapshot,
  getSnapshot,
  saveRoster,
  subscribe,
  type Roster,
} from "./rosterStore";

type SortKey = "score" | "value" | "cap";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "score", label: "RSO score" },
  { key: "value", label: "Score per $M" },
  { key: "cap", label: "Cheapest" },
];

const capOf = (player: Player) => player.capHit ?? 1.1;
const money = (m: number) => `$${m.toFixed(1)}M`;

export default function RosterBuilder() {
  const roster = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const setRoster = (update: Roster | ((prev: Roster) => Roster)) =>
    saveRoster(typeof update === "function" ? update(roster) : update);
  const [openSlot, setOpenSlot] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("score");

  // Scores come from the live RSO engine, so the pool is built once.
  const pools = useMemo(() => {
    const byPosition = {} as Record<
      Position,
      { player: Player; score: number }[]
    >;
    for (const { position } of SLOT_IDS) {
      if (!byPosition[position]) byPosition[position] = getScoredPool(position);
    }
    return byPosition;
  }, []);

  const scoreById = useMemo(() => {
    const map = new Map<string, { player: Player; score: number }>();
    for (const rows of Object.values(pools)) {
      for (const row of rows) map.set(row.player.id, row);
    }
    return map;
  }, [pools]);

  const picked = Object.values(roster).filter(Boolean);
  const spent = picked.reduce(
    (sum, id) =>
      sum + (scoreById.get(id) ? capOf(scoreById.get(id)!.player) : 0),
    0,
  );
  const totalScore = picked.reduce(
    (sum, id) => sum + (scoreById.get(id)?.score ?? 0),
    0,
  );
  const remaining = SALARY_CAP - spent;
  const over = remaining < 0;
  const complete = picked.length === TOTAL_SLOTS;
  const { grade, note } = gradeFor(totalScore);

  const slotPosition = openSlot
    ? SLOT_IDS.find((s) => s.id === openSlot)!.position
    : null;

  const options = useMemo(() => {
    if (!slotPosition) return [];
    const taken = new Set(Object.values(roster));
    const query = search.trim().toLowerCase();
    const rows = (pools[slotPosition] ?? []).filter(({ player }) => {
      if (taken.has(player.id) && roster[openSlot!] !== player.id) return false;
      return query ? player.name.toLowerCase().includes(query) : true;
    });
    const sorted = [...rows];
    if (sort === "cap")
      sorted.sort((a, b) => capOf(a.player) - capOf(b.player));
    else if (sort === "value")
      sorted.sort(
        (a, b) => b.score / capOf(b.player) - a.score / capOf(a.player),
      );
    return sorted.slice(0, 60);
  }, [slotPosition, pools, roster, openSlot, search, sort]);

  function assign(slotId: string, playerId: string) {
    setRoster((prev) => ({ ...prev, [slotId]: playerId }));
    setOpenSlot(null);
    setSearch("");
  }

  function clearSlot(slotId: string) {
    setRoster((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  }

  /** Fill the empty slots with the best players the remaining cap allows,
   *  always leaving enough room to field a legal 19-man lineup. */
  function autofill() {
    setRoster((prev) => {
      const next = { ...prev };
      const taken = new Set(Object.values(next));
      let budget =
        SALARY_CAP -
        Object.values(next).reduce(
          (sum, id) =>
            sum + (scoreById.get(id) ? capOf(scoreById.get(id)!.player) : 0),
          0,
        );
      const empty = SLOT_IDS.filter((slot) => !next[slot.id]);
      empty.forEach((slot, i) => {
        // Keep at least a minimum deal in reserve for each slot still to fill.
        const reserve = (empty.length - i - 1) * 1.1;
        const candidates = (pools[slot.position] ?? [])
          .filter((row) => !taken.has(row.player.id))
          .sort((a, b) => b.score - a.score);
        const pick =
          candidates.find((row) => capOf(row.player) <= budget - reserve) ??
          [...candidates].sort((a, b) => capOf(a.player) - capOf(b.player))[0];
        if (!pick) return;
        next[slot.id] = pick.player.id;
        taken.add(pick.player.id);
        budget -= capOf(pick.player);
      });
      return next;
    });
  }

  const units = ["Offense", "Defense"] as const;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-12">
      {/* Lineup */}
      <div className="lg:col-span-8">
        {units.map((unit) => (
          <section key={unit} className="mb-6">
            <h2 className="mb-3 font-semibold text-ink">{unit}</h2>
            <ul className="panel overflow-hidden">
              {SLOT_IDS.filter((slot) => slot.unit === unit).map((slot) => {
                const row = roster[slot.id]
                  ? scoreById.get(roster[slot.id])
                  : undefined;
                const player = row?.player;
                const team = player ? getTeam(player.teamId) : undefined;
                return (
                  <li
                    key={slot.id}
                    className="flex items-center gap-2 border-t border-silver/70 px-3 py-2.5 first:border-t-0 sm:gap-3 sm:px-4"
                  >
                    <span className="label w-9 shrink-0 sm:w-12">
                      {slot.position}
                    </span>
                    {player ? (
                      <>
                        <Link
                          href={`/player/${player.id}`}
                          className="shrink-0"
                        >
                          <PlayerHeadshot
                            playerId={player.id}
                            name={player.name}
                            size={34}
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/player/${player.id}`}
                            className="block truncate text-sm font-medium text-ink hover:underline"
                          >
                            {player.name}
                          </Link>
                          <span className="flex items-center gap-1.5 text-xs text-silver-deep">
                            {team && <TeamLogo teamId={team.id} size={14} />}
                            {team?.abbreviation}
                          </span>
                        </div>
                        <span className="num hidden w-20 shrink-0 text-right text-sm text-silver-deep sm:block">
                          {row?.score.toFixed(1)}
                        </span>
                        <span className="num w-16 shrink-0 text-right text-sm font-medium text-ink sm:w-20">
                          {money(capOf(player))}
                        </span>
                        <button
                          type="button"
                          onClick={() => setOpenSlot(slot.id)}
                          className="btn btn-outline shrink-0 !px-2 !py-1 text-xs sm:!px-3"
                          aria-label={`Swap ${player.name}`}
                        >
                          <Repeat2 size={14} />
                          <span className="hidden sm:inline">Swap</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => clearSlot(slot.id)}
                          aria-label={`Remove ${player.name}`}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-silver-deep hover:bg-silver-light hover:text-ink"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setOpenSlot(slot.id)}
                        className="flex flex-1 items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-sm text-silver-deep transition-colors hover:bg-silver-light hover:text-ink"
                      >
                        Choose a {slot.position}
                        <span className="text-xs">Add</span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {/* Cap sheet */}
      <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-24">
        <div className="panel p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold text-ink">Cap sheet</h2>
            <span className="num text-sm text-silver-deep">
              {picked.length}/{TOTAL_SLOTS} filled
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <span className="font-display text-3xl leading-none text-ink">
              {money(spent)}
            </span>
            <span
              className={`num text-sm ${over ? "font-semibold text-down" : "text-silver-deep"}`}
            >
              {over
                ? `${money(Math.abs(remaining))} over`
                : `${money(remaining)} left`}
            </span>
          </div>
          <div
            className="meter mt-3"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={SALARY_CAP}
            aria-valuenow={Math.round(spent)}
            aria-label="Salary cap used"
            style={
              {
                "--value": Math.min(100, (spent / SALARY_CAP) * 100),
              } as React.CSSProperties
            }
          />
          <p className="mt-2 text-xs text-silver-deep">
            {money(SALARY_CAP)} cap, average annual value.
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-silver pt-4">
            <div>
              <dt className="text-xs text-silver-deep">Team RSO score</dt>
              <dd className="font-display mt-0.5 text-2xl leading-none text-ink">
                {totalScore.toFixed(0)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-silver-deep">Projection</dt>
              <dd className="mt-0.5 flex items-baseline gap-2">
                <span className="font-display text-2xl leading-none text-ink">
                  {complete ? grade : "-"}
                </span>
                <span className="text-xs text-silver-deep">
                  {complete ? note : "Fill all 19 slots"}
                </span>
              </dd>
            </div>
          </dl>

          {picked.length > 0 && (
            <div
              className="meter mt-4"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={TARGET_SCORE}
              aria-valuenow={Math.round(totalScore)}
              aria-label="Team score against the best lineup the cap allows"
              style={
                {
                  "--value": Math.min(100, (totalScore / TARGET_SCORE) * 100),
                } as React.CSSProperties
              }
            />
          )}

          {over && (
            <p className="mt-4 rounded-xl bg-down/10 px-3 py-2 text-sm font-medium text-down">
              You are {money(Math.abs(remaining))} over the cap. Drop or
              downgrade a starter.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={autofill}
              className="btn btn-primary"
            >
              <Sparkles size={15} />
              Autofill lineup
            </button>
            <button
              type="button"
              onClick={() => setRoster({})}
              className="btn btn-outline"
            >
              <RotateCcw size={15} />
              Clear
            </button>
          </div>
        </div>

        <p className="px-1 text-xs text-silver-deep">
          Your lineup is saved in this browser only. Contract figures are each
          player&rsquo;s active-deal average annual value.
        </p>
      </aside>

      {/* Player picker */}
      {openSlot && slotPosition && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-[rgb(10_10_10/0.45)] p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Choose a ${slotPosition}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpenSlot(null);
          }}
        >
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-silver bg-surface shadow-float sm:rounded-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-silver px-5 py-3.5">
              <h3 className="font-display text-lg text-ink">
                Choose a {slotPosition}
              </h3>
              <button
                type="button"
                onClick={() => setOpenSlot(null)}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full text-silver-deep hover:bg-silver-light hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-b border-silver px-5 py-3">
              <label className="relative flex-1">
                <span className="sr-only">Search players</span>
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-silver-deep"
                />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${slotPosition}s`}
                  className="field !rounded-full w-full py-1.5 pl-9 pr-3"
                />
              </label>
              <div className="chips chips-sm">
                {SORTS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    data-active={sort === option.key}
                    onClick={() => setSort(option.key)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <ul className="flex-1 overflow-y-auto p-2">
              {options.map(({ player, score }) => {
                const team = getTeam(player.teamId);
                const cap = capOf(player);
                const affordable =
                  remaining +
                    (roster[openSlot]
                      ? capOf(scoreById.get(roster[openSlot])!.player)
                      : 0) -
                    cap >=
                  0;
                return (
                  <li key={player.id}>
                    <button
                      type="button"
                      onClick={() => assign(openSlot, player.id)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-silver-light"
                    >
                      <PlayerHeadshot
                        playerId={player.id}
                        name={player.name}
                        size={34}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">
                          {player.name}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-silver-deep">
                          {team && <TeamLogo teamId={team.id} size={14} />}
                          {team?.abbreviation}
                          {player.injuryStatus !== "healthy" && (
                            <span className="text-warn uppercase">
                              {player.injuryStatus}
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="num w-16 shrink-0 text-right text-sm text-silver-deep">
                        {score.toFixed(1)}
                      </span>
                      <span
                        className={`num w-20 shrink-0 text-right text-sm font-medium ${
                          affordable ? "text-ink" : "text-down"
                        }`}
                      >
                        {money(cap)}
                      </span>
                      {roster[openSlot] === player.id && (
                        <Check size={16} className="shrink-0 text-ink" />
                      )}
                    </button>
                  </li>
                );
              })}
              {options.length === 0 && (
                <li className="px-3 py-10 text-center text-sm text-silver-deep">
                  No {slotPosition}s match &ldquo;{search}&rdquo;.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
