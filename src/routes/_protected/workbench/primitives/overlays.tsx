import { createFileRoute } from "@tanstack/react-router";

import { OverlaySpecimens } from "@/components/workbench/overlay-specimens";

export const Route = createFileRoute(
  "/_protected/workbench/primitives/overlays",
)({
  component: OverlaysWorkbenchPage,
});

function OverlaysWorkbenchPage() {
  return <OverlaySpecimens />;
}
