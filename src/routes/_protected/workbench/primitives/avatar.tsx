import { createFileRoute } from "@tanstack/react-router";

import { AvatarSpecimens } from "@/components/workbench/avatar-specimens";

export const Route = createFileRoute("/_protected/workbench/primitives/avatar")(
  {
    component: AvatarWorkbenchPage,
  },
);

function AvatarWorkbenchPage() {
  return <AvatarSpecimens />;
}
