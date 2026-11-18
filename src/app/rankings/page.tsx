"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { POSITIONS, type Position, type RankingSource } from "@/data/types";
import { SOURCE_ORDER, useRankingsStore } from "@/store/rankings";
import PageContainer from "@/components/PageContainer";
import { SEASON_YEAR } from "@/data/season";
import PageHeading from "@/components/PageHeading";
import PositionTabs from "@/components/PositionTabs";
import RankingTable from "@/components/RankingTable";
import SourceTabs from "@/components/SourceTabs";
import FanVoteBar from "@/components/rankings/FanVoteBar";
import FanRankingList from "@/components/rankings/FanRankingList";
import MediaRankingList from "@/components/rankings/MediaRankingList";

const SOURCE_NOTE: Record<RankingSource, string> = {
  media: "Media rankings are maintained by the RSO editor.",
  rso: "Generated live by the RSO scoring engine: production points plus tiered bonuses.",
  fan: "Aggregated from fan ballots. Players with no votes fall back to a blend of their RSO and Media positions.",
};

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
    <>
      <PageHeading title="Player Rankings" badge>
        Three takes on the same {SEASON_YEAR} season: the editor&apos;s Media
        board, the data-driven RSO Official engine, and the aggregated Fan vote.
        Updated as results come in.
      </PageHeading>

      <SourceTabs value={source} onChange={setSource} className="mb-5" />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <PositionTabs value={position} onChange={setPosition} />
        <p className="max-w-md text-sm text-silver-deep">
          {SOURCE_NOTE[source]}
        </p>
      </div>

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
          podium
        />
      )}
    </>
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
