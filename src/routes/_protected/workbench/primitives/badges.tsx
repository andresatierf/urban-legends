import { createFileRoute } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";

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

function BadgesWorkbenchPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-h2">Badges</h2>

      <section className="space-y-4">
        <h3 className="text-h3">Semantic variants on paper</h3>
        <div className="bg-paper flex flex-wrap gap-3 rounded-lg p-6">
          {SEMANTIC_VARIANTS.map((v) => (
            <Badge key={v} variant={v}>
              {v}
            </Badge>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-h3">Semantic variants on paper-deep</h3>
        <div className="bg-paper-deep flex flex-wrap gap-3 rounded-lg p-6">
          {SEMANTIC_VARIANTS.map((v) => (
            <Badge key={v} variant={v}>
              {v}
            </Badge>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-h3">Sizes</h3>
        <div className="bg-paper space-y-3 rounded-lg p-6">
          {SIZES.map((s) => (
            <div key={s} className="flex flex-wrap items-center gap-3">
              <span className="text-mute w-16 text-xs">{s}</span>
              {SEMANTIC_VARIANTS.map((v) => (
                <Badge key={v} variant={v} size={s}>
                  {v}
                </Badge>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-h3">Submission status mapping</h3>
        <div className="bg-paper flex flex-wrap gap-3 rounded-lg p-6">
          <Badge variant="success">Approved</Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="error">Rejected</Badge>
          <Badge variant="neutral">Deleted</Badge>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-h3">Tournament states</h3>
        <div className="bg-paper flex flex-wrap gap-3 rounded-lg p-6">
          <Badge variant="success">Active</Badge>
          <Badge variant="info">Upcoming</Badge>
          <Badge variant="neutral">Ended</Badge>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-h3">Team member roles</h3>
        <div className="bg-paper flex flex-wrap gap-3 rounded-lg p-6">
          <Badge variant="warning">Captain</Badge>
          <Badge variant="neutral">Member</Badge>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-h3">Team join policy</h3>
        <div className="bg-paper flex flex-wrap gap-3 rounded-lg p-6">
          <Badge variant="success">Open</Badge>
          <Badge variant="neutral">Closed</Badge>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-h3">Submission types</h3>
        <div className="bg-paper flex flex-wrap gap-3 rounded-lg p-6">
          <Badge variant="neutral">Individual</Badge>
          <Badge variant="social">Team Exercise</Badge>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-h3">Submission tiers</h3>
        <div className="bg-paper flex flex-wrap gap-3 rounded-lg p-6">
          <Badge variant="info">Base Tier</Badge>
          <Badge variant="social">Advanced Tier</Badge>
        </div>
      </section>
    </div>
  );
}
