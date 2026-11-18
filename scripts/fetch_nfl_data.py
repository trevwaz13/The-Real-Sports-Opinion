"""Fetch real NFL data from nflreadpy (nflverse) and emit JSON that matches the
app's TypeScript types.

Pulls the season that is currently being played: team records, rosters, player
stats, the full schedule (played + upcoming), weekly box scores, weekly fantasy
points, and the league injury report.

Run:  python3 scripts/fetch_nfl_data.py
Output: src/data/real/*.json
"""

import datetime as dt
import json
import os
import polars as pl
import nflreadpy as nfl

SEASON = 2026         # the season being played
CAREER_FROM = 2015
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "data", "real")

CURRENT = {
    "BUF", "MIA", "NE", "NYJ", "BAL", "CIN", "CLE", "PIT", "HOU", "IND",
    "JAX", "TEN", "DEN", "KC", "LV", "LAC", "DAL", "NYG", "PHI", "WAS",
    "CHI", "DET", "GB", "MIN", "ATL", "CAR", "NO", "TB", "ARI", "LAR",
    "SF", "SEA",
}

# nflverse position -> app position (QB/RB/WR/TE/EDGE/DT/LB/CB/S). Others skipped.
POS_MAP = {
    "QB": "QB", "RB": "RB", "FB": "RB", "WR": "WR", "TE": "TE",
    "DE": "EDGE", "OLB": "EDGE", "DT": "DT", "NT": "DT",
    "ILB": "LB", "MLB": "LB", "LB": "LB",
    "CB": "CB", "DB": "CB",
    "FS": "S", "SS": "S", "SAF": "S", "S": "S",
}


def num(v, default=0):
    return default if v is None else v


def passer_rating(comp, att, yds, td, intc):
    if not att:
        return 0.0
    cap = lambda x: max(0.0, min(2.375, x))
    a = cap((comp / att - 0.3) * 5)
    b = cap((yds / att - 3) * 0.25)
    c = cap((td / att) * 20)
    d = cap(2.375 - (intc / att) * 25)
    return round((a + b + c + d) / 6 * 100, 1)


def r1(x):
    return round(float(x), 1)


def build_stats(row):
    """Map one aggregated stats row (dict) into the app's PlayerStats shape."""
    g = num(row.get("games"))
    att = num(row.get("attempts"))
    comp = num(row.get("completions"))
    pass_yds = num(row.get("passing_yards"))
    pass_td = num(row.get("passing_tds"))
    pass_int = num(row.get("passing_interceptions"))
    carries = num(row.get("carries"))
    rush_yds = num(row.get("rushing_yards"))
    rush_td = num(row.get("rushing_tds"))
    targets = num(row.get("targets"))
    rec = num(row.get("receptions"))
    rec_yds = num(row.get("receiving_yards"))
    rec_td = num(row.get("receiving_tds"))
    fumbles = (
        num(row.get("sack_fumbles"))
        + num(row.get("rushing_fumbles"))
        + num(row.get("receiving_fumbles"))
    )
    solo = num(row.get("def_tackles_solo"))
    ast = num(row.get("def_tackle_assists"))

    s = {"gamesPlayed": int(g)}

    # Offense
    if att or pass_yds:
        s["passAttempts"] = int(att)
        s["passCompletions"] = int(comp)
        s["passYds"] = int(pass_yds)
        s["passTD"] = int(pass_td)
        s["interceptionsThrown"] = int(pass_int)
        if att:
            s["completionPct"] = r1(comp / att * 100)
            s["yardsPerAttempt"] = r1(pass_yds / att)
            s["passerRating"] = passer_rating(comp, att, pass_yds, pass_td, pass_int)
    if carries or rush_yds:
        s["rushAttempts"] = int(carries)
        s["rushYds"] = int(rush_yds)
        s["rushTD"] = int(rush_td)
        if carries:
            s["yardsPerCarry"] = r1(rush_yds / carries)
    if targets or rec:
        s["targets"] = int(targets)
        s["receptions"] = int(rec)
        s["recYds"] = int(rec_yds)
        s["recTD"] = int(rec_td)
        if rec:
            s["yardsPerReception"] = r1(rec_yds / rec)
        if targets:
            s["catchRate"] = r1(rec / targets * 100)
    if rush_yds or rec_yds:
        s["scrimmageYds"] = int(rush_yds + rec_yds)
    total_td = int(pass_td + rush_td + rec_td)
    if total_td:
        s["totalTD"] = total_td
    if fumbles:
        s["fumbles"] = int(fumbles)

    # Defense
    if solo or ast or num(row.get("def_sacks")) or num(row.get("def_interceptions")):
        s["soloTackles"] = int(solo)
        s["assistedTackles"] = int(ast)
        s["totalTackles"] = int(solo + ast)
        s["tacklesForLoss"] = int(num(row.get("def_tackles_for_loss")))
        s["sacks"] = r1(num(row.get("def_sacks")))
        s["qbHits"] = int(num(row.get("def_qb_hits")))
        s["forcedFumbles"] = int(num(row.get("def_fumbles_forced")))
        s["fumbleRecoveries"] = int(
            num(row.get("fumble_recovery_opp")) + num(row.get("fumble_recovery_own"))
        )
        s["passesDefended"] = int(num(row.get("def_pass_defended")))
        s["interceptions"] = int(num(row.get("def_interceptions")))
        s["defTD"] = int(num(row.get("def_tds")))
        sft = int(num(row.get("def_safeties")))
        if sft:
            s["safeties"] = sft
    return s


