import { createFileRoute } from "@tanstack/react-router";

import { TokenWorkbench } from "@/components/workbench/tokens";
import { TypeScaleSpecimens } from "@/components/workbench/type-scale-specimens";

export const Route = createFileRoute("/_protected/workbench/primitives/tokens")(
  {
    component: TokenWorkbenchPage,
  },
);

function TokenWorkbenchPage() {
  return (
    <div className="space-y-12">
      <TokenWorkbench />
      <TypeScaleSpecimens />
    </div>
  );
}
