import { createFileRoute } from "@tanstack/react-router";

import { CardDemo } from "@/components/workbench/card-demo/layout";

export const Route = createFileRoute("/_protected/dev/card-demo")({
  component: CardDemoPage,
});

function CardDemoPage() {
  return <CardDemo />;
}