# Schedules use a few different team abbreviations than rosters/stats.
SCHED_FIX = {"LA": "LAR", "OAK": "LV", "SD": "LAC", "STL": "LAR", "WSH": "WAS"}


def fix_abbr(a):
    return SCHED_FIX.get(a, a)


def winpct(w, l, t):
    g = w + l + t
    return (w + 0.5 * t) / g if g else 0.0


def build_teams():
    teams = nfl.load_teams().filter(pl.col("team_abbr").is_in(list(CURRENT)))
    sched = nfl.load_schedules(seasons=[SEASON]).filter(
        (pl.col("game_type") == "REG") & pl.col("result").is_not_null()
    )

    rec = {
        a: {"w": 0, "l": 0, "t": 0, "pf": 0, "pa": 0,
            "hw": 0, "hl": 0, "ht": 0, "aw": 0, "al": 0, "at": 0, "opps": []}
        for a in CURRENT
    }
    for g in sched.iter_rows(named=True):
        h, a = fix_abbr(g["home_team"]), fix_abbr(g["away_team"])
        hs, as_ = g["home_score"], g["away_score"]
        if h not in rec or a not in rec:
            continue
        rec[h]["pf"] += hs; rec[h]["pa"] += as_
        rec[a]["pf"] += as_; rec[a]["pa"] += hs
        rec[h]["opps"].append(a); rec[a]["opps"].append(h)
        if hs > as_:
            rec[h]["w"] += 1; rec[h]["hw"] += 1; rec[a]["l"] += 1; rec[a]["al"] += 1
        elif as_ > hs:
            rec[a]["w"] += 1; rec[a]["aw"] += 1; rec[h]["l"] += 1; rec[h]["hl"] += 1
        else:
            rec[h]["t"] += 1; rec[h]["ht"] += 1; rec[a]["t"] += 1; rec[a]["at"] += 1

    overall = {a: winpct(rec[a]["w"], rec[a]["l"], rec[a]["t"]) for a in rec}

    out = []
    for t in teams.iter_rows(named=True):
        a = t["team_abbr"]
        r = rec[a]
        nick = t["team_nick"]
        city = t["team_name"].replace(f" {nick}", "")
        opps = r["opps"]
        sos = round(sum(overall[o] for o in opps) / len(opps), 3) if opps else 0.5
        out.append({
            "id": a,
            "city": city,
            "name": nick,
            "abbreviation": a,
            "conference": t["team_conf"],
            "division": t["team_division"].split()[-1],
            "logoPath": t["team_logo_espn"],
            "primaryColor": t["team_color"],
            "secondaryColor": t["team_color2"] or t["team_color"],
            "record": {"wins": r["w"], "losses": r["l"], "ties": r["t"]},
            "homeRecord": {"wins": r["hw"], "losses": r["hl"], "ties": r["ht"]},
            "awayRecord": {"wins": r["aw"], "losses": r["al"], "ties": r["at"]},
            "pointsFor": r["pf"],
            "pointsAgainst": r["pa"],
            "pointDifferential": r["pf"] - r["pa"],
            "strengthOfSchedule": sos,
        })
    out.sort(key=lambda x: x["id"])
    return out


