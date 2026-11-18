import PageContainer from "./PageContainer";

// Temporary scaffold for routes whose real content lands in a later phase.
export default function PagePlaceholder({
  title,
  note,
}: {
  title: string;
  note?: string;
}) {
  return (
    <PageContainer>
      <section className="flex min-h-[60vh] flex-col justify-center gap-4 py-16">
        <span className="tag w-fit border border-silver bg-surface text-silver-deep">
          Coming soon
        </span>
        <h1 className="font-display text-5xl leading-tight text-ink sm:text-7xl">
          {title}
        </h1>
        <p className="max-w-md text-lg text-silver-deep">
          {note ?? "This page is on the way."}
        </p>
      </section>
    </PageContainer>
  );
}
