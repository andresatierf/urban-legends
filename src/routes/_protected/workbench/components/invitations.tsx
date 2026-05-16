import { createFileRoute } from "@tanstack/react-router";

import { InvitationSpecimens } from "@/components/workbench/invitation-specimens";

export const Route = createFileRoute(
  "/_protected/workbench/components/invitations",
)({
  component: InvitationsWorkbenchPage,
});

function InvitationsWorkbenchPage() {
  return <InvitationSpecimens />;
}