def player_key(r):
    """Stable id for a roster row. Prefer gsis_id (matches the stats feed); fall
    back to another id so rookies who haven't been assigned a gsis_id yet (e.g.
    fresh draftees) are still included instead of silently dropped."""
    gid = r.get("gsis_id")
    if gid:
        return gid
    for alt in ("esb_id", "smart_id", "gsis_it_id", "sportradar_id"):
        v = r.get(alt)
        if v:
            return f"it-{v}"
    return None


LEAGUE_MINIMUM_APY = 1.1  # $M, roughly a veteran-minimum deal


def contract_map():
    """gsis_id -> average annual value ($M) of the player's active contract,
    from OverTheCap via nflverse."""
    try:
        contracts = nfl.load_contracts()
    except Exception:
        return {}
    out = {}
    for r in contracts.iter_rows(named=True):
        pid, apy = r.get("gsis_id"), r.get("apy")
        if not pid or apy is None:
            continue
        if not r.get("is_active"):
            continue
        # Keep the richest active deal if a player somehow has more than one.
        if apy > out.get(pid, 0):
            out[pid] = round(float(apy), 2)
    return out


def injury_map():
    """gsis_id -> injury status from the most recent league injury report.
    nflverse report_status is Out / Doubtful / Questionable (blank = cleared)."""
    try:
        inj = nfl.load_injuries([SEASON])
    except Exception:
        return {}
    latest = {}
    for r in inj.iter_rows(named=True):
        pid = r.get("gsis_id")
        if not pid:
            continue
        wk = int(r.get("week") or 0)
        prev = latest.get(pid)
        if prev is None or wk >= prev[0]:
            latest[pid] = (wk, r)

    status = {}
    for pid, (_wk, r) in latest.items():
        report = (r.get("report_status") or "").strip().lower()
        practice = (r.get("practice_status") or "").strip().lower()
        if report == "out":
            status[pid] = ("out", r)
        elif report == "doubtful":
            status[pid] = ("doubtful", r)
        elif report == "questionable":
            status[pid] = ("questionable", r)
        elif "did not participate" in practice:
            status[pid] = ("questionable", r)
    return status


def roster_map(season):
    """player id -> latest roster row (jersey, age, exp, names, headshot, status, team)."""
    rmap = {}
    for r in nfl.load_rosters(seasons=[season]).iter_rows(named=True):
        pid = player_key(r)
        if pid and pid not in rmap:
            rmap[pid] = r
    return rmap


