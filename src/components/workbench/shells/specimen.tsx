export function Specimen({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-muted-foreground text-label-caps">{label}</h3>
        {description && (
          <p className="text-body-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="bg-paper rounded-lg p-6">{children}</div>
    </div>
  );
}
