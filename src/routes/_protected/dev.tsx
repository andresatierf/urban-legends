import { Outlet, createFileRoute } from "@tanstack/react-router";

import { DemoPageSwitcher } from "@/components/workbench/demo-page-switcher";

export const Route = createFileRoute("/_protected/dev")({
  component: DevLayout,
});

function DevLayout() {
  return (
    <>
      <DemoPageSwitcher />
      <Outlet />
    </>
  );
}
