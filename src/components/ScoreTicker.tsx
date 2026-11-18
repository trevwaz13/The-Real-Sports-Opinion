import Link from "next/link";
import { getGames, getLatestScoredWeek, getTeam } from "@/data/api";
import { CURRENT_WEEK } from "@/data/season";
import TickerVisibility from "./TickerVisibility";

// Score strip under the header: the current week's games in a horizontally
// scrollable row. Hidden on the home page, which already leads with the full
// scoreboard.
export default function ScoreTicker() {
  // Mid-week the current slate has no scores yet, so fall back to the newest
  // week that does.
  const thisWeek = getGames(CURRENT_WEEK);
  const anyFinal = thisWeek.some((g) => g.status !== "scheduled");
  const week = anyFinal ? CURRENT_WEEK : getLatestScoredWeek();
  const games = anyFinal ? thisWeek : getGames(week);
  if (games.length === 0) return null;

  return (
    <TickerVisibility>
      <div className="border-b border-silver bg-band">
        <div className="mx-auto flex max-w-[1240px] items-center gap-3 px-4 sm:px-6">
          <span className="shrink-0 text-xs font-medium text-silver-deep">
            Week {week}
          </span>
          <ol className="flex snap-x overflow-x-auto py-1.5 [scrollbar-width:none]">
            {games.map((game) => {
              const away = getTeam(game.awayTeamId);
              const home = getTeam(game.homeTeamId);
              const done = game.status === "final" || game.status === "live";
              const awayWon = game.status === "final" && game.awayScore > game.homeScore;
              const homeWon = game.status === "final" && game.homeScore > game.awayScore;
              const row = (abbr: string | undefined, id: string, score: number, won: boolean) => (
                <>
                  <span className={`text-xs ${won ? "font-semibold text-ink" : "text-silver-deep"}`}>
                    {abbr ?? id}
                  </span>
                  <span className={`num text-right text-xs ${won ? "font-semibold text-ink" : "text-silver-deep"}`}>
                    {done ? score : ""}
                  </span>
                </>
              );
              return (
                <li key={game.id} className="snap-start border-l border-silver first:border-l-0">
                  <Link
                    href={`/game/${game.id}`}
                    className="mx-1 grid min-w-[6rem] grid-cols-[1fr_auto] gap-x-3 rounded-lg px-2.5 py-1 transition-colors hover:bg-surface"
                  >
                    {row(away?.abbreviation, game.awayTeamId, game.awayScore, awayWon)}
                    {row(home?.abbreviation, game.homeTeamId, game.homeScore, homeWon)}
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </TickerVisibility>
  );
}
