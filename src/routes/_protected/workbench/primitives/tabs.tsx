import { createFileRoute } from "@tanstack/react-router";

import { TabsSpecimens } from "@/components/workbench/tabs-specimens";

export const Route = createFileRoute("/_protected/workbench/primitives/tabs")({
  component: TabsWorkbenchPage,
});

function TabsWorkbenchPage() {
  return <TabsSpecimens />;
}
