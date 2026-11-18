import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getGame, getGameDetail, getTeam } from "@/data/api";
import type { Team } from "@/data/types";
import PageContainer from "@/components/PageContainer";
import TeamLogo from "@/components/TeamLogo";
import GameLiveView from "@/components/game/GameLiveView";

// One side of the scoreboard: logo, name and record,
// clickable as a unit. `align` mirrors the home side.
function TeamBlock({
  team,
  score,
  showScore,
  lost,
  align,
}: {
  team: Team;
  score: number;
  showScore: boolean;
  lost: boolean;
  align: "left" | "right";
}) {
  const right = align === "right";
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-3 sm:gap-6 ${right ? "flex-row-reverse text-right" : ""}`}
    >
      <Link
        href={`/team/${team.id}`}
        className={`group flex min-w-0 flex-1 items-center gap-3 ${right ? "flex-row-reverse" : ""}`}
      >
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-silver bg-white shadow-float sm:h-20 sm:w-20 sm:rounded-[22px]">
          <TeamLogo teamId={team.id} size={44} className="sm:hidden" />
          <TeamLogo teamId={team.id} size={60} className="hidden sm:block" />
        </span>
        <span className="min-w-0">
          <span className="hidden text-sm text-silver-deep sm:block">
            {team.city}
          </span>
          <span className="font-display block truncate text-lg leading-tight group-hover:underline sm:text-3xl">
            {team.name}
          </span>
          <span className="num mt-1 block text-xs text-silver-deep">
            {team.record.wins}-{team.record.losses}
            {team.record.ties ? `-${team.record.ties}` : ""}
          </span>
        </span>
      </Link>
      {showScore && (
        <span
          className={`num font-display text-5xl leading-none tracking-tighter sm:text-7xl ${
            lost ? "text-silver-deep/70" : "text-ink"
          }`}
        >
          {score}
        </span>
      )}
    </div>
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
  const awayWon = isFinal && game.awayScore > game.homeScore;
  const homeWon = isFinal && game.homeScore > game.awayScore;
  const spreadFavored =
    game.spread === 0
      ? "PK"
      : `${game.spread < 0 ? home.abbreviation : away.abbreviation} ${
          game.spread < 0 ? game.spread : -game.spread
        }`;

  return (
    <div>
      {/* Scoreboard */}
      <div className="hero-silver relative overflow-hidden">
        <div aria-hidden className="absolute inset-x-0 top-0 flex h-1">
          <div
            className="flex-1"
            style={{ backgroundColor: away.primaryColor }}
          />
          <div
            className="flex-1"
            style={{ backgroundColor: home.primaryColor }}
          />
        </div>
        <PageContainer className="reveal relative pb-8 pt-5 sm:pb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full py-1 pl-2 pr-3 text-sm text-silver-deep transition-colors hover:bg-silver-light hover:text-ink"
          >
            <ArrowLeft size={14} />
            Scores
          </Link>

          <div className="mt-4 flex justify-center sm:mt-2">
            {isLive ? (
              <span className="tag bg-live text-white">
                Live Q{game.quarter} {game.clock}
              </span>
            ) : isFinal ? (
              <span className="tag bg-ink text-primary">Final</span>
            ) : (
              <span className="num text-sm font-semibold">{game.kickoff}</span>
            )}
          </div>

          <div className="mt-4 flex items-center gap-4 sm:gap-10">
            <TeamBlock
              team={away}
              score={game.awayScore}
              showScore={showScore}
              lost={homeWon}
              align="left"
            />
            {!showScore && (
              <span className="text-2xl text-silver-deep">at</span>
            )}
            <TeamBlock
              team={home}
              score={game.homeScore}
              showScore={showScore}
              lost={awayWon}
              align="right"
            />
          </div>

          <p className="num mt-6 text-center text-sm text-silver-deep">
            {spreadFavored}, O/U {game.overUnder}
          </p>

          {isLive && game.liveWinProbability && (
            <div className="mx-auto mt-4 max-w-xl">
              <div className="mb-1 flex justify-between">
                <span className="text-xs text-silver-deep">
                  {away.abbreviation} {game.liveWinProbability.away}%
                </span>
                <span className="text-xs text-silver-deep">
                  Win probability
                </span>
                <span className="text-xs text-silver-deep">
                  {home.abbreviation} {game.liveWinProbability.home}%
                </span>
              </div>
              <div
                className="meter"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={game.liveWinProbability.away}
                aria-label={`${away.abbreviation} win probability`}
                style={
                  {
                    "--value": game.liveWinProbability.away,
                  } as React.CSSProperties
                }
              />
            </div>
          )}
        </PageContainer>
      </div>

      {/* Field / play-by-play / box score */}
      <PageContainer className="mt-8">
        {detail ? (
          <GameLiveView
            detail={detail}
            homeTeam={home}
            awayTeam={away}
            autoAdvance={isLive}
          />
        ) : (
          <div className="panel px-6 py-14 text-center">
            <p className="font-display text-2xl text-ink">Not started yet</p>
            <p className="mt-1 text-silver-deep">
              Check back at kickoff: {game.kickoff}.
            </p>
          </div>
        )}
      </PageContainer>
    </div>
  );
}
