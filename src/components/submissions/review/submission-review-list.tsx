"use client";

import { useQuery } from "convex/react";
import { Loader2, Search } from "lucide-react";
import { useCallback, useState } from "react";

import type { ReviewFilters } from "@/components/submissions/listing/management-section";
import { Button } from "@/components/ui/button";
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
  const teams = useQuery(
    api.teams.list,
    filters.tournamentId ? { tournamentId: filters.tournamentId } : {},
  );
  const users = useQuery(api.users.list, {});

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

  const stateOptions: Array<{
    value: "pending" | "approved" | "rejected";
    label: string;
  }> = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  const toggleState = (state: "pending" | "approved" | "rejected") => {
    const current = filters.state;
    const next = current.includes(state)
      ? current.filter((s) => s !== state)
      : [...current, state];
    onFiltersChange({ ...filters, state: next.length > 0 ? next : [state] });
  };

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search by team, tournament, or submitter..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
              aria-label="Search submissions"
            />
          </div>

          <Select
            value={filters.orderBy}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                orderBy: value as ReviewFilters["orderBy"],
              })
            }
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

        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1">
            {stateOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={
                  filters.state.includes(opt.value) ? "default" : "outline"
                }
                size="sm"
                onClick={() => toggleState(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>

          <Select
            value={filters.tournamentId ?? "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                tournamentId:
                  value === "all" ? undefined : (value as Id<"tournaments">),
                teamId: undefined,
                userId: undefined,
              })
            }
          >
            <SelectTrigger
              className="w-[180px]"
              aria-label="Filter by tournament"
            >
              <SelectValue placeholder="All tournaments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tournaments</SelectItem>
              {tournaments?.map((t) => (
                <SelectItem key={t._id} value={t._id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.teamId ?? "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                teamId: value === "all" ? undefined : (value as Id<"teams">),
                userId: undefined,
              })
            }
          >
            <SelectTrigger className="w-[180px]" aria-label="Filter by team">
              <SelectValue placeholder="All teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All teams</SelectItem>
              {teams?.map((t) => (
                <SelectItem key={t._id} value={t._id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.userId ?? "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                userId: value === "all" ? undefined : (value as Id<"users">),
              })
            }
          >
            <SelectTrigger
              className="w-[180px]"
              aria-label="Filter by submitter"
            >
              <SelectValue placeholder="All submitters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All submitters</SelectItem>
              {users?.map((u) => (
                <SelectItem key={u._id} value={u._id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
