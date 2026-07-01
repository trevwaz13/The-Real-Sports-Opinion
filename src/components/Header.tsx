"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import RsoLogo from "./RsoLogo";
import AuthButton from "./AuthButton";
import { NAV_ITEMS, isActive } from "@/lib/nav";

type Indicator = { left: number; width: number; visible: boolean };

export default function Header() {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState<Indicator>({
    left: 0,
    width: 0,
    visible: false,
  });
  const [menuOpen, setMenuOpen] = useState(false);

  const activeHref =
    NAV_ITEMS.find((item) => isActive(pathname, item.href))?.href ?? null;

  // Slide the underline beneath whichever desktop nav item is active.
  useLayoutEffect(() => {
    function update() {
      const nav = navRef.current;
      const el = activeHref ? itemRefs.current[activeHref] : null;
      if (nav && el) {
        const navRect = nav.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        // Inset the underline slightly inside the link so it reads a touch
        // shorter than the label width, kept centered under the text.
        const INSET = 18;
        setIndicator({
          left: elRect.left - navRect.left + INSET / 2,
          width: Math.max(0, elRect.width - INSET),
          visible: true,
        });
      } else {
        setIndicator((prev) => ({ ...prev, visible: false }));
      }
    }
    update();
    window.addEventListener("resize", update);
    // Fonts can shift link widths after first paint; re-measure when ready.
    document.fonts?.ready.then(update).catch(() => {});
    return () => window.removeEventListener("resize", update);
  }, [activeHref]);

  return (
    <header
      className="sticky top-0 z-50 border-b border-silver bg-primary/90 backdrop-blur"
      style={{ fontFamily: "var(--font-header)" }}
    >
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Logo — top left */}
        <Link href="/" aria-label="RSO home" className="shrink-0">
          <RsoLogo height={48} />
        </Link>

        {/* Desktop nav with animated shadow-underline */}
        <nav ref={navRef} className="relative hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    ref={(el) => {
                      itemRefs.current[item.href] = el;
                    }}
                    aria-current={active ? "page" : undefined}
                    className={`block px-3 py-2 text-[15px] font-black transition-colors ${
                      active ? "text-ink" : "text-silver-deep hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          {/* The sliding black underline with a soft grey drop-shadow */}
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 h-[3px] rounded-full bg-ink transition-all duration-300 ease-out"
            style={{
              left: indicator.left,
              width: indicator.width,
              opacity: indicator.visible ? 1 : 0,
              boxShadow: "0 2px 6px rgba(10, 10, 10, 0.45)",
            }}
          />
        </nav>

        {/* Account menu / Sign in — top right */}
        <div className="hidden md:block">
          <AuthButton />
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="inline-flex items-center justify-center rounded-md p-2 text-ink hover:bg-silver-light md:hidden"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <nav className="border-t border-silver bg-primary md:hidden">
          <ul className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`block py-2 text-base font-black ${
                      active
                        ? "text-ink underline decoration-2 underline-offset-4"
                        : "text-silver-deep hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li className="mt-2 border-t border-silver pt-3 pb-1">
              <AuthButton onNavigate={() => setMenuOpen(false)} />
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
