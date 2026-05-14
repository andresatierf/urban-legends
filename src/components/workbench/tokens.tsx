const PALETTE_TOKENS = [
  { name: "paper", var: "--paper", desc: "Page background" },
  { name: "paper-deep", var: "--paper-deep", desc: "Inset surfaces, sidebar" },
  { name: "card", var: "--card", desc: "Card / modal fill" },
  { name: "ink", var: "--ink", desc: "Headlines, borders, body text" },
  { name: "mute", var: "--mute", desc: "Captions, secondary text" },
  { name: "sunset", var: "--sunset", desc: "Primary CTA, focus ring" },
  { name: "grass", var: "--grass", desc: "Success, approved" },
  { name: "sky", var: "--sky", desc: "Info, joined" },
  { name: "plum", var: "--plum", desc: "Social, invitation" },
  { name: "gold", var: "--gold", desc: "Celebration, pending" },
  { name: "silver", var: "--silver", desc: "Podium 2nd" },
  { name: "bronze", var: "--bronze", desc: "Podium 3rd" },
  { name: "crimson", var: "--crimson", desc: "Destructive, error" },
] as const;

const SEMANTIC_MAP = [
  { semantic: "background", palette: "paper" },
  { semantic: "foreground", palette: "ink" },
  { semantic: "primary", palette: "sunset" },
  { semantic: "primary-foreground", palette: "ink" },
  { semantic: "secondary", palette: "paper-deep" },
  { semantic: "muted", palette: "paper-deep" },
  { semantic: "muted-foreground", palette: "mute" },
  { semantic: "destructive", palette: "crimson" },
  { semantic: "destructive-foreground", palette: "paper" },
  { semantic: "border", palette: "ink" },
  { semantic: "ring", palette: "sunset" },
  { semantic: "success", palette: "grass" },
  { semantic: "warning", palette: "gold" },
  { semantic: "info", palette: "sky" },
  { semantic: "social", palette: "plum" },
] as const;

const RADIUS_SCALE = [
  { name: "sm", value: "6px" },
  { name: "md", value: "10px" },
  { name: "lg", value: "12px" },
  { name: "xl", value: "14px" },
  { name: "2xl", value: "20px" },
] as const;

const SPACING_SCALE = [
  { name: "xs", value: "4px" },
  { name: "sm", value: "8px" },
  { name: "md", value: "16px" },
  { name: "lg", value: "24px" },
  { name: "xl", value: "32px" },
  { name: "2xl", value: "48px" },
] as const;

function Swatch({
  name,
  cssVar,
  desc,
}: {
  name: string;
  cssVar: string;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="border-ink size-12 shrink-0 rounded-lg border-2 shadow-[3px_3px_0_var(--shadow)]"
        style={{ backgroundColor: `var(${cssVar})` }}
      />
      <div className="min-w-0">
        <div className="font-fd-display text-sm font-bold">{name}</div>
        <div className="text-mute font-mono text-xs">{cssVar}</div>
        <div className="text-mute text-xs">{desc}</div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-fd-display mt-8 mb-4 text-xl font-bold first:mt-0">
      {children}
    </h2>
  );
}

export function TokenWorkbench() {
  return (
    <div className="space-y-8">
      <section>
        <SectionTitle>Palette</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PALETTE_TOKENS.map((t) => (
            <Swatch key={t.name} name={t.name} cssVar={t.var} desc={t.desc} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Semantic Mapping</SectionTitle>
        <div className="border-ink bg-card overflow-x-auto rounded-xl border-2 shadow-[4px_4px_0_var(--shadow)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-ink bg-paper-deep text-mute border-b-2 font-mono text-xs tracking-widest uppercase">
                <th className="px-4 py-2 text-left">Semantic</th>
                <th className="px-4 py-2 text-left">→ Palette</th>
                <th className="px-4 py-2 text-left">Preview</th>
              </tr>
            </thead>
            <tbody>
              {SEMANTIC_MAP.map((row) => (
                <tr key={row.semantic} className="border-ink/10 border-b">
                  <td className="px-4 py-2 font-mono text-xs">{`--${row.semantic}`}</td>
                  <td className="text-mute px-4 py-2 font-mono text-xs">
                    {row.palette}
                  </td>
                  <td className="px-4 py-2">
                    <div
                      className="border-ink/20 size-6 rounded border"
                      style={{ backgroundColor: `var(--${row.palette})` }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <SectionTitle>Radius Scale</SectionTitle>
        <div className="flex flex-wrap items-end gap-6">
          {RADIUS_SCALE.map((r) => (
            <div key={r.name} className="flex flex-col items-center gap-2">
              <div
                className="border-ink bg-card size-16 border-2 shadow-[3px_3px_0_var(--shadow)]"
                style={{ borderRadius: r.value }}
              />
              <div className="text-center">
                <div className="font-mono text-xs font-semibold">{r.name}</div>
                <div className="text-mute text-xs">{r.value}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Spacing Scale</SectionTitle>
        <div className="flex flex-col gap-3">
          {SPACING_SCALE.map((s) => (
            <div key={s.name} className="flex items-center gap-3">
              <div className="w-12 font-mono text-xs font-semibold">
                {s.name}
              </div>
              <div
                className="bg-sunset h-4 rounded-sm"
                style={{ width: s.value }}
              />
              <div className="text-mute text-xs">{s.value}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
