"use client";

import { useEffect, useState } from "react";
import { fetchFanRanking } from "@/data/userData";
import type { Position, RankingEntry } from "@/data/types";
import RankingTable from "../RankingTable";

// Shows the live aggregated Fan ranking from Supabase when configured; otherwise
// (or while loading) falls back to the mock Fan ranking. An empty array means
// "configured but no ballots yet" → the table's "Waiting for all votes" state.
export default function FanRankingList({
  position,
  highlightId,
}: {
  position: Position;
  highlightId?: string;
}) {
  const [entries, setEntries] = useState<RankingEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchFanRanking(position).then((r) => {
      if (!cancelled) setEntries(r);
    });
    return () => {
      cancelled = true;
    };
  }, [position]);

  return entries === null ? (
    <RankingTable position={position} source="fan" highlightId={highlightId} podium />
  ) : (
    <RankingTable
      position={position}
      source="fan"
      entriesOverride={entries}
      highlightId={highlightId}
      podium
    />
  );
}
