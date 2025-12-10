"use client";

import { useMutation, useQuery } from "convex/react";
import { Calendar, CheckCircle, Clock } from "lucide-react";
import { redirect } from "next/navigation";
import { useMemo } from "react";
import { SectionHeader } from "@/components/section-header";
import { SubmissionReviewList } from "@/components/submissions/review/submission-review-list";
import type { ReviewItem } from "@/components/submissions/review/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { convertToReviewItems } from "@/dto/reviewer";
import { useUser } from "@/hooks/useUser";
import { tryMutate } from "@/lib/utils";
import { hasMinimumRole } from "../../../../../common/roles";
import { api } from "../../../../../convex/_generated/api";

export default function TournamentManagerSubmissions() {
  const { user } = useUser();

  const data = useQuery(
    api.role.reviewer.getPendingSubmissions,
    user ? {} : "skip",
  );

  const approve = useMutation(api.submissions.approve);
  const reject = useMutation(api.submissions.reject);

  const reviewItems: ReviewItem[] = useMemo(() => {
    if (!data) return [];

    return convertToReviewItems(data);
  }, [data]);

  const { allItems, pendingItems, resolvedItems } = useMemo(() => {
    const pending = reviewItems.filter((item) => item.data.state === "pending");
    const resolved = reviewItems.filter(
      (item) => item.data.state !== "pending",
    );

    return {
      allItems: reviewItems,
      pendingItems: pending,
      resolvedItems: resolved,
    };
  }, [reviewItems]);

  const handleApprove = async (item: ReviewItem) => {
    if (item.type !== "individual") return;

    await tryMutate({
      fn: () => approve({ submissionId: item.data.submission._id }),
      successToast: "Submission approved successfully",
      defaultFailureToast: "Failed to approve submission",
    });
  };

  const handleReject = async (item: ReviewItem) => {
    if (item.type !== "individual") return;

    await tryMutate({
      fn: () => reject({ submissionId: item.data.submission._id }),
      successToast: "Submission rejected successfully",
      defaultFailureToast: "Failed to reject submission",
    });
  };

  if (user && !hasMinimumRole(user, "tournament_manager")) {
    redirect("/dashboard");
  }

  if (!data || !user) return null; // TODO: add skeleton

  return (
    <>
      <SectionHeader
        as="h1"
        title="Submission Management"
        description="Review and approve submissions from all tournaments"
      />

      <Tabs defaultValue="pending" className="flex flex-col gap-4">
        <TabsList className="self-end">
          <TabsTrigger value="all">
            <Calendar className="mr-2 h-4 w-4" />
            All ({allItems.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            <Clock className="mr-2 h-4 w-4" />
            Pending ({pendingItems.length})
          </TabsTrigger>
          <TabsTrigger value="done">
            <CheckCircle className="mr-2 h-4 w-4" />
            Done ({resolvedItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <SubmissionReviewList
            items={allItems}
            onApprove={handleApprove}
            onReject={handleReject}
            showFilters={true}
            variant="detailed"
            emptyMessage="No submissions to display"
          />
        </TabsContent>

        <TabsContent value="pending">
          <SubmissionReviewList
            items={pendingItems}
            onApprove={handleApprove}
            onReject={handleReject}
            showFilters={true}
            variant="detailed"
            emptyMessage="No pending submissions"
          />
        </TabsContent>

        <TabsContent value="done">
          <SubmissionReviewList
            items={resolvedItems}
            onApprove={handleApprove}
            onReject={handleReject}
            showFilters={true}
            variant="detailed"
            emptyMessage="No resolved submissions"
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
