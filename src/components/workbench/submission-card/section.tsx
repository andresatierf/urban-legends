import { SectionHeader } from "@/components/section-header";
import { CarouselReviewCard } from "@/components/submissions/review/submission-review-card-carousel";
import { MosaicReviewCard } from "@/components/submissions/review/submission-review-card-mosaic";
import type { SubmissionReviewCardProps } from "@/components/submissions/review/submission-review-card-shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { VariantMatrix } from "../shells/variant-matrix";
import {
  SUBMISSION_STATES,
  SUBMISSION_TYPES,
  type SubmissionTier,
  type SubmissionType,
  getSubmissionDemoItem,
} from "./fixtures";

const TIER_EVIDENCE_COLUMNS = [
  { tier: "base", count: "1" },
  { tier: "base", count: "2" },
  { tier: "advanced", count: "1" },
  { tier: "advanced", count: "2" },
] as const satisfies ReadonlyArray<{
  tier: SubmissionTier;
  count: "1" | "2";
}>;

type TierEvidenceColumn = (typeof TIER_EVIDENCE_COLUMNS)[number];
type TierEvidenceColumnId =
  `${TierEvidenceColumn["tier"]}-${TierEvidenceColumn["count"]}`;

const COLUMN_IDS = TIER_EVIDENCE_COLUMNS.map(
  ({ tier, count }) => `${tier}-${count}` as TierEvidenceColumnId,
);

function parseColumnId(id: TierEvidenceColumnId): TierEvidenceColumn {
  const [tier, count] = id.split("-") as [
    TierEvidenceColumn["tier"],
    TierEvidenceColumn["count"],
  ];
  return { tier, count };
}

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

      {SUBMISSION_TYPES.map((type) => (
        <div key={type}>
          <h3 className="text-muted-foreground mb-3 text-sm font-medium">
            {TYPE_LABEL[type]}
          </h3>
          <VariantMatrix
            variants={SUBMISSION_STATES}
            columns={COLUMN_IDS}
            columnLabel={(id) => {
              const { tier, count } = parseColumnId(id);
              const unit = type === "group" ? "sub." : "ev.";
              return `${TIER_LABEL[tier]} · ${count} ${unit}`;
            }}
            renderCell={(state, id) => {
              const { tier, count } = parseColumnId(id);
              const item = getSubmissionDemoItem(type, tier, state, count);
              if (!item) return null;
              return <Component item={item} onApprove={noop} onReject={noop} />;
            }}
          />
        </div>
      ))}
    </div>
  );
}
