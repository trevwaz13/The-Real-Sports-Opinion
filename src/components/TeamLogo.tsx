import { getTeam } from "@/data/api";

// Renders a team's real logo (from nflverse), falling back to an on-brand
// placeholder (abbreviation in a silver circle with a primary-color ring) for
// unknown teams / free agents.
export default function TeamLogo({
  teamId,
  size = 32,
  className = "",
}: {
  teamId: string;
  size?: number;
  className?: string;
}) {
  const team = getTeam(teamId);
  const logo = team?.logoPath;

  if (logo && logo.startsWith("http")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={team ? `${team.city} ${team.name}` : teamId}
        width={size}
        height={size}
        loading="lazy"
        className={`object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const label = team?.abbreviation ?? (teamId === "FA" ? "FA" : "—");
  const ring = team?.primaryColor ?? "#9A9A9A";
  const fontSize = label.length >= 3 ? size * 0.34 : size * 0.42;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={team ? `${team.city} ${team.name}` : "Free agent"}
      className={className}
    >
      <circle cx="50" cy="50" r="46" fill="#E8E8E8" stroke={ring} strokeWidth="5" />
      <text
        x="50"
        y="50"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize={fontSize * (100 / size)}
        fontWeight="800"
        fill="#0A0A0A"
        fontFamily="system-ui, sans-serif"
      >
        {label}
      </text>
    </svg>
  );
}
