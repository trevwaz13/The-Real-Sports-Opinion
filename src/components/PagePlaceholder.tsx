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
      <section className="flex min-h-[60vh] flex-col items-center justify-center gap-3 py-16 text-center">
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">{title}</h1>
        <p className="max-w-md text-silver-deep">
          {note ?? "Coming soon."}
        </p>
      </section>
    </PageContainer>
  );
}
