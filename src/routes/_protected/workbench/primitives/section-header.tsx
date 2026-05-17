import { createFileRoute } from "@tanstack/react-router";

import { SectionHeaderSpecimens } from "@/components/workbench/section-header-specimens";

export const Route = createFileRoute(
  "/_protected/workbench/primitives/section-header",
)({
  component: SectionHeaderWorkbenchPage,
});

function SectionHeaderWorkbenchPage() {
  return <SectionHeaderSpecimens />;
}
