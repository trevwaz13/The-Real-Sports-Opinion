import { create } from "zustand";
import type { Position, RankingSource } from "@/data/types";

// Lightweight client-only UI state for the rankings views (full page + the
// embedded home-page module both read this). Not persisted — just which tab /
// position the user is looking at.
interface RankingsUIState {
  source: RankingSource;
  position: Position;
  setSource: (source: RankingSource) => void;
  setPosition: (position: Position) => void;
}

export const useRankingsStore = create<RankingsUIState>((set) => ({
  source: "rso",
  position: "QB",
  setSource: (source) => set({ source }),
  setPosition: (position) => set({ position }),
}));

export const SOURCE_LABELS: Record<RankingSource, string> = {
  media: "Media",
  rso: "RSO Official",
  fan: "Fan",
};

// Compact labels for the cross-source rank chips on each row.
export const SOURCE_SHORT: Record<RankingSource, string> = {
  media: "Media",
  rso: "RSO",
  fan: "Fan",
};

export const SOURCE_ORDER: RankingSource[] = ["media", "rso", "fan"];
