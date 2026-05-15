import { createFileRoute } from "@tanstack/react-router";

import { SubmissionsHubVariantB } from "@/components/workbench/submissions-hub-demo/variant-b";

export const Route = createFileRoute("/_protected/dev/submissions-hub-b")({
  component: SubmissionsHubVariantBPage,
});

function SubmissionsHubVariantBPage() {
  return <SubmissionsHubVariantB />;
}
