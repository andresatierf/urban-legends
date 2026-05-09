import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/viewer")({
  beforeLoad: () => {
    throw redirect({ to: "/tournaments" });
  },
});
