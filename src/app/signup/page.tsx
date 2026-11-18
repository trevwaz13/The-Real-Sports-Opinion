import Link from "next/link";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { signInWithGoogle, signup } from "@/app/auth/actions";
import AuthShell from "@/components/auth/AuthShell";
import FormField from "@/components/auth/FormField";
import FormMessage from "@/components/auth/FormMessage";
import GoogleButton from "@/components/auth/GoogleButton";
import OrDivider from "@/components/auth/OrDivider";
import SupabaseNotice from "@/components/auth/SupabaseNotice";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthShell
      title="Create your account"
      subtitle="Vote on rankings, build a fantasy team, and more."
    >
      {!isSupabaseConfigured ? (
        <SupabaseNotice />
      ) : (
        <>
          {error && <FormMessage tone="error">{error}</FormMessage>}

          <form action={signInWithGoogle}>
            <GoogleButton label="Sign up with Google" />
          </form>

          <OrDivider />

          <form action={signup} className="space-y-4">
            <FormField
              label="Display name"
              type="text"
              name="displayName"
              required
              autoComplete="nickname"
            />
            <FormField
              label="Email"
              type="email"
              name="email"
              required
              autoComplete="email"
            />
            <FormField
              label="Password"
              type="password"
              name="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <button type="submit" className="btn btn-primary w-full !py-2.5">
              Create account
            </button>
          </form>

          <p className="mt-6 text-sm text-silver-deep">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-ink underline underline-offset-4 hover:no-underline"
            >
              Sign in
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
