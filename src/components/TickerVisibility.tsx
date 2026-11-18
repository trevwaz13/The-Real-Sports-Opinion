"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

// Hides the score ticker on the home page (which shows the full scoreboard).
export default function TickerVisibility({ children }: { children: ReactNode }) {
  return usePathname() === "/" ? null : children;
}
