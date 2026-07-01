"""Fetch real NFL teams + players from nflreadpy (nflverse) and emit JSON that
matches the app's TypeScript Team/Player/PlayerStats types.

Run:  python3 scripts/fetch_nfl_data.py
Output: src/data/real/teams.json, src/data/real/players.json
"""

import json
import os
import polars as pl
import nflreadpy as nfl

SEASON = 2025
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


def build_players():
    season_stats = nfl.load_player_stats(seasons=[SEASON], summary_level="reg")
    rosters = nfl.load_rosters(seasons=[SEASON])

    # roster lookup by gsis_id (jersey, age, exp, names, headshot, status)
    rmap = {}
    for r in rosters.iter_rows(named=True):
        gid = r.get("gsis_id")
        if gid and gid not in rmap:
            rmap[gid] = r

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
    for row in season_stats.iter_rows(named=True):
        pos_raw = row.get("position")
        position = POS_MAP.get(pos_raw or "")
        team = fix_abbr(row.get("recent_team") or "")
        if position is None or team not in CURRENT:
            continue
        pid = row["player_id"]
        ros = rmap.get(pid, {})

        name = row.get("player_display_name") or ros.get("full_name") or pid
        first = ros.get("first_name") or name.split(" ")[0]
        last = ros.get("last_name") or (name.split(" ")[-1] if " " in name else "")
        bd = ros.get("birth_date")
        age = (SEASON - int(str(bd)[:4])) if bd else 26
        yrs = ros.get("years_exp")
        years_pro = int(yrs) if yrs is not None else 1
        status = ros.get("status") or "ACT"

        players.append({
            "id": pid,
            "name": name,
            "firstName": first,
            "lastName": last,
            "headshotPath": row.get("headshot_url") or ros.get("headshot_url") or "",
            "teamId": team,
            "position": position,
            "jerseyNumber": int(ros.get("jersey_number") or 0),
            "age": int(age),
            "yearsPro": max(0, years_pro),
            "injuryStatus": "ir" if status in ("RES", "INA") else "healthy",
            "isFreeAgent": False,
            "seasonStats": build_stats(row),
            "careerStats": build_stats(cmap.get(pid, {"games": row.get("games")})),
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


def build_games(gstats):
    sc = nfl.load_schedules(seasons=[SEASON]).filter(
        (pl.col("game_type") == "REG") & pl.col("result").is_not_null()
    )
    out = []
    for g in sc.iter_rows(named=True):
        h, a = fix_abbr(g["home_team"]), fix_abbr(g["away_team"])
        if h not in CURRENT or a not in CURRENT:
            continue
        spread = g.get("spread_line")
        wk = int(g["week"])
        out.append({
            "cardLeaders": {
                "home": leaders_from_lines(gstats.get(f"{wk}-{h}", [])),
                "away": leaders_from_lines(gstats.get(f"{wk}-{a}", [])),
            },
            "id": f"w{g['week']}-{h}-{a}",
            "week": int(g["week"]),
            "homeTeamId": h,
            "awayTeamId": a,
            "status": "final",
            "homeScore": int(g["home_score"]),
            "awayScore": int(g["away_score"]),
            "quarter": 5 if g.get("overtime") else 4,
            "clock": "0:00",
            "kickoff": kickoff_label(g.get("weekday"), g.get("gametime")),
            # app spread is home-perspective (negative = home favored);
            # nflverse spread_line is positive when the home team is favored.
            "spread": round(-spread, 1) if spread is not None else 0,
            "overUnder": g.get("total_line") or 0,
            "moneyline": {
                "home": int(g["home_moneyline"]) if g.get("home_moneyline") is not None else 0,
                "away": int(g["away_moneyline"]) if g.get("away_moneyline") is not None else 0,
            },
        })
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


def build_free_agents(ids25, cmap):
    """Notable 2024 producers who aren't on a 2025 roster."""
    s24 = nfl.load_player_stats(seasons=[SEASON - 1], summary_level="reg")
    r24 = nfl.load_rosters(seasons=[SEASON - 1])
    rmap = {}
    for r in r24.iter_rows(named=True):
        gid = r.get("gsis_id")
        if gid and gid not in rmap:
            rmap[gid] = r

    from collections import defaultdict
    byp = defaultdict(list)
    for row in s24.iter_rows(named=True):
        pid = row["player_id"]
        pos = POS_MAP.get(row.get("position") or "")
        if pid in ids25 or pos is None:
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


def write(name, data):
    with open(os.path.join(OUT, name), "w") as f:
        json.dump(data, f, separators=(",", ":"))


def main():
    os.makedirs(OUT, exist_ok=True)

    write("teams.json", build_teams())
    print("wrote teams")

    players, cmap, ids25 = build_players()
    free_agents = build_free_agents(ids25, cmap)
    write("players.json", players + free_agents)
    print(f"wrote {len(players)} players + {len(free_agents)} free agents")

    gstats = build_game_stats()
    write("gameStats.json", gstats)
    print("wrote game stats")

    write("games.json", build_games(gstats))
    print("wrote games")


if __name__ == "__main__":
    main()