def build_players():
    injuries = injury_map()
    contracts = contract_map()
    season_stats = nfl.load_player_stats(seasons=[SEASON], summary_level="reg")
    stat_by_id = {r["player_id"]: r for r in season_stats.iter_rows(named=True)}

    # The current roster is the source of truth for who's on a team. Season
    # stats are attached when they exist; players who have not taken a snap yet
    # appear with an empty line.
    rmap = roster_map(SEASON)

    # career: aggregate counting stats across seasons
    career_years = list(range(CAREER_FROM, SEASON + 1))
    career_all = nfl.load_player_stats(seasons=career_years, summary_level="reg")
    sum_cols = [
        "games", "completions", "attempts", "passing_yards", "passing_tds",
        "passing_interceptions", "sack_fumbles", "carries", "rushing_yards",
        "rushing_tds", "rushing_fumbles", "targets", "receptions",
        "receiving_yards", "receiving_tds", "receiving_fumbles",
        "def_tackles_solo", "def_tackle_assists", "def_tackles_for_loss",
        "def_sacks", "def_qb_hits", "def_fumbles_forced", "fumble_recovery_opp",
        "fumble_recovery_own", "def_pass_defended", "def_interceptions",
        "def_tds", "def_safeties",
    ]
    sum_cols = [c for c in sum_cols if c in career_all.columns]
    career_agg = (
        career_all.group_by("player_id")
        .agg([pl.col(c).sum().alias(c) for c in sum_cols])
    )
    cmap = {row["player_id"]: row for row in career_agg.iter_rows(named=True)}

    players = []
    for pid, ros in rmap.items():
        status = ros.get("status") or "ACT"
        if status in ("RET", "CUT"):
            continue  # retired / cut — not actually on the team
        team = fix_abbr(ros.get("team") or "")
        if team not in CURRENT:
            continue

        stat = stat_by_id.get(pid)
        # Granular position: from 2025 stats when present, else the roster's
        # depth-chart position (the roster 'position' lumps DL/DB/LB together).
        pos_raw = (
            (stat.get("position") if stat else None)
            or ros.get("depth_chart_position")
            or ros.get("position")
        )
        position = POS_MAP.get(pos_raw or "")
        if position is None:
            continue

        name = (
            (stat.get("player_display_name") if stat else None)
            or ros.get("full_name")
            or pid
        )
        first = ros.get("first_name") or name.split(" ")[0]
        last = ros.get("last_name") or (name.split(" ")[-1] if " " in name else "")
        bd = ros.get("birth_date")
        age = (SEASON - int(str(bd)[:4])) if bd else 26
        yrs = ros.get("years_exp")
        years_pro = int(yrs) if yrs is not None else 0

        players.append({
            "id": pid,
            "name": name,
            "firstName": first,
            "lastName": last,
            "headshotPath": (
                (stat.get("headshot_url") if stat else None)
                or ros.get("headshot_url")
                or ""
            ),
            "teamId": team,
            "position": position,
            "jerseyNumber": int(ros.get("jersey_number") or 0),
            "age": int(age),
            "yearsPro": max(0, years_pro),
            "injuryStatus": (
                "ir"
                if status in ("RES", "INA", "PUP", "IR", "EXE", "TRT", "TRC")
                else injuries.get(pid, ("healthy", None))[0]
            ),
            "isFreeAgent": False,
            "capHit": contracts.get(pid, LEAGUE_MINIMUM_APY),
            # Empty line for players who have not recorded a stat yet.
            "seasonStats": build_stats(stat) if stat else {"gamesPlayed": 0},
            "careerStats": build_stats(
                cmap.get(pid, {"games": (stat.get("games") if stat else 0)})
            ),
        })

    players.sort(key=lambda p: p["id"])
    return players, cmap, set(rmap.keys())


DAYS = {
    "Monday": "Mon", "Tuesday": "Tue", "Wednesday": "Wed", "Thursday": "Thu",
    "Friday": "Fri", "Saturday": "Sat", "Sunday": "Sun",
}


def kickoff_label(weekday, gametime):
    d = DAYS.get(weekday, (weekday or "")[:3])
    t = ""
    if gametime:
        hh, mm = gametime.split(":")[:2]
        hh = int(hh)
        ap = "AM" if hh < 12 else "PM"
        t = f"{hh % 12 or 12}:{mm} {ap}"
    return f"{d} {t}".strip()


def leaders_from_lines(lines):
    def best(filter_key, sort_key):
        c = [l for l in lines if l.get(filter_key)]
        return max(c, key=lambda l: l.get(sort_key, 0)) if c else None

    res = {}
    p = best("attempts", "passYds")
    if p:
        res["passing"] = {
            "playerId": p["playerId"],
            "statLine": f"{p.get('completions', 0)}/{p.get('attempts', 0)}, {p.get('passYds', 0)} YDS, {p.get('passTD', 0)} TD",
        }
    r = best("carries", "rushYds")
    if r:
        res["rushing"] = {
            "playerId": r["playerId"],
            "statLine": f"{r.get('carries', 0)} CAR, {r.get('rushYds', 0)} YDS, {r.get('rushTD', 0)} TD",
        }
    rec = best("receptions", "recYds")
    if rec:
        res["receiving"] = {
            "playerId": rec["playerId"],
            "statLine": f"{rec.get('receptions', 0)} REC, {rec.get('recYds', 0)} YDS, {rec.get('recTD', 0)} TD",
        }
    return res


def current_week(sched):
    """The week being played now: the first week that still has an unplayed
    game, else the last week of the season."""
    unplayed = [
        int(g["week"]) for g in sched.iter_rows(named=True) if g.get("result") is None
    ]
    if unplayed:
        return min(unplayed)
    played = [int(g["week"]) for g in sched.iter_rows(named=True)]
    return max(played) if played else 1


