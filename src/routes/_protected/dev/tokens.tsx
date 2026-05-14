import { createFileRoute } from "@tanstack/react-router";

import { TypeScaleSpecimens } from "@/components/type-scale-specimens";
import { Eyebrow } from "@/components/ui/eyebrow";
import { TokenWorkbench } from "@/components/workbench/tokens";

export const Route = createFileRoute("/_protected/dev/tokens")({
  component: TokenWorkbenchPage,
});

const EYEBROW_COLORS = [
  { color: "mute", label: "Default (mute)" },
  { color: "sunset", label: "Sunset" },
  { color: "grass", label: "Grass" },
  { color: "sky", label: "Sky" },
  { color: "plum", label: "Plum" },
  { color: "gold", label: "Gold" },
] as const;

function EyebrowSpecimens() {
  return (
    <div className="space-y-6">
      <h2 className="text-h2">Eyebrow Primitive</h2>
      <p className="text-body-sm text-muted-foreground">
        Label-caps eyebrow for section headers, metric tiles, and card titles.
        DM Mono uppercase with +12% tracking.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {EYEBROW_COLORS.map(({ color, label }) => (
          <div
            key={color}
            className="border-border bg-card space-y-2 rounded-xl border-2 p-5 shadow-[4px_4px_0_rgba(42,31,26,0.12)]"
          >
            <Eyebrow color={color}>SAMPLE EYEBROW</Eyebrow>
            <div className="text-body-sm text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
      <div className="border-border bg-card space-y-1 rounded-xl border-2 p-5 shadow-[4px_4px_0_rgba(42,31,26,0.12)]">
        <Eyebrow className="block">WEEKLY STANDINGS</Eyebrow>
        <div className="text-h1">Tournament Title</div>
        <p className="text-body-md text-muted-foreground">
          Eyebrow above a heading — the editorial pattern used by SectionHeader.
        </p>
      </div>
    </div>
  );
}

function TokenWorkbenchPage() {
  return (
    <div className="space-y-12">
      <TokenWorkbench />
      <TypeScaleSpecimens />
      <EyebrowSpecimens />
    </div>
  );
}
