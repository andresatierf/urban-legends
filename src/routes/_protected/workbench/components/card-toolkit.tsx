import { createFileRoute } from "@tanstack/react-router";

import { CardToolkitSpecimens } from "@/components/workbench/card-toolkit-specimens";

export const Route = createFileRoute(
  "/_protected/workbench/components/card-toolkit",
)({
  component: CardToolkitWorkbenchPage,
});

function CardToolkitWorkbenchPage() {
  return <CardToolkitSpecimens />;
}
