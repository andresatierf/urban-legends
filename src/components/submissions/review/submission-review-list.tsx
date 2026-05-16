"use client";

import { useQuery } from "convex/react";
import { Filter, Loader2, Search, X } from "lucide-react";
import { useCallback, useState } from "react";

import type { ReviewFilters } from "@/components/submissions/listing/management-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { ComposedSelect } from "@/components/ui/composed-select";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDebounce } from "@/hooks/useDebounce";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { RejectReasonDialog } from "../reject-reason-dialog";
import { CarouselReviewCard } from "./submission-review-card-carousel";
import type { ReviewItem } from "./types";

type PaginationStatus =
  | "LoadingFirstPage"
  | "CanLoadMore"
  | "LoadingMore"
  | "Exhausted";

export interface SubmissionReviewListProps {
  items: ReviewItem[];
  onApprove: (item: ReviewItem) => Promise<void>;
  onReject: (item: ReviewItem, reason: string) => Promise<void>;
  filters: ReviewFilters;
  onFiltersChange: (filters: ReviewFilters) => void;
  paginationStatus: PaginationStatus;
  onLoadMore: () => void;
}

const STATE_OPTIONS: Array<{
  value: "pending" | "approved" | "rejected";
  label: string;
}> = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export function SubmissionReviewList({
  items,
  onApprove,
  onReject,
  filters,
  onFiltersChange,
  paginationStatus,
  onLoadMore,
}: SubmissionReviewListProps) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const [rejectingItem, setRejectingItem] = useState<ReviewItem | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 300);
  if (debouncedSearch !== filters.search) {
    onFiltersChange({ ...filters, search: debouncedSearch });
  }

  const tournaments = useQuery(api.tournaments.list, {});

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

  const toggleState = (state: "pending" | "approved" | "rejected") => {
    const current = filters.state;
    const next = current.includes(state)
      ? current.filter((s) => s !== state)
      : [...current, state];
    onFiltersChange({ ...filters, state: next.length > 0 ? next : [state] });
  };

  const tournament = tournaments?.find((t) => t._id === filters.tournamentId);
  const statusDeviates = !(
    filters.state.length === 1 && filters.state[0] === "pending"
  );
  const activeCount = (filters.tournamentId ? 1 : 0) + (statusDeviates ? 1 : 0);

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

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search submissions..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
              aria-label="Search submissions"
            />
          </div>

          <ComposedSelect
            value={filters.orderBy}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                orderBy: value as ReviewFilters["orderBy"],
              })
            }
            className="w-[180px]"
            ariaLabel="Sort submissions"
            placeholder="Sort by..."
            options={[
              { value: "date-desc", label: "Newest First" },
              { value: "date-asc", label: "Oldest First" },
              { value: "points-desc", label: "Highest Points" },
              { value: "points-asc", label: "Lowest Points" },
            ]}
          />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {activeCount > 0 && (
                  <Badge variant="neutral" className="ml-1">
                    {activeCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px]" align="end">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-muted-foreground mb-2 block text-xs font-medium uppercase">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {STATE_OPTIONS.map((opt) => (
                      <Button
                        key={opt.value}
                        variant={
                          filters.state.includes(opt.value)
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => toggleState(opt.value)}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-muted-foreground mb-2 block text-xs font-medium uppercase">
                    Tournament
                  </label>
                  <ComposedSelect
                    value={filters.tournamentId ?? "all"}
                    onValueChange={(value) =>
                      onFiltersChange({
                        ...filters,
                        tournamentId:
                          value === "all"
                            ? undefined
                            : (value as Id<"tournaments">),
                      })
                    }
                    placeholder="All tournaments"
                    options={[
                      { value: "all", label: "All tournaments" },
                      ...(tournaments?.map((t) => ({
                        value: t._id,
                        label: t.name,
                      })) ?? []),
                    ]}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {activeCount > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs">Active:</span>
            {statusDeviates &&
              filters.state.map((s) => (
                <ActiveChip
                  key={s}
                  label={`Status: ${s}`}
                  onRemove={() => toggleState(s)}
                />
              ))}
            {tournament && (
              <ActiveChip
                label={`Tournament: ${tournament.name}`}
                onRemove={() =>
                  onFiltersChange({ ...filters, tournamentId: undefined })
                }
              />
            )}
          </div>
        )}
      </div>

      {paginationStatus === "LoadingFirstPage" && (
        <div className="flex justify-center py-12">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      )}

      {paginationStatus !== "LoadingFirstPage" && items.length === 0 && (
        <div className="rounded-lg border border-dashed">
          <CardContent>
            <Empty className="text-muted-foreground gap-3 p-6!">
              <EmptyTitle>No submissions found</EmptyTitle>
              {filters.search && (
                <EmptyDescription>Try a different search term</EmptyDescription>
              )}
            </Empty>
          </CardContent>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => {
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

      {(paginationStatus === "CanLoadMore" ||
        paginationStatus === "LoadingMore") && (
        <div className="flex justify-center pt-4">
          <Button
            variant="secondary"
            onClick={onLoadMore}
            disabled={paginationStatus === "LoadingMore"}
          >
            {paginationStatus === "LoadingMore" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}

function ActiveChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <Badge variant="neutral" className="gap-1">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="hover:bg-muted-foreground/20 rounded-sm"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}
