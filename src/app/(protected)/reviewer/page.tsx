"use client";

import { useMutation, useQuery } from "convex/react";
import { FileCheck, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { api } from "@/../convex/_generated/api";
import { SectionHeader } from "@/components/section-header";
import { SubmissionReviewList } from "@/components/submissions/review/submission-review-list";
import { convertToReviewItems, type ReviewItem } from "@/dto/reviewer";
import { useUserWithMinimumRole } from "@/hooks/useUser";
import { tryMutate } from "@/lib/utils";

export default function ReviewerDashboard() {
  const { user } = useUserWithMinimumRole("reviewer");

  const data = useQuery(
    api.role.reviewer.getPendingSubmissions,
    user ? {} : "skip",
  );

  const approveSubmission = useMutation(api.submissions.approve);
  const rejectSubmission = useMutation(api.submissions.reject);
  const approveGroup = useMutation(api.submissionGroups.approve);
  const rejectGroup = useMutation(api.submissionGroups.reject);

  const reviewItems: ReviewItem[] = useMemo(
    () => convertToReviewItems(data),
    [data],
  );

  const handleApprove = async (item: ReviewItem) => {
    if (item.type === "individual") {
      await tryMutate({
        fn: () => approveSubmission({ submissionId: item.data.submission._id }),
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

  const handleReject = async (item: ReviewItem) => {
    if (item.type === "individual") {
      await tryMutate({
        fn: () => rejectSubmission({ submissionId: item.data.submission._id }),
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

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <>
        <SectionHeader
          as="h1"
          title="Review Queue"
          description="Loading..."
          Icon={FileCheck}
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  const { total } = data;

  return (
    <>
      <SectionHeader
        as="h1"
        title="Review Queue"
        description={`${total} pending ${total === 1 ? "item" : "items"}`}
        Icon={FileCheck}
      />

      <SubmissionReviewList
        variant="detailed"
        items={reviewItems}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
}
