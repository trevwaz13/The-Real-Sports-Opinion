import type { ReactNode } from "react";
import SeasonBadge from "./SeasonBadge";

// Page title block: large title, an optional season badge, a short description
// and an optional aside (controls or figures) on the right.
export default function PageHeading({
  title,
  badge = false,
  children,
  aside,
}: {
  title: string;
  badge?: boolean;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-6 pb-8 pt-10 sm:pt-14 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {badge && <SeasonBadge className="mb-4" />}
        <h1 className="font-display text-4xl leading-[1.05] text-ink sm:text-[3.25rem]">
          {title}
        </h1>
        {children && (
          <div className="mt-3 max-w-[60ch] text-base leading-relaxed text-silver-deep">
            {children}
          </div>
        )}
      </div>
      {aside}
    </header>
  );
}
