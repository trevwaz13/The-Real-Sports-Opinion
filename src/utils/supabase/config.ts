// Single source of truth for whether Supabase is wired up. Until the real
// project URL + publishable key are in .env.local (replacing the placeholders),
// `isSupabaseConfigured` is false and every auth surface degrades gracefully.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 &&
  SUPABASE_PUBLISHABLE_KEY.length > 0 &&
  !SUPABASE_URL.includes("your-project-ref") &&
  !SUPABASE_PUBLISHABLE_KEY.includes("your_publishable_key");
