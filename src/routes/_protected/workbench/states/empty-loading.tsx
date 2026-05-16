import { createFileRoute } from "@tanstack/react-router";

import { StateSpecimens } from "@/components/workbench/state-specimens";

export const Route = createFileRoute(
  "/_protected/workbench/states/empty-loading",
)({
  component: StateWorkbenchPage,
});

function StateWorkbenchPage() {
  return <StateSpecimens />;
}