def build_games(gstats):
    """Every regular-season game: finals with scores and box-score leaders,
    plus the upcoming slate with kickoff times and betting lines."""
    sc = nfl.load_schedules(seasons=[SEASON]).filter(pl.col("game_type") == "REG")
    out = []
    for g in sc.iter_rows(named=True):
        h, a = fix_abbr(g["home_team"]), fix_abbr(g["away_team"])
        if h not in CURRENT or a not in CURRENT:
            continue
        wk = int(g["week"])
        final = g.get("result") is not None
        spread = g.get("spread_line")
        game = {
            "id": f"w{wk}-{h}-{a}",
            "week": wk,
            "homeTeamId": h,
            "awayTeamId": a,
            "status": "final" if final else "scheduled",
            "homeScore": int(g["home_score"]) if final else 0,
            "awayScore": int(g["away_score"]) if final else 0,
            "quarter": (5 if g.get("overtime") else 4) if final else 1,
            "clock": "0:00" if final else "15:00",
            "kickoff": kickoff_label(g.get("weekday"), g.get("gametime")),
            "gameday": g.get("gameday") or "",
            # app spread is home-perspective (negative = home favored);
            # nflverse spread_line is positive when the home team is favored.
            "spread": round(-spread, 1) if spread is not None else 0,
            "overUnder": g.get("total_line") or 0,
            "moneyline": {
                "home": int(g["home_moneyline"]) if g.get("home_moneyline") is not None else 0,
                "away": int(g["away_moneyline"]) if g.get("away_moneyline") is not None else 0,
            },
        }
        if final:
            game["cardLeaders"] = {
                "home": leaders_from_lines(gstats.get(f"{wk}-{h}", [])),
                "away": leaders_from_lines(gstats.get(f"{wk}-{a}", [])),
            }
        out.append(game)
    return out


def box_line(row):
    """Compact per-game GameStatLine (only fields with values)."""
    d = {"playerId": row["player_id"]}
    m = {
        "completions": "completions", "attempts": "attempts",
        "passYds": "passing_yards", "passTD": "passing_tds",
        "passInt": "passing_interceptions",
        "carries": "carries", "rushYds": "rushing_yards", "rushTD": "rushing_tds",
        "targets": "targets", "receptions": "receptions",
        "recYds": "receiving_yards", "recTD": "receiving_tds",
    }
    for k, src in m.items():
        v = num(row.get(src))
        if v:
            d[k] = int(v)
    solo, ast = num(row.get("def_tackles_solo")), num(row.get("def_tackle_assists"))
    sk = num(row.get("def_sacks"))
    di = num(row.get("def_interceptions"))
    if solo or ast or sk or di:
        d["tackles"] = int(solo + ast)
        d["sacks"] = round(sk, 1)
        d["defInt"] = int(di)
    return d


ACTIVITY = [
    "attempts", "carries", "targets", "receptions", "passing_yards",
    "receiving_yards", "def_tackles_solo", "def_sacks", "def_interceptions",
]


def build_game_stats():
    w = nfl.load_player_stats(seasons=[SEASON], summary_level="week")
    out = {}
    for row in w.iter_rows(named=True):
        team = fix_abbr(row.get("team") or "")
        if team not in CURRENT:
            continue
        if not any(num(row.get(c)) for c in ACTIVITY):
            continue
        out.setdefault(f"{row['week']}-{team}", []).append(box_line(row))
    return out


def build_free_agents(rostered_ids, cmap):
    """Notable producers who are not on a current roster."""
    stats = nfl.load_player_stats(seasons=[SEASON], summary_level="reg")
    rmap = roster_map(SEASON)  # bio for players now off a roster

    from collections import defaultdict
    byp = defaultdict(list)
    for row in stats.iter_rows(named=True):
        pid = row["player_id"]
        pos = POS_MAP.get(row.get("position") or "")
        if pid in rostered_ids or pos is None:
            continue
        byp[pos].append((num(row.get("fantasy_points_ppr")), row))

    out = []
    for pos, lst in byp.items():
        lst.sort(key=lambda x: -x[0])
        for _, row in lst[:8]:
            pid = row["player_id"]
            ros = rmap.get(pid, {})
            name = row.get("player_display_name") or ros.get("full_name") or pid
            bd = ros.get("birth_date")
            age = (SEASON - int(str(bd)[:4])) if bd else 28
            yrs = ros.get("years_exp")
            out.append({
                "id": pid,
                "name": name,
                "firstName": ros.get("first_name") or name.split(" ")[0],
                "lastName": ros.get("last_name")
                or (name.split(" ")[-1] if " " in name else ""),
                "headshotPath": row.get("headshot_url") or ros.get("headshot_url") or "",
                "teamId": "FA",
                "position": pos,
                "jerseyNumber": 0,
                "age": int(age),
                "yearsPro": max(0, int(yrs) if yrs is not None else 5),
                "injuryStatus": "healthy",
                "isFreeAgent": True,
                "seasonStats": build_stats(row),
                "careerStats": build_stats(cmap.get(pid, {"games": row.get("games")})),
            })
    return out


