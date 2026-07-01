import Link from "next/link";
import RsoLogo from "./RsoLogo";
import { NAV_ITEMS } from "@/lib/nav";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-silver bg-primary">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-8 sm:px-6 md:flex-row md:justify-between">
        <Link href="/" aria-label="RSO home">
          <RsoLogo height={34} />
        </Link>

        <nav>
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-silver-deep">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="text-xs text-silver-deep">
          © {year} RSO. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
