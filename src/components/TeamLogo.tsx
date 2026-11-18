import { getTeam } from "@/data/api";

// Renders a team's real logo (from nflverse), falling back to the abbreviation
// in a neutral circle for unknown teams / free agents.
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
        className={`team-logo object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const label = team?.abbreviation ?? (teamId === "FA" ? "FA" : "-");
  return (
    <span
      role="img"
      aria-label={team ? `${team.city} ${team.name}` : "Free agent"}
      className={`inline-grid shrink-0 place-items-center rounded-full bg-silver-light font-semibold text-silver-deep ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * (label.length >= 3 ? 0.3 : 0.38),
      }}
    >
      {label}
    </span>
  );
}
