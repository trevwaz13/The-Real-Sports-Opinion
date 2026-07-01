# RSO — The Real Sports Opinion

A clean, mobile-first NFL stats, rankings, and fantasy website built with **Next.js (App Router) + TypeScript + Tailwind**. It features the **RSO Official scoring engine** — a data-driven system that ranks players and teams from real 2025 NFL data.

## Features

- **Home dashboard** — live-style scores & matchups with a **week selector (1–18)**, embedded player rankings, stat leaders, standings, news/free agency, and fantasy modules.
- **Player Rankings** (`/rankings`) — Media · **RSO Official** · Fan, per position, with cross-source ranks and gold/silver/bronze medals.
- **RSO scoring engine** — a pure, data-driven engine (`src/lib/rsoScoring.ts`) that scores players by production points + tiered bonuses, with a full breakdown on each player page. Unit-tested.
- **Stats** (`/stats`) — full sortable/searchable stat tables per position with hover tooltips.
- **Standings** (`/standings`) — scope by NFL / conference / division, plus a data-driven **team power ranking** (win% + strength of schedule) with movement arrows.
- **Game detail** (`/game/[id]`) — real box scores, an animated field with play-by-play, and per-team leaders.
- **Team & player pages** — real rosters, season + career stats, color-accented headers, and the RSO score breakdown.
- **Accounts** (Supabase) — email/Google auth, profiles, an admin editor for Media rankings, and account-based fan voting with live aggregation.

## Real data

Teams, players, stats, standings, games, and box scores are pulled from **[nflverse](https://github.com/nflverse) via [nflreadpy](https://github.com/nflverse/nflreadpy)** (2025 season). To refresh:

```bash
python3 scripts/fetch_nfl_data.py   # writes src/data/real/*.json
```

Every page reads through `src/data/api.ts`, so the data source is swappable in one folder.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts: `npm run build`, `npm test` (Vitest), `npm run lint`.

## Accounts (Supabase)

Auth/accounts are optional — the site runs fully on real/mock data without them and degrades gracefully. To enable, follow **[docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)**: create a Supabase project, add your keys to `.env.local` (see `.env.local.example`), and run `supabase/schema.sql`.

## Tech

Next.js 16 · React 19 · TypeScript · Tailwind v4 · Zustand · lucide-react · Supabase (`@supabase/ssr`) · Vitest.
