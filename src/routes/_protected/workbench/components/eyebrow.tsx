import { createFileRoute } from "@tanstack/react-router";

import { EyebrowSpecimens } from "@/components/workbench/eyebrow-specimens";

export const Route = createFileRoute(
  "/_protected/workbench/components/eyebrow",
)({
  component: EyebrowWorkbenchPage,
});

function EyebrowWorkbenchPage() {
  return (
    <div className="space-y-8">
      <EyebrowSpecimens />
    </div>
  );
}
