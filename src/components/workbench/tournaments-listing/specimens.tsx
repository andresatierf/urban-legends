import { useState } from "react";

import { SectionHeader } from "@/components/section-header";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

import { SCENARIOS, type ScenarioKey } from "./fixtures";
import {
  VariantAnchorLane,
  VariantHeroSpotlight,
  VariantStatusBands,
} from "./variants";

type VariantKey = "anchor" | "bands" | "hero";

const VARIANTS: { key: VariantKey; label: string; pitch: string }[] = [
  {
    key: "anchor",
    label: "A · Anchor lane",
    pitch:
      "Yours pinned in a paper-deep band at top; Discover below with status-filter chips (counts + show-past toggle). Honors the listWithAuthority partition the backend already returns. Best for veterans juggling multiple tournaments.",
  },
  {
    key: "bands",
    label: "B · Status bands",
    pitch:
      "Broadsheet sections — Now playing, Coming soon, Past — each with a status icon and bold h2. Your tournaments sort first inside every band and wear a 'Yours' tab on the card. Best when status is the primary scan axis.",
  },
  {
    key: "hero",
    label: "C · Hero spotlight",
    pitch:
      "Your active tournament(s) elevated to a hero tile with progress bar, team points, approved/total submissions, and a pending-review CTA. Everything else falls into a compact 'schedule' index below. Best for the captain/reviewer daily check-in.",
  },
];

export function TournamentsListingSpecimens() {
  const [variant, setVariant] = useState<VariantKey>("anchor");
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>("full");
  const active = VARIANTS.find((v) => v.key === variant) ?? VARIANTS[0];
  const scenario = SCENARIOS[scenarioKey].data;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        as="h1"
        title="Tournaments listing"
        description="Three radically different layouts for /tournaments. Same TournamentOverviewCard — partition, chrome, and emphasis are the variables."
      />

      <div className="border-ink bg-paper-deep flex flex-col gap-4 rounded-xl border-2 p-4 sm:p-5">
        <div>
          <Eyebrow>Variant</Eyebrow>
          <div className="mt-2 flex flex-wrap gap-2">
            {VARIANTS.map((v) => {
              const selected = v.key === variant;
              return (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setVariant(v.key)}
                  className={cn(
                    "border-ink rounded-full border-2 px-3 py-1.5 text-sm font-medium transition-colors",
                    selected
                      ? "bg-primary text-primary-foreground shadow-[2px_2px_0_var(--color-shadow)]"
                      : "bg-card text-ink hover:bg-paper",
                  )}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
          <p className="text-muted-foreground text-body-sm mt-3">
            {active.pitch}
          </p>
        </div>

        <div className="border-ink-soft border-t pt-3">
          <Eyebrow>Scenario</Eyebrow>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(SCENARIOS) as ScenarioKey[]).map((key) => {
              const selected = key === scenarioKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setScenarioKey(key)}
                  className={cn(
                    "text-label-caps border-ink-soft rounded-md border px-2.5 py-1 transition-colors",
                    selected
                      ? "bg-ink text-paper border-ink"
                      : "text-muted-foreground bg-card hover:bg-paper",
                  )}
                >
                  {SCENARIOS[key].label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-ink bg-paper overflow-hidden rounded-2xl border-2 p-6 sm:p-8">
        {variant === "anchor" && <VariantAnchorLane {...scenario} />}
        {variant === "bands" && <VariantStatusBands {...scenario} />}
        {variant === "hero" && <VariantHeroSpotlight {...scenario} />}
      </div>
    </div>
  );
}
