"use client";

import { useMutation } from "convex/react";

import type { ReviewItem } from "@/components/submissions/review/types";
import { tryMutate } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";

export function useReviewActions() {
  const approve = useMutation(api.submissions.approve);
  const reject = useMutation(api.submissions.reject);
  const approveGroup = useMutation(api.submissionGroups.approve);
  const rejectGroup = useMutation(api.submissionGroups.reject);

  const onApprove = async (item: ReviewItem) => {
    if (item.type === "individual") {
      await tryMutate({
        fn: () => approve({ submissionId: item.data.submission._id }),
        successToast: "Submission approved successfully",
        defaultFailureToast: "Failed to approve submission",
      });
    } else {
      await tryMutate({
        fn: () => approveGroup({ groupId: item.data.group._id }),
        successToast: "Team activity approved successfully",
        defaultFailureToast: "Failed to approve team activity",
      });
    }
  };

  const onReject = async (item: ReviewItem) => {
    if (item.type === "individual") {
      await tryMutate({
        fn: () => reject({ submissionId: item.data.submission._id }),
        successToast: "Submission rejected successfully",
        defaultFailureToast: "Failed to reject submission",
      });
    } else {
      await tryMutate({
        fn: () => rejectGroup({ groupId: item.data.group._id }),
        successToast: "Team activity rejected successfully",
        defaultFailureToast: "Failed to reject team activity",
      });
    }
  };

  return { onApprove, onReject };
}
