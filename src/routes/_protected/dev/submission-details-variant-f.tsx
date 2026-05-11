import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { SectionHeader } from "@/components/section-header";
import {
  ALL_SCENARIOS,
  type SubmissionDetailsData,
} from "@/components/submissions/details-demo-fixtures";
import { SubmissionDetailsVariantF } from "@/components/submissions/details-variant-f";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute(
  "/_protected/dev/submission-details-variant-f",
)({
  component: SubmissionDetailsVariantFPage,
});

function SubmissionDetailsVariantFPage() {
  const [activeIdx, setActiveIdx] = useState(0);
  const active: SubmissionDetailsData = ALL_SCENARIOS[activeIdx].data;

  return (
    <>
      <SectionHeader as="h1" title="Variant F — Tournament Overview Card" />
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
      <SubmissionDetailsVariantF data={active} />
    </>
  );
}
