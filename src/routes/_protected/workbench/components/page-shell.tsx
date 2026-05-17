import { createFileRoute } from "@tanstack/react-router";

import { PageShellSpecimens } from "@/components/workbench/page-shell-specimens";

export const Route = createFileRoute(
  "/_protected/workbench/components/page-shell",
)({
  component: PageShellWorkbenchPage,
});

function PageShellWorkbenchPage() {
  return <PageShellSpecimens />;
}
