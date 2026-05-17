const SPECIMENS = [
  {
    utility: "text-display",
    family: "Funnel Display",
    specs: "3rem / 800 / -0.02em",
    sample: "48pt Display Hero",
  },
  {
    utility: "text-h1",
    family: "Funnel Display",
    specs: "2.25rem / 700 / -0.015em",
    sample: "Page Title Heading",
  },
  {
    utility: "text-h2",
    family: "Funnel Display",
    specs: "1.5rem / 700",
    sample: "Section Title",
  },
  {
    utility: "text-h3",
    family: "Lexend",
    specs: "1.125rem / 600",
    sample: "Card Panel Title",
  },
  {
    utility: "text-body-md",
    family: "Lexend",
    specs: "1rem / 400",
    sample:
      "Default body text for paragraphs and prose. Lexend carries dense content with excellent readability at all sizes.",
  },
  {
    utility: "text-body-sm",
    family: "Lexend",
    specs: "0.875rem / 400",
    sample: "Helper text, table cells, and secondary descriptions.",
  },
  {
    utility: "text-label-caps",
    family: "DM Mono",
    specs: "0.75rem / 500 / +0.12em / uppercase",
    sample: "EYEBROW LABEL · STATUS CHIP · COLUMN HEADER",
  },
  {
    utility: "text-metric",
    family: "DM Mono",
    specs: "1.5rem / 500 / tabular-nums",
    sample: "1,247",
  },
] as const;

export function TypeScaleSpecimens() {
  return (
    <div className="space-y-6">
      <h2 className="text-h2">Type Scale</h2>
      <p className="text-body-sm text-muted-foreground">
        Six-role type system: Funnel Display (display/headings), Lexend (body),
        DM Mono (labels/metrics).
      </p>
      <div className="space-y-4">
        {SPECIMENS.map((s) => (
          <div
            key={s.utility}
            className="border-border bg-card rounded-xl border-2 p-5 shadow-[4px_4px_0_rgba(42,31,26,0.12)]"
          >
            <div className="text-label-caps text-muted-foreground mb-1 text-[0.65rem]">
              {s.utility}
            </div>
            <div className="text-muted-foreground mb-3 font-mono text-xs">
              {s.family} · {s.specs}
            </div>
            <div className={s.utility}>{s.sample}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
