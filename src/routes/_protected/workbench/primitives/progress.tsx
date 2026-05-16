import { createFileRoute } from "@tanstack/react-router";

import { ProgressSpecimens } from "@/components/workbench/progress-specimens";

export const Route = createFileRoute(
  "/_protected/workbench/primitives/progress",
)({
  component: ProgressWorkbenchPage,
});

function ProgressWorkbenchPage() {
  return <ProgressSpecimens />;
}
