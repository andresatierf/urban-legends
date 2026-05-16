import { createFileRoute } from "@tanstack/react-router";

import { RibbonSpecimens } from "@/components/workbench/ribbon-specimens";

export const Route = createFileRoute(
  "/_protected/workbench/primitives/ribbons",
)({
  component: RibbonsWorkbenchPage,
});

function RibbonsWorkbenchPage() {
  return <RibbonSpecimens />;
}
