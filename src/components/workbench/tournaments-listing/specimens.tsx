import { useState } from "react";

import { SectionHeader } from "@/components/section-header";
import { TournamentListing } from "@/components/tournaments/listing";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

import { SCENARIOS, type ScenarioKey } from "./fixtures";

export function TournamentsListingSpecimens() {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>("full");
  const scenario = SCENARIOS[scenarioKey].data;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        as="h1"
        title="Tournaments listing"
        description="Anchor-lane layout: Your bracket pinned, Discover below with status-filter chips. Swap scenarios to inspect viewer states."
      />

      <div className="border-ink bg-paper-deep flex flex-col gap-3 rounded-xl border-2 p-4 sm:p-5">
        <Eyebrow>Scenario</Eyebrow>
        <div className="flex flex-wrap gap-2">
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

      <div className="border-ink bg-paper overflow-hidden rounded-2xl border-2 p-6 sm:p-8">
        <TournamentListing
          yours={scenario.yours}
          discover={scenario.discover}
        />
      </div>
    </div>
  );
}
