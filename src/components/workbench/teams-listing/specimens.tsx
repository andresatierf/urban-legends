import { useState } from "react";

import { SectionHeader } from "@/components/section-header";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

import {
  SCENARIO_ALL_TEAMS,
  SCENARIO_TOURNAMENT_MAP,
  SCENARIO_USER_ID,
  SCENARIO_USER_TEAMS,
} from "./fixtures";
import {
  VariantAnchorLane,
  VariantStandingsLens,
  VariantTournamentSections,
} from "./variants";

type VariantKey = "anchor" | "sections" | "standings";

const VARIANTS: {
  key: VariantKey;
  label: string;
  pitch: string;
}[] = [
  {
    key: "anchor",
    label: "A · Anchor lane",
    pitch:
      "Your teams pinned at the top inside a paper-deep band. Browse-all sits below with the tournament switcher. Separates 'mine' from 'rest' so the user never scans past their roster.",
  },
  {
    key: "sections",
    label: "B · Tournament sections",
    pitch:
      "Broadsheet grouping: each tournament gets a section with status eyebrow, count, and a 'View tournament' link. Drops the switcher in favour of vertical scanning. Reads like a sports section.",
  },
  {
    key: "standings",
    label: "C · Standings lens",
    pitch:
      "Adds a Standings/Cards toggle. Standings view is a Field Day table — rank, captain, members, points — with the viewer's team highlighted in sky. Better for tournaments with 10+ teams.",
  },
];

export function TeamsListingSpecimens() {
  const [variant, setVariant] = useState<VariantKey>("anchor");
  const active = VARIANTS.find((v) => v.key === variant) ?? VARIANTS[0];

  const props = {
    userTeams: SCENARIO_USER_TEAMS,
    allTeams: SCENARIO_ALL_TEAMS,
    tournamentMap: SCENARIO_TOURNAMENT_MAP,
    currentUserId: SCENARIO_USER_ID,
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        as="h1"
        title="Teams listing"
        description="Three radically different layouts for /teams. Same data, same TeamCard — chrome and grouping are the variables."
      />

      <div className="border-ink bg-paper-deep flex flex-col gap-3 rounded-xl border-2 p-4 sm:p-5">
        <Eyebrow>Variant</Eyebrow>
        <div className="flex flex-wrap gap-2">
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
        <p className="text-mute text-body-sm">{active.pitch}</p>
      </div>

      <div className="border-ink bg-paper overflow-hidden rounded-2xl border-2 p-6 sm:p-8">
        {variant === "anchor" && <VariantAnchorLane {...props} />}
        {variant === "sections" && <VariantTournamentSections {...props} />}
        {variant === "standings" && <VariantStandingsLens {...props} />}
      </div>
    </div>
  );
}
