import { SEASON_BADGE } from "@/data/season";

// Small badge naming the season and week the data describes, written by the
// data fetch (see scripts/fetch_nfl_data.py).
export default function SeasonBadge({
  className = "",
}: {
  className?: string;
}) {
  return (
    <span
      className={`tag border border-silver bg-band text-silver-deep ${className}`}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-silver-deep" />
      {SEASON_BADGE}
    </span>
  );
}
