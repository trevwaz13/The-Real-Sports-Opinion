import Link from "next/link";
import { ChevronRight } from "lucide-react";

// Consistent home-page section header with an optional "View all" link.
export default function SectionHeader({
  title,
  href,
  linkLabel = "View all",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-silver pb-2">
      <h2 className="text-xl font-bold text-ink sm:text-2xl">{title}</h2>
      {href && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-silver-deep transition-colors hover:text-ink"
        >
          {linkLabel}
          <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}
