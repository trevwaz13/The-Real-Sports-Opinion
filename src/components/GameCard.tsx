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
  return p ? `${p.firstName[0]}.${p.lastName}` : "";
}

function TeamRow({
  teamId,
  score,
  showScore,
  winner,
}: {
  teamId: string;
  score: number;
  showScore: boolean;
  winner: boolean;
}) {
  const team = getTeam(teamId);
  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/team/${teamId}`}
        aria-label={team?.name}
        className="relative z-10 shrink-0"
      >
        <TeamLogo teamId={teamId} size={26} />
      </Link>
      <Link
        href={`/team/${teamId}`}
        className={`relative z-10 min-w-0 truncate text-sm hover:underline ${
          winner ? "font-bold text-ink" : "font-semibold text-silver-deep"
        }`}
      >
        {team ? `${team.city} ${team.name}` : teamId}
      </Link>
      {/* Non-clickable spacer — clicks here open the game, not the team. */}
      <span className="flex-1" aria-hidden />
      {showScore && (
        <span
          className={`w-7 text-right tabular-nums ${
            winner ? "font-bold text-ink" : "font-semibold text-silver-deep"
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
    ["PASS", leaders.passing?.playerId, leaders.passing?.statLine],
    ["RUSH", leaders.rushing?.playerId, leaders.rushing?.statLine],
    ["REC", leaders.receiving?.playerId, leaders.receiving?.statLine],
  ];
  return (
    <div className="min-w-0">
      <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink">
        {teamAbbr}
      </div>
      <div className="space-y-1.5">
        {rows.map(([label, playerId, statLine]) =>
          playerId ? (
            <div key={label} className="min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="w-8 shrink-0 text-[10px] font-semibold uppercase text-silver-deep">
                  {label}
                </span>
                <Link
                  href={`/player/${playerId}`}
                  className="relative z-10 truncate text-xs font-semibold text-ink hover:underline"
                >
                  {shortName(playerId)}
                </Link>
              </div>
              <div className="truncate pl-8 text-[10px] text-silver-deep">
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
// game view. Live games show a win-probability bar and BOTH teams' leaders.
export default function GameCard({ game }: { game: Game }) {
  const isLive = game.status === "live";
  const isFinal = game.status === "final";
  const showScore = isLive || isFinal;
  const home = getTeam(game.homeTeamId);
  const away = getTeam(game.awayTeamId);
  const leaders = game.cardLeaders;

  const statusText = isLive
    ? `LIVE · Q${game.quarter} ${game.clock}`
    : isFinal
      ? "Final"
      : game.kickoff;

  const homeWin = isFinal && game.homeScore > game.awayScore;
  const awayWin = isFinal && game.awayScore > game.homeScore;
  const wp = game.liveWinProbability;

  return (
    <div className="relative rounded-lg border border-silver p-3 transition-colors hover:border-silver-deep">
      <Link
        href={`/game/${game.id}`}
        aria-label="View full game"
        className="absolute inset-0 z-0 rounded-lg"
      />

      <div className="mb-2 flex items-center justify-between text-xs font-semibold">
        <span className={isLive ? "text-ink" : "text-silver-deep"}>
          {isLive && (
            <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-red-600 align-middle" />
          )}
          {statusText}
        </span>
        <span className="text-silver-deep">
          {spreadLabel(game)} · O/U {game.overUnder}
        </span>
      </div>

      <div className="space-y-1.5">
        <TeamRow
          teamId={game.awayTeamId}
          score={game.awayScore}
          showScore={showScore}
          winner={awayWin}
        />
        <TeamRow
          teamId={game.homeTeamId}
          score={game.homeScore}
          showScore={showScore}
          winner={homeWin}
        />
      </div>

      {isLive && wp && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[10px] font-semibold uppercase text-silver-deep">
            <span>
              {away?.abbreviation} {wp.away}%
            </span>
            <span>Win prob</span>
            <span>
              {home?.abbreviation} {wp.home}%
            </span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-silver-light">
            <div
              className="h-full"
              style={{ width: `${wp.away}%`, backgroundColor: away?.primaryColor }}
            />
            <div
              className="h-full"
              style={{ width: `${wp.home}%`, backgroundColor: home?.primaryColor }}
            />
          </div>
        </div>
      )}

      {/* Both teams' leaders */}
      {showScore && leaders && (
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-silver pt-2">
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
        <div className="mt-2 border-t border-silver pt-2 text-xs text-silver-deep">
          ML {away?.abbreviation} {formatOdds(game.moneyline.away)} ·{" "}
          {home?.abbreviation} {formatOdds(game.moneyline.home)}
        </div>
      )}
    </div>
  );
}
