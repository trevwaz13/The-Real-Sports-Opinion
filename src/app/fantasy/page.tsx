import type { Metadata } from "next";
import PageContainer from "@/components/PageContainer";
import PageHeading from "@/components/PageHeading";
import FantasyBoard from "@/components/fantasy/FantasyBoard";
import { SEASON_YEAR } from "@/data/season";

export const metadata: Metadata = {
  title: "Fantasy | RSO",
  description:
    "Weekly and season-long PPR fantasy leaders, waiver-wire risers, and positional scoring from live NFL data.",
};

export default function FantasyPage() {
  return (
    <PageContainer>
      <PageHeading title="Fantasy" badge>
        PPR scoring from live {SEASON_YEAR} box scores. Switch between a single
        week and the season to date, filter by position, and see who is trending
        before waivers run.
      </PageHeading>
      <FantasyBoard />
    </PageContainer>
  );
}
