// Shown on auth surfaces until a real Supabase project is wired up.
export default function SupabaseNotice() {
  return (
    <div className="rounded-2xl border border-silver bg-silver-light/60 p-5 text-sm text-silver-deep">
      <p className="font-semibold text-ink">Accounts aren’t connected yet.</p>
      <p className="mt-2">
        Sign-in, fan voting, and fantasy teams turn on once a Supabase project is
        configured. Add your project URL and publishable key to{" "}
        <code className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-xs text-ink">.env.local</code>{" "}
        and run the SQL in{" "}
        <code className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-xs text-ink">
          supabase/schema.sql
        </code>
        .
      </p>
      <p className="mt-2">
        See <code className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-xs text-ink">docs/SUPABASE_SETUP.md</code>{" "}
        for the full steps. Everything else on the site works on mock data in the
        meantime.
      </p>
    </div>
  );
}
