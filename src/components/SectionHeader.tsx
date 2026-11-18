import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

// Section header: title with an optional one-line description, optional
// controls, and an optional "View all" link on the right.
export default function SectionHeader({
  title,
  description,
  href,
  linkLabel = "View all",
  children,
}: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end gap-x-5 gap-y-3">
      <div className="mr-auto">
        <h2 className="font-display text-2xl leading-tight text-ink sm:text-[1.75rem]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-silver-deep">{description}</p>
        )}
      </div>
      {children}
      {href && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1 pb-1 text-sm font-medium text-ink"
        >
          <span className="border-b border-silver transition-colors group-hover:border-ink">
            {linkLabel}
          </span>
          <ArrowUpRight
            size={15}
            className="text-silver-deep transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
          />
        </Link>
      )}
    </div>
  );
}
