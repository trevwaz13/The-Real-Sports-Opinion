import { UserRound } from "lucide-react";
import { getPlayer } from "@/data/api";

// Renders a player's real headshot (from nflverse) cropped into a circle,
// falling back to a person glyph when there's no image.
export default function PlayerHeadshot({
  playerId,
  name,
  size = 40,
  className = "",
}: {
  playerId: string;
  name?: string;
  size?: number;
  className?: string;
}) {
  const player = getPlayer(playerId);
  const url = player?.headshotPath;

  if (url && url.startsWith("http")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name ?? player?.name ?? "Player headshot"}
        width={size}
        height={size}
        loading="lazy"
        className={`shrink-0 rounded-full bg-silver-light object-cover object-top ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={name ?? "Player"}
      className={`inline-grid shrink-0 place-items-center rounded-full bg-silver-light text-silver-deep ${className}`}
      style={{ width: size, height: size }}
    >
      <UserRound size={Math.round(size * 0.55)} strokeWidth={1.75} />
    </span>
  );
}
