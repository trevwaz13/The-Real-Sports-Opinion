import type { Metadata } from "next";
import PageContainer from "@/components/PageContainer";
import PageHeading from "@/components/PageHeading";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = { title: "Settings | RSO" };

export default function SettingsPage() {
  return (
    <PageContainer>
      <PageHeading title="Settings" />
      <section className="panel flex max-w-2xl flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="font-semibold text-ink">Appearance</h2>
          <p className="mt-0.5 text-sm text-silver-deep">
            System follows your device&rsquo;s light or dark setting.
          </p>
        </div>
        <ThemeToggle />
      </section>
    </PageContainer>
  );
}
