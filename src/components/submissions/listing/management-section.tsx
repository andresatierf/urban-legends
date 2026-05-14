"use client";

import { useQuery } from "convex/react";
import { Calendar, CheckCircle, Clock } from "lucide-react";
import { useMemo } from "react";

import { SectionHeader } from "@/components/section-header";
import { SubmissionReviewList } from "@/components/submissions/review/submission-review-list";
import type { ReviewItem } from "@/components/submissions/review/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { convertToReviewItems } from "@/dto/reviewer";

import { api } from "../../../../convex/_generated/api";
import { useReviewActions } from "./use-review-actions";

export function ManagementSection() {
  const reviewData = useQuery(api.role.reviewer.getPendingSubmissions, {
    limit: 500,
  });
  const reviewItems: ReviewItem[] = useMemo(
    () => convertToReviewItems(reviewData),
    [reviewData],
  );
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

  const { onApprove, onReject } = useReviewActions();

  return (
    <section className="space-y-4">
      <SectionHeader title="Submission Management" />
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
            onApprove={onApprove}
            onReject={onReject}
            showFilters={true}
            emptyMessage="No submissions to display"
          />
        </TabsContent>
        <TabsContent value="pending">
          <SubmissionReviewList
            items={pendingItems}
            onApprove={onApprove}
            onReject={onReject}
            showFilters={true}
            emptyMessage="No pending submissions"
          />
        </TabsContent>
        <TabsContent value="done">
          <SubmissionReviewList
            items={resolvedItems}
            onApprove={onApprove}
            onReject={onReject}
            showFilters={true}
            emptyMessage="No resolved submissions"
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}
