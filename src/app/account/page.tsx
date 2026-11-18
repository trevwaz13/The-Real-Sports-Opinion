import Link from "next/link";
import { redirect } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import PageHeading from "@/components/PageHeading";
import SupabaseNotice from "@/components/auth/SupabaseNotice";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "@/app/auth/actions";
import { getTeam } from "@/data/api";

export default async function AccountPage() {
  if (!isSupabaseConfigured) {
    return (
      <PageContainer>
        <PageHeading title="Your account" />
        <div className="max-w-xl">
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
      <PageHeading title="Your account" />
      <div className="max-w-xl">
        <div className="panel divide-y divide-silver/70">
          <Row label="Display name" value={profile?.display_name ?? "-"} />
          <Row label="Email" value={user.email ?? "-"} />
          <Row
            label="Role"
            value={
              isAdmin ? (
                <span className="tag bg-ink text-primary">ADMIN</span>
              ) : (
                "User"
              )
            }
          />
          <Row
            label="Favorite team"
            value={
              favoriteTeam ? `${favoriteTeam.city} ${favoriteTeam.name}` : "-"
            }
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          {isAdmin && (
            <Link href="/admin" className="btn btn-outline">
              Admin
            </Link>
          )}
          <form action={signOut}>
            <button type="submit" className="btn btn-primary">
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
    <div className="flex items-center justify-between gap-3 px-5 py-3.5">
      <span className="text-sm text-silver-deep">{label}</span>
      <span className="text-sm font-medium text-ink">{value}</span>
    </div>
  );
}
