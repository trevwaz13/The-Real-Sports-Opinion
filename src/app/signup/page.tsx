import Link from "next/link";
import PageContainer from "@/components/PageContainer";
import RsoLogo from "@/components/RsoLogo";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { signInWithGoogle, signup } from "@/app/auth/actions";
import SupabaseNotice from "@/components/auth/SupabaseNotice";
import GoogleButton from "@/components/auth/GoogleButton";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <PageContainer>
      <div className="mx-auto max-w-sm py-12">
        <div className="mb-6 flex justify-center">
          <RsoLogo height={56} />
        </div>
        <h1 className="mb-1 text-center text-2xl font-bold text-ink">
          Create your account
        </h1>
        <p className="mb-6 text-center text-sm text-silver-deep">
          Vote on rankings, build a fantasy team, and more.
        </p>

        {!isSupabaseConfigured ? (
          <SupabaseNotice />
        ) : (
          <>
            {error && (
              <p className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <form action={signInWithGoogle}>
              <GoogleButton label="Sign up with Google" />
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-silver-deep">
              <span className="h-px flex-1 bg-silver" />
              OR
              <span className="h-px flex-1 bg-silver" />
            </div>

            <form action={signup} className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-ink">
                  Display name
                </span>
                <input
                  type="text"
                  name="displayName"
                  required
                  autoComplete="nickname"
                  className="w-full rounded-md border border-silver px-3 py-2 text-sm text-ink outline-none focus:border-silver-deep"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-ink">
                  Email
                </span>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className="w-full rounded-md border border-silver px-3 py-2 text-sm text-ink outline-none focus:border-silver-deep"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-ink">
                  Password
                </span>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-md border border-silver px-3 py-2 text-sm text-ink outline-none focus:border-silver-deep"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-md bg-ink py-2 text-sm font-bold text-primary transition-opacity hover:opacity-90"
              >
                Create account
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-silver-deep">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-ink hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </PageContainer>
  );
}
