import { Outlet, createFileRoute } from "@tanstack/react-router";

import { WorkbenchSidebar } from "@/components/workbench/sidebar";

export const Route = createFileRoute("/_protected/workbench")({
  component: WorkbenchLayout,
});

function WorkbenchLayout() {
  return (
    <div className="flex items-start gap-6">
      <aside className="sticky top-4 max-h-[calc(100vh-2rem)] w-48 shrink-0 overflow-y-auto py-2">
        <WorkbenchSidebar />
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
