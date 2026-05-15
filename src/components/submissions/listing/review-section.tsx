"use client";

import { usePaginatedQuery } from "convex/react";
import { FileCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { SectionHeader } from "@/components/section-header";
import { SubmissionReviewList } from "@/components/submissions/review/submission-review-list";
import type { ReviewItem } from "@/components/submissions/review/types";
import { convertPaginatedToReviewItems } from "@/dto/reviewer";

import { api } from "../../../../convex/_generated/api";
import type { ReviewFilters } from "./management-section";
import { useReviewActions } from "./use-review-actions";

const DEFAULT_FILTERS: ReviewFilters = {
  search: "",
  state: ["pending"],
  orderBy: "date-desc",
};

export function ReviewSection() {
  const [filters, setFilters] = useState<ReviewFilters>(DEFAULT_FILTERS);

  const queryArgs = useMemo(() => {
    const args: Record<string, unknown> = {};
    if (filters.state.length > 0) args.state = filters.state;
    if (filters.tournamentId) args.tournamentId = filters.tournamentId;
    if (filters.teamId) args.teamId = filters.teamId;
    if (filters.userId) args.userId = filters.userId;
    if (filters.search) args.search = filters.search;
    if (filters.orderBy !== "date-desc") args.orderBy = filters.orderBy;
    return args;
  }, [filters]);

  const { results, status, loadMore } = usePaginatedQuery(
    api.role.reviewer.listForReview,
    queryArgs,
    { initialNumItems: 24 },
  );

  const reviewItems: ReviewItem[] = useMemo(
    () => convertPaginatedToReviewItems(results),
    [results],
  );

  const { onApprove, onReject } = useReviewActions();

  return (
    <section className="space-y-4">
      <SectionHeader title="Review Queue" Icon={FileCheck} />
      <SubmissionReviewList
        items={reviewItems}
        onApprove={onApprove}
        onReject={onReject}
        filters={filters}
        onFiltersChange={setFilters}
        paginationStatus={status}
        onLoadMore={() => loadMore(24)}
      />
    </section>
  );
}