def build_weekly_fantasy():
    """Real PPR fantasy points per player per week: {week: {playerId: points}}."""
    w = nfl.load_player_stats(seasons=[SEASON], summary_level="week")
    out = {}
    for row in w.iter_rows(named=True):
        pts = num(row.get("fantasy_points_ppr"))
        if not pts:
            continue
        wk = str(int(row["week"]))
        out.setdefault(wk, {})[row["player_id"]] = round(float(pts), 1)
    return out


def ordinal_day(date_str):
    """'2026-11-15' -> 'Nov 15'."""
    try:
        d = dt.date.fromisoformat(date_str)
        return f"{d.strftime('%b')} {d.day}"
    except Exception:
        return ""


def build_news(games, players_by_id, gstats, week, team_names):
    """A league feed derived entirely from the data we already have: the biggest
    performances of the last completed week, this week's injury designations,
    and the marquee matchups coming up. No invented reporting."""
    feed = []
    name = lambda pid: (players_by_id.get(pid) or {}).get("name") or pid
    tname = lambda abbr: team_names.get(abbr, abbr)

    finals = [g for g in games if g["status"] == "final"]
    last_week = max((g["week"] for g in finals), default=0)
    last_games = [g for g in finals if g["week"] == last_week]
    played_on = ordinal_day(max((g.get("gameday") or "" for g in last_games), default=""))

    # 1. Standout individual performances from the last completed week.
    lines = []
    for g in last_games:
        for team in (g["homeTeamId"], g["awayTeamId"]):
            for ln in gstats.get(f"{last_week}-{team}", []):
                lines.append((team, g, ln))

    def top(metric, minimum):
        best = sorted(lines, key=lambda x: -num(x[2].get(metric)))
        return [x for x in best if num(x[2].get(metric)) >= minimum][:1]

    for metric, minimum, phrase in (
        ("passYds", 300, "threw for {v} yards"),
        ("rushYds", 100, "ran for {v} yards"),
        ("recYds", 120, "piled up {v} receiving yards"),
    ):
        for team, g, ln in top(metric, minimum):
            pid = ln["playerId"]
            home = team == g["homeTeamId"]
            opp = g["awayTeamId"] if home else g["homeTeamId"]
            own_score = g["homeScore"] if home else g["awayScore"]
            opp_score = g["awayScore"] if home else g["homeScore"]
            tds = num(ln.get("passTD")) + num(ln.get("rushTD")) + num(ln.get("recTD"))
            if own_score > opp_score:
                result = f"{tname(team)} beat {tname(opp)} {own_score}-{opp_score}"
            elif opp_score > own_score:
                result = f"{tname(team)} lost to {tname(opp)} {opp_score}-{own_score}"
            else:
                result = f"{tname(team)} tied {tname(opp)} {own_score}-{opp_score}"
            feed.append({
                "id": f"perf-{pid}-{last_week}",
                "category": "news",
                "headline": (
                    f"{name(pid)} "
                    + phrase.format(v=int(num(ln[metric])))
                    + f" in Week {last_week}"
                ),
                "summary": (
                    result
                    + (f". {name(pid).split()[-1]} accounted for {int(tds)} touchdown"
                       f"{'s' if tds != 1 else ''}." if tds else ".")
                ),
                "timeAgo": played_on,
            })

    # 2. Injury designations that matter: ruled-out players with the most snaps
    #    of production this season.
    out_players = [
        p for p in players_by_id.values()
        if p["injuryStatus"] in ("out", "doubtful", "ir")
        and (p["seasonStats"].get("gamesPlayed") or 0) >= 3
    ]
    out_players.sort(
        key=lambda p: -(
            (p["seasonStats"].get("passYds") or 0)
            + (p["seasonStats"].get("scrimmageYds") or 0)
            + (p["seasonStats"].get("totalTackles") or 0) * 8
        )
    )
    for p in out_players[:3]:
        label = {"ir": "on injured reserve", "out": "ruled out", "doubtful": "doubtful"}[
            p["injuryStatus"]
        ]
        feed.append({
            "id": f"inj-{p['id']}",
            "category": "injury",
            "headline": f"{p['name']} {label} for Week {week}",
            "summary": (
                f"The {tname(p['teamId'])} {p['position']} has played "
                f"{p['seasonStats'].get('gamesPlayed', 0)} games this season."
            ),
            "timeAgo": f"Week {week} report",
        })

    # 3. The best upcoming matchup by combined winning percentage.
    upcoming = [g for g in games if g["status"] == "scheduled" and g["week"] == week]
    if upcoming:
        upcoming.sort(key=lambda g: -(_winpct.get(g["homeTeamId"], 0) + _winpct.get(g["awayTeamId"], 0)))
        g = upcoming[0]
        feed.append({
            "id": f"up-{g['id']}",
            "category": "news",
            "headline": (
                f"{tname(g['awayTeamId'])} at {tname(g['homeTeamId'])} "
                f"headlines Week {week}"
            ),
            "summary": (
                f"Kickoff {g['kickoff']}"
                + (f". {tname(g['homeTeamId'])} favored by {abs(g['spread'])}." if g["spread"] < 0
                   else f". {tname(g['awayTeamId'])} favored by {abs(g['spread'])}." if g["spread"] > 0
                   else ". No line posted.")
            ),
            "timeAgo": ordinal_day(g.get("gameday", "")),
        })

    # 4. Free-agency note: the most productive unsigned player.
    fas = [p for p in players_by_id.values() if p.get("isFreeAgent")]
    fas.sort(key=lambda p: -((p["seasonStats"].get("scrimmageYds") or 0)
                             + (p["seasonStats"].get("totalTackles") or 0) * 8))
    if fas:
        p = fas[0]
        feed.append({
            "id": f"fa-{p['id']}",
            "category": "free-agency",
            "headline": f"{p['name']} remains unsigned",
            "summary": (
                f"The {p['position']} is the most productive player not on an "
                f"active roster."
            ),
            "timeAgo": "Free agency",
        })
    return feed


