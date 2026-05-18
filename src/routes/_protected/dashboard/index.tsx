import { createFileRoute } from "@tanstack/react-router";

import { DashboardLayout } from "@/components/dashboard";

export const Route = createFileRoute("/_protected/dashboard/")({
  component: DashboardLayout,
});
