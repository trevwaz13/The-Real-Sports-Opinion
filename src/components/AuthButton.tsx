"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { ChevronDown, UserRound } from "lucide-react";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { createClient } from "@/utils/supabase/client";
import { signOut } from "@/app/auth/actions";

export default function AuthButton({ onNavigate }: { onNavigate?: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!isSupabaseConfigured);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const signInLink = (
    <Link
      href="/login"
      onClick={onNavigate}
      className="inline-flex rounded-md border border-silver-deep px-4 py-1.5 text-[15px] font-bold text-ink transition-colors hover:bg-silver-light"
    >
      Sign in
    </Link>
  );

  // Before we know, and whenever signed out, show the sign-in button.
  if (!ready || !user) return signInLink;

  const name =
    (user.user_metadata?.display_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Account";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-md border border-silver-deep px-3 py-1.5 text-[15px] font-bold text-ink transition-colors hover:bg-silver-light"
      >
        <UserRound size={16} />
        <span className="max-w-[8rem] truncate">{name}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-md border border-silver bg-surface shadow-lg">
          <Link
            href="/account"
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
            className="block px-4 py-2 text-sm font-semibold text-ink hover:bg-silver-light"
          >
            Your account
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="block w-full border-t border-silver px-4 py-2 text-left text-sm font-semibold text-ink hover:bg-silver-light"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
