"use client";

import { useEffect, useState } from "react";
import { fetchMediaRanking } from "@/data/userData";
import type { Position, RankingEntry } from "@/data/types";
import RankingTable from "../RankingTable";

// Shows the editor-set Media ranking saved from the admin editor (via Supabase)
// when one exists; otherwise (or while loading, or when Supabase is off) falls
// back to the mock Media ranking.
export default function MediaRankingList({
  position,
  highlightId,
}: {
  position: Position;
  highlightId?: string;
}) {
  const [entries, setEntries] = useState<RankingEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMediaRanking(position).then((r) => {
      if (!cancelled) setEntries(r);
    });
    return () => {
      cancelled = true;
    };
  }, [position]);

  return entries === null ? (
    <RankingTable position={position} source="media" highlightId={highlightId} />
  ) : (
    <RankingTable
      position={position}
      source="media"
      entriesOverride={entries}
      highlightId={highlightId}
    />
  );
}
