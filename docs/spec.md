# RSO Website — Claude Code Build Brief

> **How to use this file:** Drop it into an empty folder and open Claude Code there. You can paste the whole thing, but for a project this size it works better to feed it **one phase at a time** (Phase 0 → 1 → 2…), letting Claude Code finish, run, and show you each phase before moving on. The headers below are the natural stopping points.
>
> Also save the original RSO spec (the document with all your page descriptions) into the repo at `docs/spec.md` so Claude Code always has the source of truth.

---

## Phase 0 — Project setup & ground rules

Build a multi-page NFL stats, rankings, and fantasy website called **RSO**.

**Tech stack (use exactly this unless I say otherwise):**
- **Next.js (App Router) + TypeScript** — handles the multiple pages and dynamic routes (`/team/[id]`, `/player/[id]`) cleanly.
- **Tailwind CSS** for styling.
- **lucide-react** for icons.
- **Zustand** for lightweight client state (active tab, selected position, UI-only state).
- **Supabase** (hosted Postgres + Auth + Row Level Security) for **real user accounts and all user-generated/editor data** — accounts, fan votes, fantasy teams, and the editor-maintained Media rankings & power rankings. Use the **`@supabase/ssr`** package with `@supabase/supabase-js` for Next.js App Router cookie-based auth (this is the current recommended approach — do **not** use the deprecated `@supabase/auth-helpers-nextjs`). Use Supabase's new **publishable/secret API keys**, not the legacy anon/service_role keys (those are being retired). A fast way to scaffold correctly is `npx create-next-app -e with-supabase`.

**Two distinct data sources — keep them separate:**
- **NFL data** (teams, players, games, live scores, stats, standings) → a **typed mock data layer** for now (Phase 2), built so swapping in a real NFL API later is a one-folder change. This data is read-only to users.
- **User data** (accounts, fan-vote ballots, fantasy teams, editor rankings) → **real, persisted in Supabase from day one** (Phase 2.5). This is created and owned by users/editors and must survive refreshes and be shared across all visitors.

**Ground rules:**
- Mobile-first responsive. Everything must look right on phone and desktop.
- Every player name and team name anywhere on the site is a clickable link to that player's profile / team page.
- Keep components small and reusable. A `<RankingTable>`, `<StatLeaderCard>`, `<PositionTabs>`, `<TeamLogo>`, `<PlayerHeadshot>` etc. should each exist once and be reused across pages.
- Write it so I can run `npm run dev` and immediately see populated, realistic-looking pages — never empty states during development.

Start by scaffolding the Next.js + TS + Tailwind project, installing the deps above, and setting up the folder structure and a `.env.local` for the Supabase URL + publishable key (and a `.env.local.example` committed to the repo with placeholder values). Then stop and show me the dev server running with a placeholder home page before continuing.

---

## Phase 1 — Design system & global layout

**Color scheme** — clean, simple, mostly white with silver accents and black text:
- Primary: White `#FFFFFF`
- Secondary: Silver `#C0C0C0` (use a small range: `#E8E8E8` light, `#C0C0C0` mid, `#9A9A9A` deep for borders/dividers)
- Tertiary / text: Black `#0A0A0A`

Define these as Tailwind theme tokens (`primary`, `silver`, `silver-light`, `silver-deep`, `ink`). Use silver for borders, dividers, hover backgrounds, and subtle section separators. The overall feel is bright and uncluttered.

**Logo:** the text "RSO" in silver letters with a drop-shadow behind it (an offset darker-silver/grey shadow so it reads as embossed). Build it as an SVG or styled text component so it's crisp at any size. Place it top-left in the header.

**Header / navigation bar (sticky, top of every page):**
- RSO logo — top left
- Nav links (center/left): Home · Player Rankings · Stats · Standings · Fantasy · Be a GM
- Top right: a **Login / Sign in** button (silver outline, black text).
- **Active-tab indicator:** the nav item for the current page gets a **black underline with a drop-shadow** beneath it. The shadow should be visible (soft grey shadow under the black line). Animate the underline sliding between tabs when navigation changes.

**Footer:** simple — RSO logo, copyright, the same nav links.

Build the header, footer, logo, color tokens, and a base page layout wrapper now. Show me the shell with working nav (links route to empty placeholder pages) and the active-tab shadow-underline behaving correctly.

