import type { Metadata } from "next";
import PageContainer from "@/components/PageContainer";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = { title: "Settings — RSO" };

export default function SettingsPage() {
  return (
    <PageContainer className="pb-12">
      <section className="py-8">
        <h1 className="mb-6 text-3xl font-bold text-ink">Settings</h1>

        <div className="rounded-lg border border-silver p-5">
          <h2 className="text-lg font-bold text-ink">Appearance</h2>
          <p className="mb-4 mt-1 text-sm text-silver-deep">
            Choose a theme. &ldquo;System&rdquo; follows your device&rsquo;s
            light or dark setting.
          </p>
          <ThemeToggle />
        </div>
      </section>
    </PageContainer>
  );
}
