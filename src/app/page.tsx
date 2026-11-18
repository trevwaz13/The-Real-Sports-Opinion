import PageContainer from "@/components/PageContainer";
import PageHeading from "@/components/PageHeading";
import SectionHeader from "@/components/SectionHeader";
import WeekScores from "@/components/home/WeekScores";
import HomeRankings from "@/components/home/HomeRankings";
import HomeStats from "@/components/home/HomeStats";
import HomeStandings from "@/components/home/HomeStandings";
import HomeNews from "@/components/home/HomeNews";
import HomeFantasy from "@/components/home/HomeFantasy";
import { getAllGames, getGameWeeks, getLatestScoredWeek } from "@/data/api";
import { SEASON_YEAR } from "@/data/season";

export default function Home() {
  const games = getAllGames();
  const weeks = getGameWeeks();
  const latestScored = getLatestScoredWeek();

  return (
    <PageContainer>
      <PageHeading title={`${SEASON_YEAR} Season`} badge />

      <section className="pb-16">
        <WeekScores games={games} weeks={weeks} defaultWeek={latestScored} />
      </section>

      <section className="pb-16">
        <SectionHeader title="Player Rankings" href="/rankings" />
        <HomeRankings />
      </section>

      <div className="grid gap-x-8 gap-y-14 pb-16 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <SectionHeader title="Stat Leaders" href="/stats" />
          <HomeStats />
        </section>
        <section className="lg:col-span-5">
          <SectionHeader title="Standings" href="/standings" />
          <HomeStandings />
        </section>
      </div>

      <section className="pb-16">
        <SectionHeader title="Around the League" />
        <HomeNews />
      </section>

      <section>
        <SectionHeader title="Fantasy" href="/fantasy" />
        <HomeFantasy />
      </section>
    </PageContainer>
  );
}
