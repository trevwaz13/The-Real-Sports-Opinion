"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { Menu, Settings, X } from "lucide-react";
import RsoLogo from "./RsoLogo";
import AuthButton from "./AuthButton";
import { NAV_ITEMS, isActive } from "@/lib/nav";

type Indicator = { left: number; width: number; visible: boolean };

export default function Header() {
  const pathname = usePathname();
  const navRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState<Indicator>({
    left: 0,
    width: 0,
    visible: false,
  });
  const [menuOpen, setMenuOpen] = useState(false);

  const activeHref =
    NAV_ITEMS.find((item) => isActive(pathname, item.href))?.href ?? null;

  // Slide the ink underline (with its soft shadow) beneath the active item.
  useLayoutEffect(() => {
    function update() {
      const nav = navRef.current;
      const el = activeHref ? itemRefs.current[activeHref] : null;
      if (nav && el) {
        const navRect = nav.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const INSET = 12;
        setIndicator({
          left: elRect.left - navRect.left + INSET,
          width: Math.max(0, elRect.width - INSET * 2),
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
    <header className="sticky top-0 z-50 border-b border-silver bg-primary/85 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="RSO home" className="shrink-0">
          <RsoLogo height={30} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden self-stretch md:flex">
          <ul ref={navRef} className="relative flex items-stretch">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href} className="flex">
                  <Link
                    href={item.href}
                    ref={(el) => {
                      itemRefs.current[item.href] = el;
                    }}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center px-3 text-sm font-medium transition-colors lg:px-4 ${
                      active ? "text-ink" : "text-silver-deep hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-px h-0.5 rounded-full bg-ink shadow-[var(--rso-underline-shadow)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                left: indicator.left,
                width: indicator.width,
                opacity: indicator.visible ? 1 : 0,
              }}
            />
          </ul>
        </nav>

        {/* Settings + account menu / Sign in */}
        <div className="hidden items-center gap-1.5 md:flex">
          <Link
            href="/settings"
            aria-label="Settings"
            aria-current={isActive(pathname, "/settings") ? "page" : undefined}
            className={`grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-silver-light hover:text-ink ${
              isActive(pathname, "/settings") ? "bg-silver-light text-ink" : "text-silver-deep"
            }`}
          >
            <Settings size={18} />
          </Link>
          <AuthButton />
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-silver-light md:hidden"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="border-t border-silver bg-primary md:hidden">
          <ul className="mx-auto max-w-[1240px] px-4 py-2 sm:px-6">
            {[...NAV_ITEMS, { label: "Settings", href: "/settings" }].map(
              (item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center justify-between border-b border-silver py-3 text-base font-medium ${
                        active ? "text-ink" : "text-silver-deep"
                      }`}
                    >
                      {item.label}
                      {active && (
                        <span
                          aria-hidden
                          className="h-0.5 w-6 rounded-full bg-ink shadow-[var(--rso-underline-shadow)]"
                        />
                      )}
                    </Link>
                  </li>
                );
              },
            )}
            <li className="pb-2 pt-4">
              <AuthButton onNavigate={() => setMenuOpen(false)} />
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
