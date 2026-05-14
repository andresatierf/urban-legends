import { createFileRoute } from "@tanstack/react-router";

import { ButtonDemo } from "@/components/workbench/button-demo";

export const Route = createFileRoute("/_protected/dev/button-demo")({
  component: ButtonDemoPage,
});

function ButtonDemoPage() {
  return <ButtonDemo />;
}
