# RSO design system: "Silver Standard"

A bright, precise, instrument-panel feel: white paper, brushed-silver surfaces, black ink, and numbers set like a timing board. Chrome is the only "color", used sparingly where the logo would put it. Team colors appear only as small identity marks and on team/player accents.

## Tokens (src/app/globals.css)
| Role | Light | Dark |
|---|---|---|
| `primary` page | `#ffffff` | `#0b0b0c` |
| `band` section wash | `#f6f6f7` | `#101012` |
| `surface` cards | `#ffffff` | `#141416` |
| `silver-light` hover / fills | `#f0f0f2` | `#1c1c1f` |
| `silver` hairlines | `#e4e4e7` | `#2a2a2e` |
| `track` meter track | `#dcdce0` | `#2c2c31` |
| `silver-deep` muted text | `#62646b` | `#9d9fa6` |
| `ink` text / active | `#0a0a0a` | `#f5f5f6` |
| `up` / `down` / `warn` | status only, always with a sign, label or icon | |

No yellow, gold or amber anywhere (team logos excepted).

## Type
- **Archivo** (variable width). Display and headings: width 112%, weight 600, tracking -0.02em, sentence case. Body: width 100%, 400/500.
- Figures: proportional for large standalone values (hero numbers, tiles); `tabular-nums` only in columns.
- Label style: 12px, 500, muted. Uppercase only for table column headers.

## Shape and depth
- Cards 14px radius, 1px `silver` border, near-invisible shadow. Controls (buttons, chips, selects, search) are full pills. Headshots and team marks are circles.
- One raised elevation for menus, modals and hovered cards.
- No slants, no thick rules, no gradient text, no glassmorphism panels.

## Signature details
- **Sliding ink underline**: 2px black bar with a soft shadow beneath it, used for the header nav and every view-switching tab row (`.tabs` / `.tab`).
- **Chrome badge** (`.chrome`): brushed-silver circle for ranks 1-3. Reserved for podium ranks.
- **Brushed-silver hero** (`.hero-silver`): white-to-silver wash with a soft top highlight on page heroes (player, team, game).
- **Meters** (`.meter`): black fill on a `track` rail, 4px tall, rounded ends. One hue only; used for relative stat size, win %, percentile, win probability.

## Components
`.panel`, `.btn-primary` (ink pill), `.btn-outline` (silver outline pill, black text), `.chip` group (position / scope pickers: silver outline pills, active = ink fill), `.tabs`/`.tab` (underline), `.field`, `.tag`, `.meter`, `.chrome`.

## Motion
Short and functional: underline slide (300ms, ease-out-expo), hover lift on cards (-2px), content fade-up on route load (240ms, staggered by section). All disabled under `prefers-reduced-motion`.

## Data display (dataviz rules)
- Stat tiles: label, then value (proportional figures), optional meter.
- Meters use a single hue (ink) on the silver track; never color-by-rank.
- Status color is reserved for good/bad and always paired with a sign or label.
