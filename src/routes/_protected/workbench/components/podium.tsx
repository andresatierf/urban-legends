import { createFileRoute } from "@tanstack/react-router";

import { PodiumSpecimens } from "@/components/workbench/podium-specimens";

export const Route = createFileRoute("/_protected/workbench/components/podium")(
  {
    component: PodiumWorkbenchPage,
  },
);

function PodiumWorkbenchPage() {
  return <PodiumSpecimens />;
}
