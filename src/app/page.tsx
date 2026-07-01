import PageContainer from "@/components/PageContainer";
import PreseasonBadge from "@/components/PreseasonBadge";
import SectionHeader from "@/components/SectionHeader";
import WeekScores from "@/components/home/WeekScores";
import HomeRankings from "@/components/home/HomeRankings";
import HomeStats from "@/components/home/HomeStats";
import HomeStandings from "@/components/home/HomeStandings";
import HomeNews from "@/components/home/HomeNews";
import HomeFantasy from "@/components/home/HomeFantasy";
import { getAllGames, getGameWeeks } from "@/data/api";

export default function Home() {
  const games = getAllGames();
  const weeks = getGameWeeks();

  return (
    <PageContainer className="pb-12">
      <div className="flex flex-wrap items-center gap-3 py-6">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">2025 Season</h1>
        <PreseasonBadge />
      </div>

      <section className="pb-8">
        <SectionHeader title="Scores & Matchups" />
        <WeekScores games={games} weeks={weeks} defaultWeek={weeks[0] ?? 1} />
      </section>

      <section className="pb-8">
        <SectionHeader title="Player Rankings" href="/rankings" />
        <HomeRankings />
      </section>

      <section className="pb-8">
        <SectionHeader title="Stat Leaders" href="/stats" />
        <HomeStats />
      </section>

      <section className="pb-8">
        <SectionHeader title="Standings" href="/standings" />
        <HomeStandings />
      </section>

      <section className="pb-8">
        <SectionHeader title="News & Free Agency" />
        <HomeNews />
      </section>

      <section className="pb-8">
        <SectionHeader title="Fantasy" href="/fantasy" />
        <HomeFantasy />
      </section>
    </PageContainer>
  );
}
