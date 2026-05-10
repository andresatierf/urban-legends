import { SectionHeader } from "./section-header";
import {
  DEMO_GROUP_ITEMS,
  DEMO_INDIVIDUAL_ITEMS,
} from "./submission-card-demo-fixtures";
import { CarouselReviewCard } from "./submissions/review/submission-review-card-carousel";
import { MosaicReviewCard } from "./submissions/review/submission-review-card-mosaic";
import type { SubmissionReviewCardProps } from "./submissions/review/submission-review-card-shared";
import type { TeamDemoItem } from "./team-card-demo-fixtures";
import { DEMO_TEAM_ITEMS } from "./team-card-demo-fixtures";
import { TeamCardVariantA } from "./teams/team-card-variant-a";
import { TeamCardVariantB } from "./teams/team-card-variant-b";
import { TeamCardVariantC } from "./teams/team-card-variant-c";
import { DEMO_TOURNAMENT_ITEMS } from "./tournament-card-demo-fixtures";
import { TournamentOverviewCard } from "./tournaments/tournament-overview-card";

const TEAM_VARIANTS = [
  {
    id: "a",
    title: "A — Avatar strip, inline badges, compact actions",
    Component: TeamCardVariantA,
  },
  {
    id: "b",
    title: "B — Stats dashboard, colored header band, member roster list",
    Component: TeamCardVariantB,
  },
  {
    id: "c",
    title:
      "C — Profile card, team avatar, divided member list, personal banner",
    Component: TeamCardVariantC,
  },
] as const;

const SUBMISSION_VARIANTS = [
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

export function CardDemo() {
  return (
    <div className="space-y-16">
      {/* ── Tournament cards ─────────────────────────────────── */}
      <section className="mt-12">
        <SectionHeader
          as="h1"
          title="Tournament"
          description="The production tournament listing card across the 9-state matrix (active/upcoming/ended × no-team/member/captain)."
        />

        <div className="mt-8 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_TOURNAMENT_ITEMS.map((item) => (
            <div key={item.tournament._id}>
              <TournamentOverviewCard tournament={item.tournament} />
              <p className="text-muted-foreground mt-1 text-center text-[0.625rem]">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Team cards ────────────────────────────────────────── */}
      <section>
        <SectionHeader
          as="h1"
          title="Team"
          description="Three layout variants for the team card across the 9-state matrix (open/closed/full × outsider/member/captain). Each renders the same data so variants can be compared on merit."
        />

        {TEAM_VARIANTS.map(({ id, title, Component }) => (
          <TeamVariantSection key={id} title={title} Component={Component} />
        ))}
      </section>

      {/* ── Submission cards ──────────────────────────────────── */}
      <section>
        <SectionHeader
          as="h1"
          title="Submission"
          description="The two evidence-led review card variants used by /submissions. Each renders the same 20-card state matrix (individual + group × four states × evidence-count variability)."
        />

        {SUBMISSION_VARIANTS.map(({ id, title, Component }) => (
          <SubmissionVariantSection
            key={id}
            title={title}
            Component={Component}
          />
        ))}
      </section>
    </div>
  );
}

function TeamVariantSection({
  title,
  Component,
}: {
  title: string;
  Component: (props: { item: TeamDemoItem }) => React.JSX.Element;
}) {
  return (
    <div className="mt-8">
      <SectionHeader as="h2" title={title} />

      <div className="mt-4 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_TEAM_ITEMS.map((item) => (
          <div key={item.team._id}>
            <Component item={item} />
            <p className="text-muted-foreground mt-1 text-center text-[0.625rem]">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubmissionVariantSection({
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
