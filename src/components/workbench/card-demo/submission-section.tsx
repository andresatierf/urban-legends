import { SectionHeader } from "@/components/section-header";
import { CarouselReviewCard } from "@/components/submissions/review/submission-review-card-carousel";
import { MosaicReviewCard } from "@/components/submissions/review/submission-review-card-mosaic";
import type { SubmissionReviewCardProps } from "@/components/submissions/review/submission-review-card-shared";

import { DEMO_GROUP_ITEMS, DEMO_INDIVIDUAL_ITEMS } from "./submission-fixtures";

const VARIANTS = [
  {
    id: "mosaic",
    title: "Mosaic — Landscape lead, mosaic groups, footer actions",
    Component: MosaicReviewCard,
  },
  {
    id: "carousel",
    title: "Carousel — Portrait lead, submitter strip groups, split footer",
    Component: CarouselReviewCard,
  },
] as const;

export function SubmissionSection() {
  return (
    <section>
      <SectionHeader
        as="h1"
        title="Submission"
        description="The two evidence-led review card variants used by /submissions. Each renders the same 20-card state matrix (individual + group × four states × evidence-count variability)."
      />

      {VARIANTS.map(({ id, title, Component }) => (
        <VariantBlock key={id} title={title} Component={Component} />
      ))}
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
    <div className="mt-8">
      <SectionHeader as="h2" title={title} />

      <div className="mt-4">
        <h3 className="text-muted-foreground mb-3 text-sm font-medium">
          Individual submissions (1–5 evidence images)
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {DEMO_INDIVIDUAL_ITEMS.map((item) => (
            <Component
              key={item.data.submission._id}
              item={item}
              onApprove={noop}
              onReject={noop}
            />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-muted-foreground mb-3 text-sm font-medium">
          Team activity (1–5 submitters)
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {DEMO_GROUP_ITEMS.map((item) => (
            <Component
              key={item.data.group._id}
              item={item}
              onApprove={noop}
              onReject={noop}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