---

## Phase 2 — Data architecture (do this before any data-heavy page)

Create a typed mock-data layer under `src/data/`. Define TypeScript interfaces and seed each with realistic mock entries (use real current NFL teams; you can invent plausible players/stats). **Every page reads from these — no hardcoded data inside components.**

**Core entities:**
- `Team` — id, city, name, abbreviation, conference (AFC/NFC), division (North/South/East/West), logo path, primary/secondary color, record (W-L-T), homeRecord, awayRecord, pointsFor, pointsAgainst, pointDifferential, strengthOfSchedule.
- `Player` — id, name, headshot path, teamId, position (QB/RB/WR/TE/EDGE/DT/LB/CB/S), seasonStats object, careerStats object, injuryStatus, isFreeAgent.
- `Game` — id, week, homeTeamId, awayTeamId, status (`scheduled`/`live`/`final`), homeScore, awayScore, quarter/clock, spread, overUnder, moneyline odds, and (if live) liveWinProbability for each team, plus liveLeaders (passing/rushing/receiving leader player refs + lines).
- `Ranking` — position, source (`media` | `rso` | `fan`), week, ordered list of `{ playerId, rank, score }`.
- `FantasyPlayerWeek` — playerId, position, week, fantasyPoints (for "highest scorers of the week").
- `WaiverPlayer` — playerId, percentRostered, trend.

**Logos & headshots:** create `<TeamLogo teamId>` and `<PlayerHeadshot playerId>` components. For now use placeholder SVGs (team abbreviation in a silver circle / player silhouette) so nothing is broken. Centralize the asset path logic so real logos/headshots drop in later by just adding image files.

**Swappability:** put all data access behind functions like `getGames(week)`, `getRankings(position, source)`, `getStandings(scope)`, `getPlayer(id)` in `src/data/api.ts`. Today they return mock data; later they'll hit a real NFL API. Components must only call these functions.

---

## Phase 2.5 — Real accounts: Supabase auth & database

Set up Supabase, then build authentication and the schema for all user/editor-owned data. **NFL stats data stays in the mock layer (Phase 2); everything in this phase is real and persisted.**

**Supabase clients (App Router, cookie-based):**
- Create the standard `utils/supabase/` clients with `@supabase/ssr`: a browser client (client components) and a server client (server components, server actions, route handlers).
- Add the Proxy/middleware that refreshes the auth token on each request. Use `getClaims()` / `getUser()` for protecting pages — never trust `getSession()`'s user object for authorization.

