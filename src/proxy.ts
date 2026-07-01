import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { updateSession } from "@/utils/supabase/middleware";

// Next 16 renamed the `middleware` convention to `proxy`.
export async function proxy(request: NextRequest) {
  // Until Supabase is wired up, do nothing — the whole site runs on mock data.
  if (!isSupabaseConfigured) return NextResponse.next();
  return updateSession(request);
}

export const config = {
  matcher: [
    // Run on everything except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
