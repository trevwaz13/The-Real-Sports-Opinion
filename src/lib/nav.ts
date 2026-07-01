// Single source of truth for the site's primary navigation.
// Used by both the header and the footer so the link set never drifts.
export type NavItem = {
  label: string;
  href: string;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Player Rankings", href: "/rankings" },
  { label: "Stats", href: "/stats" },
  { label: "Standings", href: "/standings" },
  { label: "Fantasy", href: "/fantasy" },
  { label: "Be a GM", href: "/be-a-gm" },
];

/** Whether `href` is the active route for the given pathname. */
export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}
