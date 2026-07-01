import Link from "next/link";
import { redirect } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import SupabaseNotice from "@/components/auth/SupabaseNotice";
import AdminEditor from "@/components/admin/AdminEditor";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { createClient } from "@/utils/supabase/server";

export default async function AdminPage() {
  if (!isSupabaseConfigured) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-md py-12">
          <h1 className="mb-4 text-2xl font-bold text-ink">Admin</h1>
          <SupabaseNotice />
        </div>
      </PageContainer>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return (
      <PageContainer>
        <div className="mx-auto max-w-md py-16 text-center">
          <h1 className="mb-2 text-2xl font-bold text-ink">Admins only</h1>
          <p className="text-silver-deep">
            This area is for the RSO editor. Seed your account as admin in
            Supabase to access it.
          </p>
          <Link
            href="/account"
            className="mt-4 inline-flex rounded-md border border-silver-deep px-4 py-2 text-sm font-bold text-ink hover:bg-silver-light"
          >
            Back to account
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="pb-12">
      <div className="py-8">
        <h1 className="mb-1 text-3xl font-bold text-ink">Admin</h1>
        <p className="mb-6 text-sm text-silver-deep">
          Build the Media player rankings and the Media power ranking from a
          blank sheet — add from the pool, then drag to order and save.
        </p>
        <AdminEditor />
      </div>
    </PageContainer>
  );
}
