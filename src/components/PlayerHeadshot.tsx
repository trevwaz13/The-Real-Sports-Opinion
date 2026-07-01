import { getPlayer } from "@/data/api";

// Renders a player's real headshot (from nflverse), falling back to a silhouette
// in a silver circle when there's no image.
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
        className={`rounded-full bg-silver-light object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={name ?? "Player"}
      className={`rounded-full ${className}`}
    >
      <circle cx="50" cy="50" r="50" fill="#E8E8E8" />
      <circle cx="50" cy="38" r="18" fill="#9A9A9A" />
      <path d="M18 86c0-18 14-30 32-30s32 12 32 30z" fill="#9A9A9A" />
    </svg>
  );
}
