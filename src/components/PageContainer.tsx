import type { ReactNode } from "react";

// Consistent content width + horizontal padding for every page.
export default function PageContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1240px] px-4 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}
