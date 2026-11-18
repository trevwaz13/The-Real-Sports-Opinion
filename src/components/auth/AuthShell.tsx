import type { ReactNode } from "react";
import PageContainer from "../PageContainer";
import RsoLogo from "../RsoLogo";

// Two-part layout for sign-in / sign-up: a dark logo panel beside the form on
// large screens, stacked on phones.
export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <PageContainer className="py-10 sm:py-16">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-[20px] border border-silver bg-surface shadow-float lg:grid-cols-2">
        <div className="hero-silver relative flex flex-col justify-between gap-12 overflow-hidden !border-b-0 p-7 sm:p-10 lg:border-r lg:border-silver">
          <RsoLogo height={34} />
          <div>
            <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">{title}</h1>
            <p className="mt-2 text-silver-deep">{subtitle}</p>
          </div>
        </div>
        <div className="p-7 sm:p-10">{children}</div>
      </div>
    </PageContainer>
  );
}
