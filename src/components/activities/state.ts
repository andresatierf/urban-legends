import type { BadgeProps } from "@/components/ui/badge";

import type { Doc } from "../../../convex/_generated/dataModel";

export type ActivityState = Doc<"activities">["state"];

export function activityStateBadgeVariant(
  state: ActivityState,
): BadgeProps["variant"] {
  if (state === "approved") return "success";
  if (state === "rejected") return "error";
  if (state === "deleted") return "neutral";
  if (state === "incomplete") return "neutral";
  return "warning";
}