**Auth:**
- Wire up the existing **Login / Sign in** button to real auth. Support **email/password and Google OAuth** (magic-link optional).
- Build `/login` and `/signup` routes (on-brand: white/silver/black), a signed-in account menu in the header (replacing the Login button), profile page, and sign-out.
- Protect any account-only routes (the user's fantasy team, vote history, admin) at the middleware level.

**Database schema (Postgres, with Row Level Security on every table):**
- `profiles` — `id` (FK to `auth.users`), display name, avatar, `role` (`user` | `admin`), `favorite_team_id`, created_at. Auto-create a row on signup via a trigger.
- `fan_ballots` — id, user_id, position, ballot_type (`top10` | `top20`), week, created_at. **One ballot per user per position per week** (unique constraint).
- `fan_ballot_picks` — ballot_id, player_id, slot (1–20). The points a pick is worth derive from slot + ballot_type (Top 20: 1st=20…20th=1; Top 10: 1st=10…10th=1).
- `media_rankings` — position, source-week, ordered player_ids. **Editable only by admins** (this is the "updated by me" Media ranking). Same idea for `media_power_rankings` (team order).
- `fantasy_teams` — id, user_id, name, league info.
- `fantasy_roster` — team_id, player_id, slot/starter flag.
- (Stretch) `fantasy_matchups`, `fantasy_standings` if you want the home-page fantasy module fully live.

**Row Level Security rules:**
- A user can read/insert/update/delete only **their own** `fan_ballots`, `fan_ballot_picks`, `fantasy_teams`, `fantasy_roster` (`auth.uid() = user_id`).
- `media_rankings` / `media_power_rankings`: readable by everyone, writable only where the caller's `profiles.role = 'admin'`.
- `profiles`: a user can read all profiles (for display) but update only their own.

**Admin:** the Media ranking and Media power ranking are maintained by the site owner. Build a simple `/admin` area (admin-role-gated) with a drag-to-reorder editor that writes to `media_rankings` / `media_power_rankings`. Seed your own account as admin.

**Wire the data layer to Supabase for user data:** `getRankings(position, 'fan')`, `getRankings(position, 'media')`, `getFantasyTeam(userId)`, etc. now read from Supabase; the NFL `getGames`/`getStandings`/`getPlayer` stay on mock. Keep the same `src/data/api.ts` function surface so pages don't care where data comes from.

Stop here and show me: working signup/login (email + Google), a created profile row, the admin gate, and one RLS check (a second user can't see/edit the first user's ballot).

---

## Phase 3 — The RSO scoring engine (the heart of the official rankings)

Create `src/lib/rsoScoring.ts` — a pure, data-driven scoring engine. A player's **RSO Official score = production points + the sum of every applicable tiered bonus** for their position. Bonuses are **highest matching tier only** (a player hitting 72%+ completion gets +5, not +1+2.5+4.5+5). Encode it exactly as below.

> Implementation note: represent each position as `{ production: {statKey: multiplier}, bonuses: [{ metric, tiers: [{min, points}] }] }` and write one generic `scorePlayer(player)` that applies it. Don't hand-write per-position math.

### Offense

**QB — Production:** passYds ×0.025, rushYds ×0.05, passTD ×4, rushTD ×6, INT ×−3, fumbles ×−3
**QB Bonuses:**
- Completion %: 65–67.9→+1, 68–69.9→+2.5, 70–71.9→+4.5, 72+→+5
- TD:INT ratio: 2.0–2.99→+1, 3.0–3.99→+2.5, 4.0–4.99→+4.5, 5.0+→+5
- Passer rating: 95–99.9→+1, 100–104.9→+2.5, 105–109.9→+4.5, 110+→+5
- Yards/attempt: 7.0–7.49→+1, 7.5–7.99→+2.5, 8.0–8.49→+4.5, 8.5+→+5

**RB — Production:** rushYds ×0.05, rushTD ×6, receptions ×0.5, recYds ×0.05, recTD ×6, fumbles ×−3
**RB Bonuses:**
- Yards/carry: 4.0–4.49→+1, 4.5–4.99→+2.5, 5.0–5.49→+5, 5.5+→+7
- Yards/reception: 8–9.9→+1, 10–11.9→+2.5, 12–13.9→+4.5, 14+→+5
- Scrimmage yards: 1250+→+1, 1500+→+2.5, 1750+→+5, 2000+→+7
- Total TDs: 10+→+1, 15+→+4, 20+→+7, 25+→+10

**WR — Production:** receptions ×0.5, recYds ×0.05, recTD ×6, rushYds ×0.05, rushTD ×6, fumbles ×−3
**WR Bonuses:**
- Yards/reception: 10–11.9→+1, 12–13.9→+2.5, 14–15.9→+5, 16+→+7
- Catch rate: 60–64.9→+1, 65–69.9→+2.5, 70–74.9→+4.5, 75+→+7
- Scrimmage yards: 1000+→+1, 1250+→+2.5, 1500+→+6, 1750+→+8
- Total TDs: 8+→+1, 12+→+2.5, 15+→+7, 18+→+10

**TE — Production:** receptions ×0.6, recYds ×0.06, recTD ×6, rushYds ×0.05, rushTD ×6, fumbles ×−3
**TE Bonuses:**
- Yards/reception: 9.0–10.9→+1, 11.0–12.9→+2.5, 13.0–14.9→+4.5, 15.0+→+5
- Catch rate: 65–69.9→+1, 70–74.9→+2.5, 75–79.9→+4.5, 80+→+5
- Receiving yards: 750+→+1, 900+→+2.5, 1100+→+4.5, 1300+→+5
- Touchdowns: 6+→+1, 8+→+2.5, 10+→+4.5, 12+→+5

### Defense

**EDGE (DE/OLB pass rushers) — Production (per-event point values):** sack 6, TFL 2, QB hit 1, forced fumble 4, fumble recovery 2, safety 4, pass defended 1, INT 8, TD 10
**EDGE Bonuses:**
- Sacks: 8+→+1, 12+→+2.5, 16+→+4.5, 20+→+5
- TFL: 10+→+1, 15+→+2.5, 20+→+4.5, 25+→+5

**DT (interior DL) — Production:** sack 8, TFL 3, QB hit 1, forced fumble 4, run stop 1, fumble recovery 2, safety 4, pass defended 1
**DT Bonuses:**
- Sacks: 5+→+1, 8+→+2.5, 10+→+4.5, 12+→+5
- TFL: 8+→+1, 12+→+2.5, 16+→+4.5, 20+→+5

**LB — Production:** solo tackle 1, assisted tackle 0.5, TFL 2, sack 5, INT 8, pass defended 1, forced fumble 4, fumble recovery 2, TD 10
**LB Bonuses:**
- Total tackles: 100+→+1, 125+→+2.5, 150+→+4.5, 175+→+5
- Impact plays (sacks + INTs + FF): 8+→+1, 12+→+2.5, 16+→+4.5, 20+→+5

**CB — Production:** INT 8, pass defended 2, solo tackle 0.5, TFL 2, forced fumble 4, fumble recovery 2, sack 6, TD 10
**CB Bonuses:**
- Interceptions: 3+→+1, 5+→+2.5, 7+→+4.5, 9+→+5
- Pass deflections: 10+→+1, 15+→+2.5, 20+→+4.5, 25+→+5
- Passer rating allowed (lower is better): <80→+1, <70→+2.5, <60→+4.5, <50→+5
- Completion % allowed: <60→+1, <55→+2.5, <50→+4.5, <45→+5

**Safety — Production:** INT 8, pass defended 1.5, solo tackle 0.75, assisted tackle 0.4, sack 5, TFL 2, forced fumble 4, fumble recovery 2, TD 10
**Safety Bonuses:**
- Interceptions: 3+→+1, 5+→+2.5, 7+→+4.5, 9+→+5
- Tackles: 80+→+1, 100+→+2.5, 120+→+4.5, 140+→+5
- Passer rating allowed: <85→+1, <75→+2.5, <65→+4.5, <55→+5
- Completion % allowed: <65→+1, <60→+2.5, <55→+4.5, <50→+5

**Output:** a function that takes a player and returns total RSO score + a breakdown (production subtotal, each bonus that fired and why). Sort players within a position by score to produce the RSO Official ranking. Add a small unit test with a couple of hand-checked players to confirm the math.

---

## Phase 4 — Player Rankings page (`/rankings`)

Three ranking sources, switchable via tabs: **Media**, **RSO Official**, **Fan**.
- **Media:** the editor-maintained order from Supabase (`media_rankings`), set via the `/admin` editor. Read-only for normal users.
- **RSO Official:** generated live by the Phase 3 scoring engine.
- **Fan:** generated from fan votes (Phase 4b).
- Below the source tabs, a **position selector** (QB default, then RB, WR, TE, EDGE, DT, LB, CB, S). Show that position's ranked list.
- Note on the page: rankings are **preseason** (based on last season's stats + projected starters) until the 2026 season starts, then updated weekly. Surface a small "Preseason · based on 2025" badge.
- Each row: rank #, player headshot (clickable), name (clickable), team logo, and the score (for RSO) / ballot count (for Fan).

### Phase 4b — Fan voting (account-based, persisted)

- Voting **requires a signed-in account** (prompt sign-in if a logged-out user tries to vote). This prevents ballot-stuffing and ties each ballot to a `user_id`.
- A user builds a **Top 20 or Top 10** ballot for a position (their choice), saved to `fan_ballots` + `fan_ballot_picks` in Supabase. Enforce **one ballot per user per position per week**; re-voting updates their existing ballot.
- Scoring: **Top 20** → 1st = 20 pts, 2nd = 19 … 20th = 1. **Top 10** → 1st = 10, 2nd = 9 … 10th = 1.
- Aggregate **all users' ballots** per position (server-side, e.g. a Postgres view or RPC) to produce the live Fan ranking — every visitor sees the same aggregated result.
- For any player receiving **no votes**, fall back to a blend of their RSO Official and Media positions to fill out the rest of the list.
- If **no ballots exist yet** for a position, display **"Waiting for all votes"** instead of a ranking.
- After a user submits a vote, show a **"Share with a friend"** popup with a shareable link that opens a pre-filled ballot for that position (the friend signs in / signs up, then votes).

---

## Phase 5 — Home page (`/`)

A scrollable dashboard of sections, in this order:

1. **Live scores / matchups of the week** — every game this week as a card: both team logos (clickable), score, **spread + odds**. If a game is **live**, show a **live win-probability** bar for each team. Directly under each live score, show **live stat leaders** for that game: passing leader, rushing leader, receiving leader (each a clickable player).
2. **Player Rankings (embedded)** — top 10 by position, position selector starting at QB, with the same Media / RSO Official / Fan tabs as the full page. A **"Show full 32"** button expands that list to the top 32 inline.
3. **Stats** — top 3 leaders for each major stat: passing yards, rushing yards, receiving yards, tackles, sacks, interceptions. A toggle switches the whole section to **Touchdowns** (top 3 per relevant category).
4. **Standings (embedded)** — flip through scope: **AFC**, **NFC**, **NFL overall**, and down to individual divisions; show that grouping's standings.
5. **NFL news** — major news + **injury updates** + **free agency**: a "Top 10 free agents overall" list with position tabs to flip to top-10 free agents per position.
6. **Fantasy** — highest weekly scorers per position (top 10 overall + top 10 per position) and **waiver-wire pickups**. If the **signed-in user has a fantasy team** (in Supabase), also show **their team**: this week's matchup, their top players, and their fantasy standings. Logged-out users see a "Sign in to see your team" prompt here.

Reuse the embedded components (rankings, standings, stat leaders) from their full pages — don't rebuild them.

---

## Phase 6 — Stats page (`/stats`)

- Full stat tables: **every stat category (including advanced stats) for every position**, for every player who has recorded a stat.
- **Season-type tabs:** Regular Season (default); add a **Playoffs** tab when playoff data exists.
- **Year tab:** preseason shows **2025** (last season) stats; when the 2026 regular season starts, live stats update here.
- Sortable columns, filter by position, search by player. Every player name clickable.

---

## Phase 7 — Standings page (`/standings`)

- Switch scope: **NFL**, **AFC**, **NFC**, and individual **divisions**.
- Per team: wins, losses, ties, home record, away record, **point differential**, points for, points against, plus standard tiebreaker-relevant columns. Team logos clickable.
- **Power Rankings** — two only: **Media** (editor-set via `/admin`, stored in `media_power_rankings`) and **RSO Official**, where RSO Official is computed from **winning percentage + strength of schedule (quality of wins)**. Implement a small team-power function mirroring the player engine's data-driven style, and show the ranking with movement arrows.

---

## Phase 8 — Team pages, Player profiles, and the "coming soon" pages

**Team page (`/team/[id]`):** roster (grouped by position, clickable players), team stats, team info (division, record, etc.), team logo/colors as accent.

**Player profile (`/player/[id]`):** headshot, name, team (clickable), position. Show **season stats** and **career stats**, their **position rankings** across all three sources (Media / RSO / Fan) and fantasy ranking, and a callout if they appear in **any top-32 list** (which source + rank). Reuse the scoring breakdown from Phase 3 to show *why* they rank where they do on RSO Official.

**Fantasy page (`/fantasy`):** placeholder — "Fantasy football, soon to come." (styled, on-brand).
**Be a GM page (`/be-a-gm`):** placeholder — "Coming soon." (styled, on-brand).

---

## Final pass

- Verify every player and team is clickable everywhere and routes correctly.
- Confirm the active-tab shadow-underline works on all pages.
- Confirm the RSO scoring engine and team power-ranking math match the spec (run the unit tests).
- **Auth & security:** sign-up/login (email + Google) works; profile row auto-creates; protected routes redirect when logged out; the `/admin` editor is admin-only; and **RLS is verified** — a second account cannot read or modify another user's ballots, fantasy team, or profile.
- Confirm fan votes and fantasy teams **persist across refresh and sign-out/sign-in**, and that the Fan ranking aggregates across all users.
- Make sure swapping the mock **NFL** data layer for a real API would only touch `src/data/` (user data already lives in Supabase).
- Run a production build (`npm run build`) and fix any type/lint errors.

When a real NFL data source is wanted later, good options to plug into the `src/data/api.ts` functions include a paid sports-data API (e.g. SportsRadar or similar) — keep that out of scope for now.
