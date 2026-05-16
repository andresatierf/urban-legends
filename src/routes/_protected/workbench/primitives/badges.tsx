import { createFileRoute } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { VariantMatrix } from "@/components/workbench/shells/variant-matrix";

export const Route = createFileRoute("/_protected/workbench/primitives/badges")(
  {
    component: BadgesWorkbenchPage,
  },
);

const SEMANTIC_VARIANTS = [
  "success",
  "warning",
  "error",
  "info",
  "social",
  "neutral",
] as const;

const SIZES = ["xs", "sm", "default", "lg"] as const;

const SURFACES = ["paper", "paper-deep"] as const;

const SURFACE_CLASS: Record<(typeof SURFACES)[number], string> = {
  paper: "bg-paper",
  "paper-deep": "bg-paper-deep",
};

type MappingEntry = {
  label: string;
  variant: (typeof SEMANTIC_VARIANTS)[number];
};

const SEMANTIC_MAPPINGS: { title: string; entries: MappingEntry[] }[] = [
  {
    title: "Submission status mapping",
    entries: [
      { label: "Approved", variant: "success" },
      { label: "Pending", variant: "warning" },
      { label: "Rejected", variant: "error" },
      { label: "Deleted", variant: "neutral" },
    ],
  },
  {
    title: "Tournament states",
    entries: [
      { label: "Active", variant: "success" },
      { label: "Upcoming", variant: "info" },
      { label: "Ended", variant: "neutral" },
    ],
  },
  {
    title: "Team member roles",
    entries: [
      { label: "Captain", variant: "warning" },
      { label: "Member", variant: "neutral" },
    ],
  },
  {
    title: "Team join policy",
    entries: [
      { label: "Open", variant: "success" },
      { label: "Closed", variant: "neutral" },
    ],
  },
  {
    title: "Submission types",
    entries: [
      { label: "Individual", variant: "neutral" },
      { label: "Team Exercise", variant: "social" },
    ],
  },
  {
    title: "Submission tiers",
    entries: [
      { label: "Base Tier", variant: "info" },
      { label: "Advanced Tier", variant: "social" },
    ],
  },
];

function BadgesWorkbenchPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-h2">Badges</h2>

      <section className="space-y-4">
        <h3 className="text-h3">Semantic variants by surface</h3>
        <VariantMatrix
          variants={SEMANTIC_VARIANTS}
          columns={SURFACES}
          renderCell={(variant, surface) => (
            <div
              className={`flex items-center justify-center rounded-md p-3 ${SURFACE_CLASS[surface]}`}
            >
              <Badge variant={variant}>{variant}</Badge>
            </div>
          )}
        />
      </section>

      <section className="space-y-4">
        <h3 className="text-h3">Sizes</h3>
        <VariantMatrix
          variants={SEMANTIC_VARIANTS}
          columns={SIZES}
          renderCell={(variant, size) => (
            <div className="flex items-center justify-center">
              <Badge variant={variant} size={size}>
                {variant}
              </Badge>
            </div>
          )}
        />
      </section>

      <section className="space-y-4">
        <h3 className="text-h3">Semantic mappings</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SEMANTIC_MAPPINGS.map((mapping) => (
            <section key={mapping.title} className="space-y-2">
              <h4 className="text-label-caps text-muted-foreground">
                {mapping.title}
              </h4>
              <div className="bg-paper flex flex-wrap gap-3 rounded-lg p-6">
                {mapping.entries.map((entry) => (
                  <Badge key={entry.label} variant={entry.variant}>
                    {entry.label}
                  </Badge>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
