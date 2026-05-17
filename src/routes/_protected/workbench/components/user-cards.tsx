import { createFileRoute } from "@tanstack/react-router";

import { UserCardsSpecimens } from "@/components/workbench/user-cards-specimens";

export const Route = createFileRoute(
  "/_protected/workbench/components/user-cards",
)({
  component: UserCardsWorkbenchPage,
});

function UserCardsWorkbenchPage() {
  return <UserCardsSpecimens />;
}
