import Link from "next/link";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { login, signInWithGoogle } from "@/app/auth/actions";
import AuthShell from "@/components/auth/AuthShell";
import FormField from "@/components/auth/FormField";
import FormMessage from "@/components/auth/FormMessage";
import GoogleButton from "@/components/auth/GoogleButton";
import OrDivider from "@/components/auth/OrDivider";
import SupabaseNotice from "@/components/auth/SupabaseNotice";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const { error, message, next = "/account" } = await searchParams;

  return (
    <AuthShell title="Sign in" subtitle="Welcome back to RSO.">
      {!isSupabaseConfigured ? (
        <SupabaseNotice />
      ) : (
        <>
          {message && <FormMessage tone="success">{message}</FormMessage>}
          {error && <FormMessage tone="error">{error}</FormMessage>}

          <form action={signInWithGoogle}>
            <input type="hidden" name="next" value={next} />
            <GoogleButton label="Continue with Google" />
          </form>

          <OrDivider />

          <form action={login} className="space-y-4">
            <input type="hidden" name="next" value={next} />
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
              autoComplete="current-password"
            />
            <button type="submit" className="btn btn-primary w-full !py-2.5">
              Sign in
            </button>
          </form>

          <p className="mt-6 text-sm text-silver-deep">
            New to RSO?{" "}
            <Link
              href="/signup"
              className="font-medium text-ink underline underline-offset-4 hover:no-underline"
            >
              Create an account
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
