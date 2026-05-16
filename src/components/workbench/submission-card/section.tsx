import { SectionHeader } from "@/components/section-header";
import { CarouselReviewCard } from "@/components/submissions/review/submission-review-card-carousel";
import { MosaicReviewCard } from "@/components/submissions/review/submission-review-card-mosaic";
import type { SubmissionReviewCardProps } from "@/components/submissions/review/submission-review-card-shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { VariantMatrix } from "../shells/variant-matrix";
import {
  EVIDENCE_COUNTS,
  SUBMISSION_STATES,
  SUBMISSION_TIERS,
  SUBMISSION_TYPES,
  type SubmissionTier,
  type SubmissionType,
  getSubmissionDemoItem,
} from "./fixtures";

const VARIANTS = [
  {
    id: "mosaic",
    label: "Mosaic",
    title: "Mosaic — Landscape lead, mosaic groups, footer actions",
    Component: MosaicReviewCard,
  },
  {
    id: "carousel",
    label: "Carousel",
    title: "Carousel — Portrait lead, submitter strip groups, split footer",
    Component: CarouselReviewCard,
  },
] as const;

const TYPE_LABEL: Record<SubmissionType, string> = {
  individual: "Individual",
  group: "Team activity",
};

const TIER_LABEL: Record<SubmissionTier, string> = {
  base: "Base tier",
  advanced: "Advanced tier",
};

export function SubmissionSection() {
  return (
    <section>
      <SectionHeader
        as="h1"
        title="Submission"
        description="The two evidence-led review card variants used by /submissions, across the full state × evidence-count × tier × type matrix."
      />

      <Tabs defaultValue={VARIANTS[0].id} className="mt-6">
        <TabsList>
          {VARIANTS.map(({ id, label }) => (
            <TabsTrigger key={id} value={id}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {VARIANTS.map(({ id, title, Component }) => (
          <TabsContent key={id} value={id}>
            <VariantBlock title={title} Component={Component} />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}

function VariantBlock({
  title,
  Component,
}: {
  title: string;
  Component: (props: SubmissionReviewCardProps) => React.JSX.Element;
}) {
  const noop = async () => {};
  return (
    <div className="mt-8 space-y-10">
      <SectionHeader as="h2" title={title} />

      {SUBMISSION_TYPES.flatMap((type) =>
        SUBMISSION_TIERS.map((tier) => (
          <div key={`${type}-${tier}`}>
            <h3 className="text-muted-foreground mb-3 text-sm font-medium">
              {TYPE_LABEL[type]} · {TIER_LABEL[tier]}
            </h3>
            <VariantMatrix
              variants={SUBMISSION_STATES}
              columns={EVIDENCE_COUNTS}
              columnLabel={(c) => (type === "group" ? `${c} sub.` : `${c} ev.`)}
              renderCell={(state, count) => {
                const item = getSubmissionDemoItem(type, tier, state, count);
                if (!item) return null;
                return (
                  <Component item={item} onApprove={noop} onReject={noop} />
                );
              }}
            />
          </div>
        )),
      )}
    </div>
  );
}
