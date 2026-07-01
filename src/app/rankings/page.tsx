"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { POSITIONS, type Position, type RankingSource } from "@/data/types";
import { SOURCE_ORDER, useRankingsStore } from "@/store/rankings";
import PageContainer from "@/components/PageContainer";
import PositionTabs from "@/components/PositionTabs";
import PreseasonBadge from "@/components/PreseasonBadge";
import RankingTable from "@/components/RankingTable";
import SourceTabs from "@/components/SourceTabs";
import FanVoteBar from "@/components/rankings/FanVoteBar";
import FanRankingList from "@/components/rankings/FanRankingList";
import MediaRankingList from "@/components/rankings/MediaRankingList";

function RankingsView() {
  const params = useSearchParams();
  const { source, position, setSource, setPosition } = useRankingsStore();

  // A cross-source rank chip links here with ?source=&position=&player=.
  const qpSourceRaw = params.get("source");
  const qpPositionRaw = params.get("position");
  const qpSource = SOURCE_ORDER.includes(qpSourceRaw as RankingSource)
    ? (qpSourceRaw as RankingSource)
    : null;
  const qpPosition = POSITIONS.includes(qpPositionRaw as Position)
    ? (qpPositionRaw as Position)
    : null;
  const highlightId = params.get("player") ?? undefined;

  // Sync the incoming link's source/position into the store. Runs only when
  // the URL changes, so clicking a tab afterward isn't overridden.
  useEffect(() => {
    if (qpSource) setSource(qpSource);
    if (qpPosition) setPosition(qpPosition);
  }, [qpSource, qpPosition, setSource, setPosition]);

  // Scroll the highlighted player into view once the right list is rendered.
  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => {
      document
        .getElementById(`rank-${highlightId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 90);
    return () => clearTimeout(t);
  }, [highlightId, source, position]);

  return (
    <section className="py-8">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-ink">Player Rankings</h1>
        <PreseasonBadge />
      </div>
      <p className="mb-6 max-w-2xl text-sm text-silver-deep">
        Preseason rankings based on last season&apos;s stats and projected
        starters. Once the 2026 season kicks off, these update weekly.
      </p>

      <SourceTabs value={source} onChange={setSource} className="mb-5" />

      <PositionTabs value={position} onChange={setPosition} className="mb-3" />

      {source === "media" && (
        <p className="mb-4 text-xs text-silver-deep">
          Media rankings are maintained by the RSO editor.
        </p>
      )}
      {source === "rso" && (
        <p className="mb-4 text-xs text-silver-deep">
          Generated live by the RSO scoring engine — production points plus
          tiered bonuses.
        </p>
      )}
      {source === "fan" && (
        <p className="mb-4 text-xs text-silver-deep">
          Aggregated from fan ballots. Players with no votes fall back to a blend
          of their RSO and Media positions.
        </p>
      )}

      {source === "fan" ? (
        <>
          <FanVoteBar position={position} />
          <FanRankingList
            key={position}
            position={position}
            highlightId={highlightId}
          />
        </>
      ) : source === "media" ? (
        <MediaRankingList
          key={position}
          position={position}
          highlightId={highlightId}
        />
      ) : (
        <RankingTable
          position={position}
          source={source}
          highlightId={highlightId}
        />
      )}
    </section>
  );
}

export default function RankingsPage() {
  return (
    <PageContainer>
      <Suspense fallback={null}>
        <RankingsView />
      </Suspense>
    </PageContainer>
  );
}
