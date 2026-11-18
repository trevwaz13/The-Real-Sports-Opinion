// Labeled text input for the auth forms. Label sits above the field.
export default function FormField({
  label,
  ...input
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <input {...input} className="field w-full px-3 py-2.5" />
    </label>
  );
}
