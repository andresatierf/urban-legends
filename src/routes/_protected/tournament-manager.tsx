import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/tournament-manager")({
  beforeLoad: () => {
    throw redirect({ to: "/tournaments" });
  },
});
