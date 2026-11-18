import Link from "next/link";
import { getPlayer, getTeam } from "@/data/api";
import type { Game, TeamGameLeaders } from "@/data/types";
import TeamLogo from "./TeamLogo";

function formatOdds(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

function spreadLabel(game: Game): string {
  if (game.spread === 0) return "PK";
  const favored = game.spread < 0 ? game.homeTeamId : game.awayTeamId;
  const line = game.spread < 0 ? game.spread : -game.spread;
  return `${getTeam(favored)?.abbreviation ?? favored} ${line}`;
}

function shortName(playerId: string): string {
  const p = getPlayer(playerId);
  return p ? `${p.firstName[0]}. ${p.lastName}` : "";
}

// One team line: team-color mark, logo, name + record, score.
function TeamRow({
  teamId,
  score,
  showScore,
  winner,
  loser,
}: {
  teamId: string;
  score: number;
  showScore: boolean;
  winner: boolean;
  loser: boolean;
}) {
  const team = getTeam(teamId);
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span
        aria-hidden
        className="h-5 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: team?.primaryColor ?? "var(--color-silver)" }}
      />
      <Link
        href={`/team/${teamId}`}
        aria-label={team?.name}
        className="relative z-10 shrink-0"
      >
        <TeamLogo teamId={teamId} size={28} />
      </Link>
      <Link
        href={`/team/${teamId}`}
        className={`relative z-10 min-w-0 truncate hover:underline ${
          loser ? "text-silver-deep" : "text-ink"
        }`}
      >
        <span className="font-medium">{team?.name ?? teamId}</span>
        <span className="num ml-2 text-xs text-silver-deep">
          {team?.record.wins}-{team?.record.losses}
        </span>
      </Link>
      {/* Non-clickable spacer: clicks here open the game, not the team. */}
      <span className="flex-1" aria-hidden />
      {showScore && (
        <span
          className={`num text-2xl leading-none tracking-tight ${
            winner ? "font-semibold text-ink" : "text-silver-deep"
          }`}
        >
          {score}
        </span>
      )}
    </div>
  );
}

// One team's leader column: abbreviation header + leading passer/rusher/receiver.
function LeaderColumn({
  teamAbbr,
  leaders,
}: {
  teamAbbr: string;
  leaders: TeamGameLeaders;
}) {
  const rows: [string, string | undefined, string | undefined][] = [
    ["Pass", leaders.passing?.playerId, leaders.passing?.statLine],
    ["Rush", leaders.rushing?.playerId, leaders.rushing?.statLine],
    ["Rec", leaders.receiving?.playerId, leaders.receiving?.statLine],
  ];
  return (
    <div className="min-w-0">
      <div className="mb-1.5 text-xs font-semibold text-ink">{teamAbbr}</div>
      <div className="space-y-1.5">
        {rows.map(([label, playerId, statLine]) =>
          playerId ? (
            <div key={label} className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="w-8 shrink-0 text-[11px] text-silver-deep">{label}</span>
                <Link
                  href={`/player/${playerId}`}
                  className="relative z-10 truncate text-xs font-medium text-ink hover:underline"
                >
                  {shortName(playerId)}
                </Link>
              </div>
              <div className="num pl-[2.375rem] text-[11px] leading-snug text-silver-deep">
                {statLine}
              </div>
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}

// One game card: clickable team logos/names and a card-wide link to the full
// game view. Live games show a win-probability split and BOTH teams' leaders.
export default function GameCard({ game }: { game: Game }) {
  const isLive = game.status === "live";
  const isFinal = game.status === "final";
  const showScore = isLive || isFinal;
  const home = getTeam(game.homeTeamId);
  const away = getTeam(game.awayTeamId);
  const leaders = game.cardLeaders;

  const homeWin = isFinal && game.homeScore > game.awayScore;
  const awayWin = isFinal && game.awayScore > game.homeScore;
  const wp = game.liveWinProbability;

  return (
    <div className="panel panel-hover group relative p-4">
      <Link
        href={`/game/${game.id}`}
        aria-label={`${away?.name ?? game.awayTeamId} at ${home?.name ?? game.homeTeamId}, view game`}
        className="absolute inset-0 z-0 rounded-[14px]"
      />

      <div className="mb-2 flex items-center justify-between">
        {isLive ? (
          <span className="tag bg-live text-white">
            Live Q{game.quarter} {game.clock}
          </span>
        ) : isFinal ? (
          <span className="tag bg-silver-light text-ink">Final</span>
        ) : (
          <span className="num text-xs font-medium text-ink">{game.kickoff}</span>
        )}
        <span className="num text-xs text-silver-deep">
          {spreadLabel(game)}, O/U {game.overUnder}
        </span>
      </div>

      <TeamRow
        teamId={game.awayTeamId}
        score={game.awayScore}
        showScore={showScore}
        winner={awayWin}
        loser={homeWin}
      />
      <TeamRow
        teamId={game.homeTeamId}
        score={game.homeScore}
        showScore={showScore}
        winner={homeWin}
        loser={awayWin}
      />

      {isLive && wp && (
        <div className="mt-2">
          <div className="mb-1 flex justify-between text-[11px] text-silver-deep">
            <span>
              {away?.abbreviation} {wp.away}%
            </span>
            <span>Win prob</span>
            <span>
              {home?.abbreviation} {wp.home}%
            </span>
          </div>
          <div
            className="meter"
            style={{ "--value": wp.away } as React.CSSProperties}
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={wp.away}
            aria-label={`${away?.abbreviation} win probability`}
          />
        </div>
      )}

      {/* Both teams' leaders, hidden on phones to keep the scores list short. */}
      {showScore && leaders && (
        <div className="mt-3 hidden grid-cols-2 gap-4 border-t border-silver pt-3 sm:grid">
          <LeaderColumn
            teamAbbr={away?.abbreviation ?? game.awayTeamId}
            leaders={leaders.away}
          />
          <LeaderColumn
            teamAbbr={home?.abbreviation ?? game.homeTeamId}
            leaders={leaders.home}
          />
        </div>
      )}

      {!showScore && (
        <div className="num mt-3 hidden border-t border-silver pt-3 text-xs text-silver-deep sm:block">
          ML {away?.abbreviation} {formatOdds(game.moneyline.away)} / {home?.abbreviation}{" "}
          {formatOdds(game.moneyline.home)}
        </div>
      )}
    </div>
  );
}
