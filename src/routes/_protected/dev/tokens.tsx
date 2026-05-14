import { createFileRoute } from "@tanstack/react-router";

import { EyebrowSpecimens } from "@/components/workbench/eyebrow-specimens";
import { TokenWorkbench } from "@/components/workbench/tokens";
import { TypeScaleSpecimens } from "@/components/workbench/type-scale-specimens";

export const Route = createFileRoute("/_protected/dev/tokens")({
  component: TokenWorkbenchPage,
});

function TokenWorkbenchPage() {
  return (
    <div className="space-y-12">
      <TokenWorkbench />
      <TypeScaleSpecimens />
      <EyebrowSpecimens />
    </div>
  );
}
