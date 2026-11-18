"use client";

import { useState } from "react";
import Link from "next/link";
import {
  getFantasyLeaders,
  getInjuredPlayers,
  getNews,
  getPlayer,
  getTeam,
  getTopFreeAgents,
} from "@/data/api";
import { LAST_COMPLETED_WEEK } from "@/data/season";
import { POSITIONS, type InjuryStatus, type Position } from "@/data/types";
import PlayerHeadshot from "../PlayerHeadshot";
import Select from "../Select";

const CATEGORY_LABEL = {
  news: "News",
  injury: "Injury",
  "free-agency": "Free Agency",
} as const;

const CATEGORY_TAG = {
  news: "bg-silver-light text-ink",
  injury: "bg-down/10 text-down",
  "free-agency": "bg-ink text-primary",
} as const;

const INJURY_COLOR: Record<InjuryStatus, string> = {
  healthy: "text-up",
  questionable: "text-warn",
  doubtful: "text-warn",
  out: "text-down",
  ir: "text-down",
};

type FaScope = Position | "ALL";

// Section 5: the league feed, the injury report, and a third column that
// adapts to the calendar — unsigned free agents in the offseason, and the last
// week's top fantasy performers once games are being played.
export default function HomeNews() {
  const [scope, setScope] = useState<FaScope>("ALL");
  const news = getNews();
  const injuries = getInjuredPlayers(6);
  const position = scope === "ALL" ? undefined : scope;
  const freeAgents = getTopFreeAgents(position, 10);
  const standouts = getFantasyLeaders(position, 10).map((row) => ({
    player: getPlayer(row.playerId),
    points: row.fantasyPoints,
  }));
  const showFreeAgents = freeAgents.length > 0;
  const [lead, ...moreNews] = news;

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {/* Headlines: the lead story set large, the rest as a list */}
      <div className="panel p-5 lg:col-span-5">
        {lead && (
          <article>
            <div className="flex items-center gap-2">
              <span className={`tag ${CATEGORY_TAG[lead.category]}`}>
                {CATEGORY_LABEL[lead.category]}
              </span>
              <span className="text-xs text-silver-deep">{lead.timeAgo}</span>
            </div>
            <h3 className="font-display mt-3 text-2xl leading-snug text-ink">
              {lead.headline}
            </h3>
            <p className="mt-2 leading-relaxed text-silver-deep">
              {lead.summary}
            </p>
          </article>
        )}
        <ul className="mt-5 divide-y divide-silver border-t border-silver">
          {moreNews.map((item) => (
            <li key={item.id} className="py-3.5">
              <div className="flex items-center gap-2">
                <span className={`tag ${CATEGORY_TAG[item.category]}`}>
                  {CATEGORY_LABEL[item.category]}
                </span>
                <span className="text-xs text-silver-deep">{item.timeAgo}</span>
              </div>
              <p className="mt-1.5 font-medium leading-snug text-ink">
                {item.headline}
              </p>
              <p className="mt-0.5 text-sm text-silver-deep">{item.summary}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Injuries */}
      <div className="panel self-start p-5 lg:col-span-3">
        <h3 className="font-semibold text-ink">Injury Report</h3>
        <ul className="mt-3 space-y-1">
          {injuries.map((p) => {
            const team = getTeam(p.teamId);
            return (
              <li key={p.id} className="flex items-center gap-3 py-1.5">
                <Link href={`/player/${p.id}`} className="shrink-0">
                  <PlayerHeadshot playerId={p.id} name={p.name} size={34} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/player/${p.id}`}
                    className="block truncate text-sm font-medium text-ink hover:underline"
                  >
                    {p.name}
                  </Link>
                  <span className="text-xs text-silver-deep">
                    {p.position}, {team?.abbreviation}
                  </span>
                </div>
                <span
                  className={`shrink-0 text-xs font-semibold uppercase ${INJURY_COLOR[p.injuryStatus]}`}
                >
                  {p.injuryStatus}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Free agents in the offseason; week standouts once games are played */}
      <div className="panel self-start p-5 lg:col-span-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-ink">
            {showFreeAgents
              ? "Top Free Agents"
              : `Week ${LAST_COMPLETED_WEEK} Standouts`}
          </h3>
          <Select
            label="Filter by position"
            value={scope}
            options={["ALL", ...POSITIONS] as FaScope[]}
            onChange={setScope}
            format={(s) => (s === "ALL" ? "All positions" : s)}
          />
        </div>
        <ol className="mt-3">
          {showFreeAgents
            ? freeAgents.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 py-1.5">
                  <span className="num w-4 shrink-0 text-right text-xs text-silver-deep">
                    {i + 1}
                  </span>
                  <Link href={`/player/${p.id}`} className="shrink-0">
                    <PlayerHeadshot playerId={p.id} name={p.name} size={30} />
                  </Link>
                  <Link
                    href={`/player/${p.id}`}
                    className="min-w-0 flex-1 truncate text-sm font-medium text-ink hover:underline"
                  >
                    {p.name}
                  </Link>
                  <span className="tag shrink-0 bg-silver-light text-silver-deep">
                    {p.position}
                  </span>
                </li>
              ))
            : standouts.map(({ player, points }, i) =>
                player ? (
                  <li
                    key={player.id}
                    className="flex items-center gap-3 py-1.5"
                  >
                    <span className="num w-4 shrink-0 text-right text-xs text-silver-deep">
                      {i + 1}
                    </span>
                    <Link href={`/player/${player.id}`} className="shrink-0">
                      <PlayerHeadshot
                        playerId={player.id}
                        name={player.name}
                        size={30}
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/player/${player.id}`}
                        className="block truncate text-sm font-medium text-ink hover:underline"
                      >
                        {player.name}
                      </Link>
                      <span className="text-xs text-silver-deep">
                        {player.position},{" "}
                        {getTeam(player.teamId)?.abbreviation}
                      </span>
                    </div>
                    <span className="num shrink-0 text-sm font-semibold text-ink">
                      {points.toFixed(1)}
                    </span>
                  </li>
                ) : null,
              )}
        </ol>
        {!showFreeAgents && (
          <p className="mt-3 text-xs text-silver-deep">
            PPR fantasy points, week {LAST_COMPLETED_WEEK}.
          </p>
        )}
      </div>
    </div>
  );
}
