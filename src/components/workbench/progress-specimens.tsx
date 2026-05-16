import { SectionHeader } from "@/components/section-header";
import { Progress } from "@/components/ui/progress";

const VALUES = [0, 15, 40, 65, 85, 100] as const;

const HEIGHTS = [
  { label: "Default (h-1)", className: "" },
  { label: "Medium (h-2)", className: "h-2" },
  { label: "Tall (h-3)", className: "h-3" },
] as const;

export function ProgressSpecimens() {
  return (
    <section className="space-y-10">
      <SectionHeader
        as="h1"
        title="Progress"
        description="The Progress bar primitive across fill values and height overrides."
      />

      {HEIGHTS.map((h) => (
        <div key={h.label} className="space-y-3">
          <h3 className="text-label-caps text-muted-foreground">{h.label}</h3>
          <div className="bg-paper space-y-4 rounded-lg p-6">
            {VALUES.map((v) => (
              <div key={v} className="flex items-center gap-4">
                <span className="text-muted-foreground w-10 font-mono text-xs tabular-nums">
                  {v}%
                </span>
                <Progress value={v} className={h.className} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
