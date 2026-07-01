import { PRESEASON_BADGE } from "@/data/season";

// Small "Preseason · based on 2025" pill shown on data pages until the 2026
// regular season starts.
export default function PreseasonBadge({
  className = "",
}: {
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-silver bg-silver-light px-2.5 py-0.5 text-xs font-semibold text-silver-deep ${className}`}
    >
      {PRESEASON_BADGE}
    </span>
  );
}