_winpct = {}


def write(name, data):
    with open(os.path.join(OUT, name), "w") as f:
        json.dump(data, f, separators=(",", ":"))


def main():
    os.makedirs(OUT, exist_ok=True)

    sched = nfl.load_schedules(seasons=[SEASON]).filter(pl.col("game_type") == "REG")
    week = current_week(sched)
    last_completed = max(
        (int(g["week"]) for g in sched.iter_rows(named=True) if g.get("result") is not None),
        default=0,
    )

    teams = build_teams()
    write("teams.json", teams)
    for t in teams:
        r = t["record"]
        _winpct[t["id"]] = winpct(r["wins"], r["losses"], r["ties"])
    print(f"wrote {len(teams)} teams")

    players, cmap, rostered_ids = build_players()
    free_agents = build_free_agents(rostered_ids, cmap)
    all_players = players + free_agents
    write("players.json", all_players)
    print(f"wrote {len(players)} players + {len(free_agents)} free agents")

    gstats = build_game_stats()
    write("gameStats.json", gstats)
    print(f"wrote box scores for {len(gstats)} team-weeks")

    games = build_games(gstats)
    write("games.json", games)
    finals = sum(1 for g in games if g["status"] == "final")
    print(f"wrote {len(games)} games ({finals} final, {len(games) - finals} upcoming)")

    write("fantasy.json", build_weekly_fantasy())
    print("wrote weekly fantasy points")

    by_id = {p["id"]: p for p in all_players}
    team_names = {t["id"]: t["name"] for t in teams}
    write("news.json", build_news(games, by_id, gstats, week, team_names))
    print("wrote league feed")

    write("season.json", {
        "season": SEASON,
        "currentWeek": week,
        "lastCompletedWeek": last_completed,
        "updatedAt": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    })
    print(f"wrote season meta (season {SEASON}, week {week})")


if __name__ == "__main__":
    main()
