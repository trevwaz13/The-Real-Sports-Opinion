import TeamLogo from "../TeamLogo";

// The field is drawn in SVG with a perspective trapezoid (narrower/higher at the
// back, wider/lower at the front) so it reads as a flat, tilted broadcast field.
// Everything except the logo pin is rendered in these viewBox coordinates.
const VB_W = 1000;
const VB_H = 340;
const TOP_Y = 78;
const BOT_Y = 250;
const TOP_L = 150;
const TOP_R = 850;
const BOT_L = 28;
const BOT_R = 972;

const xTop = (f: number) => TOP_L + f * (TOP_R - TOP_L);
const xBot = (f: number) => BOT_L + f * (BOT_R - BOT_L);
const X = (f: number, d: number) => xTop(f) + (xBot(f) - xTop(f)) * d;
const Y = (d: number) => TOP_Y + (BOT_Y - TOP_Y) * d;
// Ball positions 0–100 live between the goal lines; end zones take f 0–0.1 / 0.9–1.
const fOf = (p: number) => 0.1 + (p / 100) * 0.8;
const quad = (f0: number, f1: number) =>
  `${X(f0, 0)},${Y(0)} ${X(f1, 0)},${Y(0)} ${X(f1, 1)},${Y(1)} ${X(f0, 1)},${Y(1)}`;

// Screen point for an absolute yard position, along mid-depth.
const PLAY_D = 0.5;
function pt(p: number): { x: number; y: number } {
  const f = fOf(Math.max(0, Math.min(100, p)));
  return { x: X(f, PLAY_D), y: Y(PLAY_D) };
}

function arrowHead(x: number, y: number, dir: number, color: string) {
  const s = 5.5;
  const points =
    dir >= 0
      ? `${x},${y} ${x - s - 2},${y - s} ${x - s - 2},${y + s}`
      : `${x},${y} ${x + s + 2},${y - s} ${x + s + 2},${y + s}`;
  return <polygon points={points} fill={color} />;
}

function solidArrow(
  a: { x: number; y: number },
  b: { x: number; y: number },
  color: string,
) {
  return (
    <>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth="2.25" />
      {arrowHead(b.x, b.y, b.x >= a.x ? 1 : -1, color)}
    </>
  );
}

function xMark(x: number, y: number, color: string) {
  const s = 7;
  return (
    <g stroke={color} strokeWidth="3.5" strokeLinecap="round">
      <line x1={x - s} y1={y - s} x2={x + s} y2={y + s} />
      <line x1={x - s} y1={y + s} x2={x + s} y2={y - s} />
    </g>
  );
}

function ballOnLabel(p: number, awayAbbr: string, homeAbbr: string): string {
  if (p === 50) return "50";
  return p < 50 ? `${awayAbbr} ${p}` : `${homeAbbr} ${100 - p}`;
}
function ordinal(n: number): string {
  return `${n}${["st", "nd", "rd", "th"][Math.min(n - 1, 3)]}`;
}

// A standing gooseneck ("slingshot") goal post at base (bx, by): a short ground
// pole, a small gooseneck offsetting toward the field (dir: +1 right / -1 left),
// and a crossbar drawn PARALLEL to the slanted back end line, with the two
// uprights rising straight up from its ends. A grey padded base sits at the
// bottom.
function goalPost(bx: number, by: number, gradId: string, dir: 1 | -1) {
  const baseH = 12;
  const gooseH = 12; // natural, shorter gooseneck
  const offset = 13 * dir;
  const cw = 18;
  const upH = 58;
  const poleTopY = by - baseH;
  const ccX = bx + offset;
  const ccY = poleTopY - gooseH;

  // Crossbar direction = the end-line slope (perspective) for this side.
  const edgeF = dir === 1 ? 0 : 1;
  const edgeDx = xBot(edgeF) - xTop(edgeF);
  const edgeDy = BOT_Y - TOP_Y;
  const elen = Math.hypot(edgeDx, edgeDy);
  const ux = edgeDx / elen;
  const uy = edgeDy / elen;
  const e1x = ccX - cw * ux;
  const e1y = ccY - cw * uy;
  const e2x = ccX + cw * ux;
  const e2y = ccY + cw * uy;

  const d =
    `M${bx} ${by} V${poleTopY} ` + // ground pole
    `Q ${bx} ${ccY} ${ccX} ${ccY} ` + // gooseneck
    `M${e1x} ${e1y} L ${e2x} ${e2y} ` + // crossbar parallel to the end line
    `M${e1x} ${e1y} V${e1y - upH} ` + // upright 1 (vertical)
    `M${e2x} ${e2y} V${e2y - upH}`; // upright 2 (vertical)
  return (
    <g strokeLinecap="round">
      <path
        d={d}
        transform="translate(2,2)"
        stroke="#74590a"
        strokeWidth="6.5"
        fill="none"
      />
      <path d={d} stroke={`url(#${gradId})`} strokeWidth="5.5" fill="none" />
      {/* grey padded base */}
      <rect
        x={bx - 3.5}
        y={by - 11}
        width="7"
        height="16"
        rx="3.5"
        fill="#9aa0a6"
        stroke="#5f6368"
        strokeWidth="1"
      />
    </g>
  );
}

