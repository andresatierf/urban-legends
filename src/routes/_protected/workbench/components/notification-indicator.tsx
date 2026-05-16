import { createFileRoute } from "@tanstack/react-router";

import { NotificationIndicatorSpecimens } from "@/components/workbench/notification-indicator-specimens";

export const Route = createFileRoute(
  "/_protected/workbench/components/notification-indicator",
)({
  component: NotificationIndicatorWorkbenchPage,
});

function NotificationIndicatorWorkbenchPage() {
  return <NotificationIndicatorSpecimens />;
}
