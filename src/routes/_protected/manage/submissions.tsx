import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/manage/submissions")({
  beforeLoad: () => {
    throw redirect({ to: "/submissions" });
  },
});
