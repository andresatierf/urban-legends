"use client";

import { useQuery } from "convex/react";
import { FileCheck } from "lucide-react";
import { useMemo } from "react";

import { SectionHeader } from "@/components/section-header";
import { SubmissionReviewList } from "@/components/submissions/review/submission-review-list";
import type { ReviewItem } from "@/components/submissions/review/types";
import { convertToReviewItems } from "@/dto/reviewer";

import { api } from "../../../../convex/_generated/api";
import { useReviewActions } from "./use-review-actions";

export function ReviewSection() {
  const reviewData = useQuery(api.role.reviewer.getPendingSubmissions, {
    limit: 500,
  });
  const reviewItems: ReviewItem[] = useMemo(
    () => convertToReviewItems(reviewData),
    [reviewData],
  );

  const { onApprove, onReject } = useReviewActions();
  const total = reviewData?.total ?? 0;

  return (
    <section className="space-y-4">
      <SectionHeader
        title="Review Queue"
        description={`${total} pending ${total === 1 ? "item" : "items"}`}
        Icon={FileCheck}
      />
      <SubmissionReviewList
        items={reviewItems}
        onApprove={onApprove}
        onReject={onReject}
      />
    </section>
  );
}
