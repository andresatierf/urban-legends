import { createFileRoute } from "@tanstack/react-router";

import { SubmissionsHubVariantC } from "@/components/workbench/submissions-hub-demo/variant-c";

export const Route = createFileRoute("/_protected/dev/submissions-hub-c")({
  component: SubmissionsHubVariantCPage,
});

function SubmissionsHubVariantCPage() {
  return <SubmissionsHubVariantC />;
}
