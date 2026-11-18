import Link from "next/link";
import { redirect } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import PageHeading from "@/components/PageHeading";
import SupabaseNotice from "@/components/auth/SupabaseNotice";
import AdminEditor from "@/components/admin/AdminEditor";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { createClient } from "@/utils/supabase/server";

export default async function AdminPage() {
  if (!isSupabaseConfigured) {
    return (
      <PageContainer>
        <PageHeading title="Admin" />
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
  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return (
      <PageContainer>
        <PageHeading title="Admins only" />
        <div className="max-w-xl">
          <p className="text-silver-deep">
            This area is for the RSO editor. Seed your account as admin in
            Supabase to access it.
          </p>
          <Link href="/account" className="btn btn-outline mt-5">
            Back to account
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeading title="Admin">
        Build the Media player rankings and the Media power ranking from a blank
        sheet. Add from the pool, then drag to order and save.
      </PageHeading>
      <AdminEditor />
    </PageContainer>
  );
}
