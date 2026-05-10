import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { SectionHeader } from "@/components/section-header";
import {
  ALL_SCENARIOS,
  type SubmissionDetailsData,
} from "@/components/submissions/details-demo-fixtures";
import { SubmissionDetailsVariantB } from "@/components/submissions/details-variant-b";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute(
  "/_protected/dev/submission-details-variant-b",
)({
  component: SubmissionDetailsVariantBPage,
});

function SubmissionDetailsVariantBPage() {
  const [activeIdx, setActiveIdx] = useState(0);
  const active: SubmissionDetailsData = ALL_SCENARIOS[activeIdx].data;

  return (
    <>
      <SectionHeader as="h1" title="Variant B — Magazine Hero + Tabs" />
      <div className="mb-6 flex flex-wrap gap-2">
        {ALL_SCENARIOS.map((s, i) => (
          <Button
            key={s.label}
            variant={i === activeIdx ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveIdx(i)}
          >
            {s.label}
          </Button>
        ))}
      </div>
      <SubmissionDetailsVariantB data={active} />
    </>
  );
}
