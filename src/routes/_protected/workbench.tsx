import { Outlet, createFileRoute } from "@tanstack/react-router";

import { WorkbenchSidebar } from "@/components/workbench/sidebar";

export const Route = createFileRoute("/_protected/workbench")({
  component: WorkbenchLayout,
});

function WorkbenchLayout() {
  return (
    <div className="flex gap-6">
      <aside className="w-48 shrink-0 py-2">
        <WorkbenchSidebar />
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
