import { useState } from "react";

import type { PrototypeViewMode } from "@/components/dashboard/_prototype-205/mock";
import {
  DashboardPrototypePage,
  VIEW_MODES,
} from "@/components/dashboard/_prototype-205/page";
import { SectionHeader } from "@/components/section-header";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

export function DashboardV2Specimens() {
  const [mode, setMode] = useState<PrototypeViewMode>(VIEW_MODES[0].mode);
  const active = VIEW_MODES.find((v) => v.mode === mode) ?? VIEW_MODES[0];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        as="h1"
        title="Dashboard v2"
        description="Prototype of the rescoped /dashboard — single tournament, team-status + comparison, role-adaptive. Toggle a view mode to walk the state space."
      />

      <div className="border-ink bg-paper-deep flex flex-col gap-3 rounded-xl border-2 p-4 sm:p-5">
        <Eyebrow>View mode</Eyebrow>
        <div className="flex flex-wrap gap-2">
          {VIEW_MODES.map((v) => {
            const selected = v.mode === mode;
            return (
              <button
                key={v.mode}
                type="button"
                onClick={() => setMode(v.mode)}
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
        <p className="text-mute text-body-sm">{active.description}</p>
      </div>

      <div className="border-ink bg-paper overflow-hidden rounded-2xl border-2">
        <DashboardPrototypePage key={mode} mode={mode} />
      </div>
    </div>
  );
}
