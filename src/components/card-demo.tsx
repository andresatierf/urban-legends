import { SectionHeader } from "./section-header";
import {
  DEMO_GROUP_SUBMISSIONS,
  DEMO_INDIVIDUAL_SUBMISSIONS,
  type DemoCardItem,
} from "./submission-card-demo-fixtures";
import { SubmissionCardVariantA } from "./submission-card-variant-a";
import { SubmissionCardVariantC } from "./submission-card-variant-c";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

const VARIANTS = [
  {
    id: "a",
    title: "Variant A — Landscape lead, mosaic groups, footer actions",
    Component: SubmissionCardVariantA,
  },
  {
    id: "c",
    title: "Variant C — Portrait lead, submitter strip groups, split footer",
    Component: SubmissionCardVariantC,
  },
] as const;

const CARD_VARIANTS = [
  "default",
  "admin",
  "tournament_manager",
  "info",
  "dashed",
] as const;

export function CardDemo() {
  return (
    <>
      <SectionHeader as="h1" title="Card Demo" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {CARD_VARIANTS.map((variant) => (
          <Card key={variant}>
            <CardHeader>
              <CardTitle className="capitalize">
                {variant === "tournament_manager"
                  ? "Tournament Manager"
                  : variant}
              </CardTitle>
              <CardDescription>
                This is a {variant} card variant showing how it appears in both
                light and dark modes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Card content goes here. This variant demonstrates the themed
                colors and styling.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" size="sm">
                Cancel
              </Button>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <SectionHeader as="h2" title="Card with Different Content" />
        <div className="grid gap-6 md:grid-cols-2">
          {CARD_VARIANTS.map((variant) => (
            <Card key={`${variant}-alt`}>
              <CardHeader>
                <CardTitle className="capitalize">
                  {variant === "tournament_manager"
                    ? "Tournament Manager Card"
                    : `${variant} Card`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Label:
                    </span>
                    <span className="text-sm font-medium">Value</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Status:
                    </span>
                    <span className="text-sm font-medium">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Progress:
                    </span>
                    <span className="text-sm font-medium">75%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader as="h2" title="Minimal Cards" />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {CARD_VARIANTS.map((variant) => (
            <Card key={`${variant}-minimal`}>
              <CardContent className="flex min-h-[100px] items-center justify-center p-6">
                <p className="text-center font-medium capitalize">
                  {variant === "tournament_manager" ? "TM" : variant}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <section className="mt-12">
        <SectionHeader
          as="h1"
          title="Submission"
          description="Three evidence-led card prototypes for the future review grid. Each variant renders the same 16-card state matrix (individual + group × four states × evidence-count variability)."
        />

        {VARIANTS.map(({ id, title, Component }) => (
          <SubmissionVariantSection
            key={id}
            title={title}
            Component={Component}
          />
        ))}
      </section>
    </>
  );
}

function SubmissionVariantSection({
  title,
  Component,
}: {
  title: string;
  Component: (props: { item: DemoCardItem }) => React.JSX.Element;
}) {
  return (
    <div className="mt-8">
      <SectionHeader as="h2" title={title} />

      <div className="mt-4">
        <h3 className="mb-3 font-medium text-muted-foreground text-sm">
          Individual submissions (1–5 evidence images)
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {DEMO_INDIVIDUAL_SUBMISSIONS.map((item) => (
            <Component key={item.id} item={item} />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 font-medium text-muted-foreground text-sm">
          Team activity (1–5 submitters)
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {DEMO_GROUP_SUBMISSIONS.map((item) => (
            <Component key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
