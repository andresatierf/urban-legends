import { createFileRoute } from "@tanstack/react-router";

import { ButtonDemo } from "@/components/workbench/button-demo";

export const Route = createFileRoute(
  "/_protected/workbench/primitives/buttons",
)({
  component: ButtonDemoPage,
});

function ButtonDemoPage() {
  return <ButtonDemo />;
}
