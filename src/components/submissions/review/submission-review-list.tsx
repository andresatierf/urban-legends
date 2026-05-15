"use client";

import { Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";

import { RejectReasonDialog } from "../reject-reason-dialog";
import { CarouselReviewCard } from "./submission-review-card-carousel";
import { filterReviewItems, sortReviewItems } from "./transforms";
import type { ReviewItem } from "./types";

export interface SubmissionReviewListProps {
  items: ReviewItem[];
  onApprove: (item: ReviewItem) => Promise<void>;
  onReject: (item: ReviewItem, reason: string) => Promise<void>;
  showFilters?: boolean;
  defaultSortBy?: "date-desc" | "date-asc" | "points-desc" | "points-asc";
  emptyMessage?: string;
}

export function SubmissionReviewList({
  items,
  onApprove,
  onReject,
  showFilters = true,
  defaultSortBy = "date-desc",
  emptyMessage = "No submissions to display",
}: SubmissionReviewListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "date-desc" | "date-asc" | "points-desc" | "points-asc"
  >(defaultSortBy);
  const [rejectingItem, setRejectingItem] = useState<ReviewItem | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const filteredAndSortedItems = useMemo(() => {
    let result = items;
    if (debouncedSearch) {
      result = filterReviewItems(result, debouncedSearch);
    }
    result = sortReviewItems(result, sortBy);
    return result;
  }, [items, debouncedSearch, sortBy]);

  const handleRejectConfirm = useCallback(
    async (reason: string) => {
      if (!rejectingItem) return;
      setIsRejecting(true);
      try {
        await onReject(rejectingItem, reason);
      } finally {
        setIsRejecting(false);
        setRejectingItem(null);
      }
    },
    [rejectingItem, onReject],
  );

  return (
    <div className="space-y-4">
      <RejectReasonDialog
        open={rejectingItem !== null}
        onOpenChange={(open) => {
          if (!open) setRejectingItem(null);
        }}
        onConfirm={handleRejectConfirm}
        isSubmitting={isRejecting}
      />

      {showFilters && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search by team, tournament, or submitter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label="Search submissions by team, tournament, or submitter"
            />
          </div>

          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as typeof sortBy)}
          >
            <SelectTrigger className="w-[200px]" aria-label="Sort submissions">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="points-desc">Highest Points</SelectItem>
              <SelectItem value="points-asc">Lowest Points</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {items.length > 0 && (
        <p className="text-muted-foreground text-sm">
          Showing {filteredAndSortedItems.length} of {items.length}{" "}
          {items.length === 1 ? "submission" : "submissions"}
        </p>
      )}

      {filteredAndSortedItems.length === 0 && (
        <div className="rounded-lg border border-dashed">
          <CardContent>
            <Empty className="text-muted-foreground gap-3 p-6!">
              <EmptyTitle>{emptyMessage}</EmptyTitle>
              {debouncedSearch && (
                <EmptyDescription>Try a different search term</EmptyDescription>
              )}
            </Empty>
          </CardContent>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredAndSortedItems.map((item) => {
          const key =
            item.type === "individual"
              ? `individual-${item.data.submission._id}`
              : `group-${item.data.group._id}`;

          return (
            <CarouselReviewCard
              key={key}
              item={item}
              onApprove={() => onApprove(item)}
              onReject={async () => setRejectingItem(item)}
            />
          );
        })}
      </div>
    </div>
  );
}
