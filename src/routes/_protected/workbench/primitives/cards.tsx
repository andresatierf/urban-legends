import { createFileRoute } from "@tanstack/react-router";

import { CardDemo } from "@/components/workbench/card-demo/layout";

export const Route = createFileRoute("/_protected/workbench/primitives/cards")({
  component: CardDemoPage,
});

function CardDemoPage() {
  return <CardDemo />;
}
