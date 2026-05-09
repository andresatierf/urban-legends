import { createFileRoute } from "@tanstack/react-router";
import { CardDemo } from "@/components/card-demo";

export const Route = createFileRoute("/_protected/dev/card-demo")({
  component: CardDemoPage,
});

function CardDemoPage() {
  return <CardDemo />;
}
