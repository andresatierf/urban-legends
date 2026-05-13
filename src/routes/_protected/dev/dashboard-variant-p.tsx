import { createFileRoute } from "@tanstack/react-router";

import { DashboardVariantDemo } from "@/components/dashboard/dashboard-variant-demo";

export const Route = createFileRoute("/_protected/dev/dashboard-variant-p")({
  component: DashboardVariantPPage,
});

function DashboardVariantPPage() {
  return <DashboardVariantDemo variant="p" />;
}
