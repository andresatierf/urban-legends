import { createFileRoute } from "@tanstack/react-router";

import { SubmissionsHubVariantA } from "@/components/workbench/submissions-hub-demo/variant-a";

export const Route = createFileRoute("/_protected/dev/submissions-hub-a")({
  component: SubmissionsHubVariantAPage,
});

function SubmissionsHubVariantAPage() {
  return <SubmissionsHubVariantA />;
}
