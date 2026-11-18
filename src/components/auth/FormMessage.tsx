// Inline success / error message above an auth form.
export default function FormMessage({
  tone,
  children,
}: {
  tone: "success" | "error";
  children: React.ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`mb-4 rounded-xl px-3.5 py-2.5 text-sm font-medium ${
        tone === "error" ? "bg-down/10 text-down" : "bg-up/10 text-up"
      }`}
    >
      {children}
    </p>
  );
}
