import { createFileRoute } from "@tanstack/react-router";

import { TypeScaleSpecimens } from "@/components/type-scale-specimens";
import { TokenWorkbench } from "@/components/workbench/tokens";

export const Route = createFileRoute("/_protected/dev/tokens")({
  component: TokenWorkbenchPage,
});

function TokenWorkbenchPage() {
  return (
    <div className="space-y-12">
      <TokenWorkbench />
      <TypeScaleSpecimens />
    </div>
  );
}
