import { createFileRoute } from "@tanstack/react-router";

import { InvitationListsSpecimens } from "@/components/workbench/invitation-lists-specimens";

export const Route = createFileRoute(
  "/_protected/workbench/components/invitation-lists",
)({
  component: InvitationListsWorkbenchPage,
});

function InvitationListsWorkbenchPage() {
  return <InvitationListsSpecimens />;
}
