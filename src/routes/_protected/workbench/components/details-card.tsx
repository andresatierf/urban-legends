import { createFileRoute } from "@tanstack/react-router";

import { DetailsCardSpecimens } from "@/components/workbench/details-card-specimens";

export const Route = createFileRoute(
  "/_protected/workbench/components/details-card",
)({
  component: DetailsCardWorkbenchPage,
});

function DetailsCardWorkbenchPage() {
  return <DetailsCardSpecimens />;
}
