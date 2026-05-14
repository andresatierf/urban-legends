import { createFileRoute } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_protected/dev/badges")({
  component: BadgesWorkbenchPage,
});

const SEMANTIC_VARIANTS = [
  "success",
  "warning",
  "error",
  "info",
  "social",
] as const;

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
        <h3 className="text-h3">Submission status mapping</h3>
        <div className="bg-paper flex flex-wrap gap-3 rounded-lg p-6">
          <Badge variant="success">Approved</Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="error">Rejected</Badge>
          <Badge variant="outline">Deleted</Badge>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-h3">Legacy variants</h3>
        <div className="bg-paper flex flex-wrap gap-3 rounded-lg p-6">
          <Badge variant="default">default</Badge>
          <Badge variant="secondary">secondary</Badge>
          <Badge variant="destructive">destructive</Badge>
          <Badge variant="outline">outline</Badge>
          <Badge variant="ghost">ghost</Badge>
          <Badge variant="link">link</Badge>
        </div>
      </section>
    </div>
  );
}
