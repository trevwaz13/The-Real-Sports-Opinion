# RSO: The Real Sports Opinion

## What it is
A multi-page NFL site for stats, player and team rankings, standings, game detail, and (soon) fantasy. Its point of view is the **RSO Official** ranking: a data-driven scoring engine shown side by side with an editor-set **Media** ranking and a **Fan** ranking aggregated from user ballots.

## Who uses it
Football fans checking in during the week: scanning scores, comparing where a player ranks across Media / RSO / Fan, reading stat leaders and standings, voting on the Fan ranking. Mostly phone, often desktop. They know the sport and the abbreviations.

## Surfaces and modes
- Home, rankings, stats, standings, team, player, game: **Operate** (scan, compare, drill in).
- Sign in / sign up / account / settings / admin: **Operate**.
- Fantasy: **Operate** (weekly and season PPR scoring, waiver watch).
- Be a GM (a salary-cap lineup builder) is built but shelved for now; see git history.

## Product truths to keep
- Every player and team name links to its page.
- Rankings are preseason (based on 2025) until the 2026 season starts; the "Preseason, based on 2025" badge stays visible on data pages.
- Fan ranking shows "Waiting for all votes" when no ballots exist.
- Data comes from nflverse (2025 season); user data from Supabase.

## Brand constraints (from the owner)
- **White, silver and black only.** Mostly white, silver accents, black text. **No yellow, ever.**
- Modern and refined, never blocky; no slanted/italic all-caps "sports template" styling.
- The logo is the supplied chrome "RSO" wordmark image.
- The active nav item is marked by a black underline with a soft drop shadow that slides between items.
