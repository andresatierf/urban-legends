import { useEffect, useRef, useState } from "react";

import type { BadgeProps } from "@/components/ui/badge";
import { tryMutate } from "@/lib/utils";

import type { ReviewItem } from "./types";

export type SubmissionState = "pending" | "approved" | "rejected" | "deleted";
export type SubmissionTier = "base" | "advanced";

export interface SubmissionReviewCardProps {
  item: ReviewItem;
  showActions?: boolean;
  onApprove?: () => Promise<void>;
  onReject?: () => Promise<void>;
}

export function stateBadgeVariant(
  state: SubmissionState,
): BadgeProps["variant"] {
  if (state === "approved") return "success";
  if (state === "rejected") return "error";
  if (state === "deleted") return "neutral";
  return "warning";
}

export function managedByLabel(state: SubmissionState): string {
  if (state === "approved") return "Approved by";
  if (state === "rejected") return "Rejected by";
  return "Managed by";
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function getReviewItemFacts(item: ReviewItem) {
  if (item.type === "group") {
    return {
      isGroup: true as const,
      state: item.data.group.state,
      tier: item.data.group.tier,
      pointsEarned: item.data.group.pointsEarned,
      date: item.data.group.date,
      teamName: item.data.team.name,
      tournamentName: item.data.tournament.name,
    };
  }
  return {
    isGroup: false as const,
    state: item.data.submission.state,
    tier: item.data.submission.tier,
    pointsEarned: item.data.submission.pointsEarned,
    date: item.data.submission.date,
    teamName: item.data.team.name,
    tournamentName: item.data.tournament.name,
  };
}

export function useReviewActions(
  item: ReviewItem,
  onApprove?: () => Promise<void>,
  onReject?: () => Promise<void>,
) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleApprove = async () => {
    if (!onApprove) return;
    setIsApproving(true);
    await tryMutate({
      fn: onApprove,
      successToast:
        item.type === "group"
          ? "Team activity approved"
          : "Submission approved",
      defaultFailureToast: "Failed to approve",
      onFinally: () => {
        if (mountedRef.current) setIsApproving(false);
      },
    });
  };

  const handleReject = async () => {
    if (!onReject) return;
    setIsRejecting(true);
    await tryMutate({
      fn: onReject,
      successToast:
        item.type === "group"
          ? "Team activity rejected"
          : "Submission rejected",
      defaultFailureToast: "Failed to reject",
      onFinally: () => {
        if (mountedRef.current) setIsRejecting(false);
      },
    });
  };

  return { isApproving, isRejecting, handleApprove, handleReject };
}