export default function GameField({
  ballAbs,
  endAbs,
  airEndAbs,
  completed,
  playType,
  firstDownAbs,
  awayAbbr,
  homeAbbr,
  awayColor,
  homeColor,
  possessionIsAway,
  possessionTeamId,
  down,
  distance,
}: {
  ballAbs: number; // line of scrimmage
  endAbs?: number; // ball position after the play
  airEndAbs?: number; // pass catch / incompletion target
  completed?: boolean;
  playType?: "pass" | "run" | "sack";
  firstDownAbs?: number;
  awayAbbr: string;
  homeAbbr: string;
  awayColor: string;
  homeColor: string;
  possessionIsAway: boolean;
  possessionTeamId: string;
  down?: number;
  distance?: number;
}) {
  const ballF = fOf(ballAbs);
  const firstDownF =
    firstDownAbs !== undefined
      ? fOf(Math.max(0, Math.min(100, firstDownAbs)))
      : undefined;

  // Stripe + yard-line fractions across the playing area.
  const stripes = Array.from({ length: 8 }, (_, i) => 0.1 + i * 0.1);
  const yardLines = Array.from({ length: 9 }, (_, i) => 0.1 + i * 0.1);

  // Play movement geometry (run = solid arrow; pass = dotted air arc + catch
  // marker, plus a solid YAC arrow when there's run after the catch).
  const losPt = pt(ballAbs);
  const endPt = endAbs !== undefined ? pt(endAbs) : losPt;
  const airPt = airEndAbs !== undefined ? pt(airEndAbs) : undefined;
  let passCurve: string | undefined;
  if (playType === "pass" && airPt) {
    const arcH = Math.min(46, Math.max(16, Math.abs(airPt.x - losPt.x) * 0.4));
    const cx = (losPt.x + airPt.x) / 2;
    const cy = Y(PLAY_D) - arcH;
    passCurve = `M ${losPt.x} ${losPt.y} Q ${cx} ${cy} ${airPt.x} ${airPt.y}`;
  }

  // Logo-pin tip position (HTML overlay), anchored near the back of the line.
  const tipX = X(ballF, 0.16);
  const tipY = Y(0.16);

  return (
    <div>
      {/* Info bar */}
      <div className="mb-2 grid grid-cols-3 divide-x divide-silver rounded-lg border border-silver text-center">
        <div className="px-2 py-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-silver-deep">
            Down
          </div>
          <div className="text-sm font-bold text-ink">
            {down ? `${ordinal(down)} & ${distance}` : "—"}
          </div>
        </div>
        <div className="px-2 py-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-silver-deep">
            Ball On
          </div>
          <div className="text-sm font-bold text-ink">
            {ballOnLabel(ballAbs, awayAbbr, homeAbbr)}
          </div>
        </div>
        <div className="px-2 py-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-silver-deep">
            Possession
          </div>
          <div className="text-sm font-bold text-ink">
            {possessionIsAway ? awayAbbr : homeAbbr}
          </div>
        </div>
      </div>

      {/* Field */}
      <div className="relative">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full">
          <defs>
            {["gp-l", "gp-r"].map((id) => (
              <linearGradient key={id} id={id} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#FCE68F" />
                <stop offset="0.5" stopColor="#F4C20D" />
                <stop offset="1" stopColor="#C79309" />
              </linearGradient>
            ))}
          </defs>

          {/* Slab thickness (front face) for depth */}
          <polygon
            points={`${BOT_L},${BOT_Y} ${BOT_R},${BOT_Y} ${BOT_R - 22},${BOT_Y + 20} ${BOT_L + 22},${BOT_Y + 20}`}
            fill="#1c5128"
          />
          {/* Base field */}
          <polygon points={quad(0, 1)} fill="#2f7d3e" />
          {/* Mowing stripes (playing area only) */}
          {stripes.map((f, i) => (
            <polygon
              key={f}
              points={quad(f, f + 0.1)}
              fill={i % 2 === 0 ? "#36894740" : "#27693560"}
            />
          ))}
          {/* End zones */}
          <polygon points={quad(0, 0.1)} fill={awayColor} />
          <polygon points={quad(0.9, 1)} fill={homeColor} />
          {/* Goal-line + yard lines */}
          {yardLines.map((f) => (
            <line
              key={f}
              x1={xTop(f)}
              y1={TOP_Y}
              x2={xBot(f)}
              y2={BOT_Y}
              stroke="white"
              strokeOpacity={f === 0.1 || f === 0.9 ? 0.9 : 0.5}
              strokeWidth={f === 0.1 || f === 0.9 ? 3 : 2}
            />
          ))}

          {/* First-down line (yellow) */}
          {firstDownF !== undefined && (
            <line
              x1={xTop(firstDownF)}
              y1={TOP_Y}
              x2={xBot(firstDownF)}
              y2={BOT_Y}
              stroke="#FDE047"
              strokeWidth="4"
            />
          )}

          {/* Line of scrimmage (blue) — where the ball is now */}
          <line
            x1={xTop(ballF)}
            y1={TOP_Y}
            x2={xBot(ballF)}
            y2={BOT_Y}
            stroke="#2563EB"
            strokeWidth="4"
          />

          {/* Play movement */}
          {playType === "pass" && airPt ? (
            <>
              {passCurve && (
                <path
                  d={passCurve}
                  fill="none"
                  stroke="#0a0a0a"
                  strokeWidth="2.5"
                  strokeDasharray="2 5"
                  strokeLinecap="round"
                />
              )}
              {completed ? (
                <>
                  {/* dotted air line flows straight into the solid line */}
                  <line
                    x1={airPt.x}
                    y1={airPt.y}
                    x2={endPt.x}
                    y2={endPt.y}
                    stroke="#0a0a0a"
                    strokeWidth="2.25"
                  />
                  {arrowHead(
                    endPt.x,
                    endPt.y,
                    (endPt.x !== losPt.x ? endPt.x - losPt.x : airPt.x - losPt.x) >= 0
                      ? 1
                      : -1,
                    "#0a0a0a",
                  )}
                </>
              ) : (
                xMark(airPt.x, airPt.y, "#dc2626")
              )}
            </>
          ) : (
            endAbs !== undefined &&
            Math.abs(endPt.x - losPt.x) > 3 &&
            solidArrow(losPt, endPt, "#0a0a0a")
          )}

          {/* Goal posts: base off the end zone (in the white) and lower, with a
              longer gooseneck putting the crossbar right on the back line */}
          {goalPost(X(0, 0.32) - 30, Y(0.32) + 30, "gp-l", 1)}
          {goalPost(X(1, 0.32) + 30, Y(0.32) + 30, "gp-r", -1)}

          {/* Yard / team labels printed on the field's front edge (3D slab) */}
          {[
            { f: 0.05, t: awayAbbr },
            { f: 0.26, t: "20" },
            { f: 0.5, t: "50" },
            { f: 0.74, t: "20" },
            { f: 0.95, t: homeAbbr },
          ].map((l) => (
            <text
              key={l.f}
              x={xBot(l.f)}
              y={BOT_Y + 15}
              textAnchor="middle"
              fill="white"
              fillOpacity="0.92"
              fontSize="15"
              fontWeight="800"
            >
              {l.t}
            </text>
          ))}
        </svg>

        {/* Logo pin marking the spot (HTML so it can use the team logo) */}
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
          style={{ left: `${(tipX / VB_W) * 100}%`, top: `${(tipY / VB_H) * 100}%` }}
        >
          <div className="relative grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-white shadow-lg">
            <TeamLogo teamId={possessionTeamId} size={26} />
            <span className="absolute -bottom-[6px] left-1/2 h-0 w-0 -translate-x-1/2 border-x-[6px] border-t-[8px] border-x-transparent border-t-white" />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 flex justify-center gap-4 text-[10px] font-semibold text-silver-deep">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#2563EB]" />
          Line of scrimmage
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#FDE047]" />
          First down
        </span>
      </div>
    </div>
  );
}
