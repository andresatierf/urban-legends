import { createFileRoute } from "@tanstack/react-router";

import { SubmissionSection } from "@/components/workbench/submission-card/section";

export const Route = createFileRoute(
  "/_protected/workbench/components/submission-card",
)({
  component: SubmissionCardWorkbenchPage,
});

function SubmissionCardWorkbenchPage() {
  return (
    <div className="space-y-8">
      <SubmissionSection />
    </div>
  );
}
