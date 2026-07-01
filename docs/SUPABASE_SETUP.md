# Supabase setup (Phase 2.5)

The auth + accounts code is fully scaffolded and **degrades gracefully** — until
you complete these steps, the app runs entirely on mock data and the auth pages
show a friendly "not connected yet" notice. Nothing breaks.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Once it's ready, open **Project Settings → API Keys**.
3. Copy the **Project URL** and the **publishable** key (starts with
   `sb_publishable_…`) and the **secret** key (`sb_secret_…`). Use the *new*
   publishable/secret keys, not the legacy anon/service_role keys.

## 2. Wire the keys

Edit `.env.local` (already gitignored) and replace the placeholders:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

Restart `npm run dev`. The header will now show real auth, and `/login`,
`/signup`, `/account`, and `/admin` go live.

## 3. Create the database

In the Supabase dashboard → **SQL Editor**, paste and run the contents of
[`supabase/schema.sql`](../supabase/schema.sql). This creates every table with
Row Level Security, the auto-create-profile trigger, and the fan-ranking
aggregate function.

## 4. Enable email + Google auth

- **Email/password** works out of the box. (For local testing you may want to
  turn off "Confirm email" under **Authentication → Providers → Email**.)
- **Google**: **Authentication → Providers → Google** → enable, and paste a
  Google OAuth client ID/secret from the
  [Google Cloud console](https://console.cloud.google.com/apis/credentials).
  Add `https://YOUR-REF.supabase.co/auth/v1/callback` as an authorized redirect
  URI there.
- Under **Authentication → URL Configuration**, set the Site URL to
  `http://localhost:3000` (and your deployed URL later).

## 5. Make yourself an admin

Sign up once through `/signup`, then in the SQL editor:

```sql
update public.profiles set role = 'admin'
where id = '<your-auth-user-id>';   -- find it in Authentication → Users
```

Reload `/admin` — the Media ranking + power ranking editor is now available.

## What's wired vs. pending

- **Wired now:** SSR clients, middleware (token refresh + route protection via
  `getClaims()`), email/Google sign-in/up, account menu, profile page, sign-out,
  the `/admin` gate, and the Media rankings/power-rankings editor (writes to
  Supabase).
- **Reads still on mock:** the displayed Media/Fan rankings on `/rankings` and
  the home boxes still come from the mock layer. Pointing them at the Supabase
  `media_rankings` / `fan_ranking()` data is a follow-up wiring step (the schema
  + admin writes are ready for it). Fan voting UI is Phase 4b.
