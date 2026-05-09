"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

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

import { SubmissionReviewCard } from "./submission-review-card";
import { filterReviewItems, sortReviewItems } from "./transforms";
import type { ReviewItem } from "./types";

export interface SubmissionReviewListProps {
  items: ReviewItem[];
  onApprove: (item: ReviewItem) => Promise<void>;
  onReject: (item: ReviewItem) => Promise<void>;
  showFilters?: boolean;
  defaultSortBy?: "date-desc" | "date-asc" | "points-desc" | "points-asc";
  emptyMessage?: string;
}

/**
 * Filterable, sortable list of review items with search
 * Supports both individual submissions and submission groups
 */
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

  // Debounce search for performance
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let result = items;

    // Apply search filter
    if (debouncedSearch) {
      result = filterReviewItems(result, debouncedSearch);
    }

    // Apply sorting
    result = sortReviewItems(result, sortBy);

    return result;
  }, [items, debouncedSearch, sortBy]);

  return (
    <div className="space-y-4">
      {/* Filters */}
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

      {/* Count */}
      {items.length > 0 && (
        <p className="text-muted-foreground text-sm">
          Showing {filteredAndSortedItems.length} of {items.length}{" "}
          {items.length === 1 ? "submission" : "submissions"}
        </p>
      )}

      {/* Empty state */}
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

      {/* Submissions grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredAndSortedItems.map((item) => {
          const key =
            item.type === "individual"
              ? `individual-${item.data.submission._id}`
              : `group-${item.data.group._id}`;

          return (
            <SubmissionReviewCard
              key={key}
              item={item}
              onApprove={() => onApprove(item)}
              onReject={() => onReject(item)}
            />
          );
        })}
      </div>
    </div>
  );
}
