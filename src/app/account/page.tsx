import Link from "next/link";
import { redirect } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import SupabaseNotice from "@/components/auth/SupabaseNotice";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "@/app/auth/actions";
import { getTeam } from "@/data/api";

export default async function AccountPage() {
  if (!isSupabaseConfigured) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-md py-12">
          <h1 className="mb-4 text-2xl font-bold text-ink">Your account</h1>
          <SupabaseNotice />
        </div>
      </PageContainer>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role, favorite_team_id, avatar_url, created_at")
    .eq("id", user.id)
    .single();

  const favoriteTeam = profile?.favorite_team_id
    ? getTeam(profile.favorite_team_id)
    : undefined;
  const isAdmin = profile?.role === "admin";

  return (
    <PageContainer>
      <div className="mx-auto max-w-md py-12">
        <h1 className="mb-6 text-2xl font-bold text-ink">Your account</h1>

        <div className="space-y-3 rounded-lg border border-silver p-5">
          <Row label="Display name" value={profile?.display_name ?? "—"} />
          <Row label="Email" value={user.email ?? "—"} />
          <Row
            label="Role"
            value={
              isAdmin ? (
                <span className="rounded bg-ink px-1.5 py-0.5 text-xs font-bold text-primary">
                  ADMIN
                </span>
              ) : (
                "User"
              )
            }
          />
          <Row
            label="Favorite team"
            value={
              favoriteTeam ? `${favoriteTeam.city} ${favoriteTeam.name}` : "—"
            }
          />
        </div>

        <div className="mt-5 flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-md border border-silver-deep px-4 py-2 text-sm font-bold text-ink hover:bg-silver-light"
            >
              Admin
            </Link>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md bg-ink px-4 py-2 text-sm font-bold text-primary hover:opacity-90"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-silver-deep">{label}</span>
      <span className="text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}
