import type { CSSProperties } from "react";

// Metallic gradient text for the top three ranks: gold (1), silver (2), bronze
// (3). Applied to cross-source rank numbers on rankings rows. Returns undefined
// for ranks 4+ (rendered normally).
export function medalStyle(rank: number | undefined): CSSProperties | undefined {
  const gradient =
    rank === 1
      ? "linear-gradient(180deg,#FBE9A0 0%,#E7B645 45%,#A87C1C 100%)"
      : rank === 2
        ? "linear-gradient(180deg,#F4F4F4 0%,#C9C9C9 45%,#8C8C8C 100%)"
        : rank === 3
          ? "linear-gradient(180deg,#E9C08C 0%,#C77B3E 45%,#854E22 100%)"
          : null;
  if (!gradient) return undefined;
  return {
    backgroundImage: gradient,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: "transparent",
    filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.15))",
  };
}
