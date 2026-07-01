import { notFound } from "next/navigation";
import Link from "next/link";
import { getGame, getGameDetail, getTeam } from "@/data/api";
import type { Team } from "@/data/types";
import PageContainer from "@/components/PageContainer";
import TeamLogo from "@/components/TeamLogo";
import GameLiveView from "@/components/game/GameLiveView";

// One side of the matchup header: logo, name, and record — clickable as a unit.
function TeamBlock({ team }: { team: Team }) {
  return (
    <Link
      href={`/team/${team.id}`}
      className="group flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center"
    >
      <TeamLogo teamId={team.id} size={48} />
      <div className="min-w-0">
        <div className="truncate text-base font-bold text-ink group-hover:underline">
          {team.name}
        </div>
        <div className="text-xs text-silver-deep">
          {team.abbreviation} · {team.record.wins}-{team.record.losses}
          {team.record.ties ? `-${team.record.ties}` : ""}
        </div>
      </div>
    </Link>
  );
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) notFound();
  const home = getTeam(game.homeTeamId);
  const away = getTeam(game.awayTeamId);
  if (!home || !away) notFound();
  const detail = getGameDetail(game.id);

  const isLive = game.status === "live";
  const isFinal = game.status === "final";
  const showScore = isLive || isFinal;
  const statusText = isLive
    ? `LIVE · Q${game.quarter} ${game.clock}`
    : isFinal
      ? "Final"
      : game.kickoff;
  const spreadFavored =
    game.spread === 0
      ? "PK"
      : `${game.spread < 0 ? home.abbreviation : away.abbreviation} ${
          game.spread < 0 ? game.spread : -game.spread
        }`;

  return (
    <PageContainer className="pb-12">
      <Link
        href="/"
        className="mt-2 inline-block text-sm font-semibold text-silver-deep hover:text-ink"
      >
        ← Back to scores
      </Link>

      {/* Scoreboard header — away left, score center, home right */}
      <div className="mt-2 rounded-lg border border-silver p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <TeamBlock team={away} />

          {/* Center scoreboard */}
          <div className="flex shrink-0 flex-col items-center">
            <div className="mb-1 flex items-center gap-2 whitespace-nowrap text-sm font-semibold">
              {isLive && (
                <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
              )}
              <span className={isLive ? "text-ink" : "text-silver-deep"}>
                {statusText}
              </span>
            </div>
            {showScore ? (
              <div className="flex items-center gap-6 sm:gap-10">
                <span
                  className={`text-4xl font-black tabular-nums sm:text-5xl ${
                    isFinal && game.awayScore > game.homeScore
                      ? "text-ink"
                      : "text-silver-deep"
                  }`}
                >
                  {game.awayScore}
                </span>
                <span className="text-2xl font-bold text-silver sm:text-3xl">
                  –
                </span>
                <span
                  className={`text-4xl font-black tabular-nums sm:text-5xl ${
                    isFinal && game.homeScore > game.awayScore
                      ? "text-ink"
                      : "text-silver-deep"
                  }`}
                >
                  {game.homeScore}
                </span>
              </div>
            ) : (
              <span className="text-3xl font-bold text-silver-deep">@</span>
            )}
            <div className="mt-1 whitespace-nowrap text-center text-[11px] text-silver-deep">
              {spreadFavored} · O/U {game.overUnder}
            </div>
          </div>

          <TeamBlock team={home} />
        </div>

        {isLive && game.liveWinProbability && (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[10px] font-semibold uppercase text-silver-deep">
              <span>
                {away.abbreviation} {game.liveWinProbability.away}%
              </span>
              <span>Win probability</span>
              <span>
                {home.abbreviation} {game.liveWinProbability.home}%
              </span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-silver-light">
              <div
                className="h-full"
                style={{
                  width: `${game.liveWinProbability.away}%`,
                  backgroundColor: away.primaryColor,
                }}
              />
              <div
                className="h-full"
                style={{
                  width: `${game.liveWinProbability.home}%`,
                  backgroundColor: home.primaryColor,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Field / play-by-play / box score */}
      <div className="mt-4">
        {detail ? (
          <GameLiveView
            detail={detail}
            homeTeam={home}
            awayTeam={away}
            autoAdvance={isLive}
          />
        ) : (
          <div className="rounded-lg border border-silver bg-silver-light/40 p-10 text-center text-silver-deep">
            This game hasn&apos;t started yet. Check back at kickoff —{" "}
            {game.kickoff}.
          </div>
        )}
      </div>
    </PageContainer>
  );
}
