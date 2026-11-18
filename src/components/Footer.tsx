import Link from "next/link";
import RsoLogo from "./RsoLogo";
import { NAV_ITEMS } from "@/lib/nav";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-silver bg-band">
      <div className="mx-auto grid max-w-[1240px] gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <Link href="/" aria-label="RSO home" className="inline-block">
            <RsoLogo height={32} />
          </Link>
          <p className="mt-3 max-w-xs text-sm text-silver-deep">
            NFL stats, player and power rankings, standings, and fantasy.
          </p>
        </div>

        <div className="md:text-right">
          <nav>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 md:justify-end">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-silver-deep transition-colors hover:text-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="mt-4 text-sm text-silver-deep">© {year} RSO</p>
        </div>
      </div>
    </footer>
  );
}
