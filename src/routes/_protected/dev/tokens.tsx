import { createFileRoute } from "@tanstack/react-router";

import { TokenWorkbench } from "@/components/workbench/tokens";

export const Route = createFileRoute("/_protected/dev/tokens")({
  component: TokenWorkbenchPage,
});

function TokenWorkbenchPage() {
  return <TokenWorkbench />;
}
