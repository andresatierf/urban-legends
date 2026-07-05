import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/reviewer/")({
  beforeLoad: () => {
    throw redirect({ to: "/activities/review" });
  },
});
