import { createFileRoute } from "@tanstack/react-router";
import { ButtonDemo } from "@/components/button-demo";

export const Route = createFileRoute("/_protected/dev/button-demo")({
  component: ButtonDemoPage,
});

function ButtonDemoPage() {
  return <ButtonDemo />;
}
