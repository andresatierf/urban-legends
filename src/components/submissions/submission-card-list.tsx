"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Doc, Id } from "@/../convex/_generated/dataModel";
import type { UserWithRoles } from "@/../convex/users";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmissionCard } from "./submission-card";

interface SubmissionCardListProps {
  submissions: Array<
    Doc<"submissions"> & {
      team: Doc<"teams">;
      user: Doc<"users">;
    }
  >;
  currentUser: UserWithRoles;
  onApprove?: (submissionId: Id<"submissions">) => void;
  onReject?: (submissionId: Id<"submissions">) => void;
  onEdit?: (submissionId: Id<"submissions">) => void;
  onDelete?: (submissionId: Id<"submissions">) => void;
}

export function SubmissionCardList({
  submissions,
  currentUser,
  onApprove,
  onReject,
  onEdit,
  onDelete,
}: SubmissionCardListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");

  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.team.name.toLowerCase().includes(query) ||
          s.user.name.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query),
      );
    }

    // State filter
    if (stateFilter !== "all") {
      filtered = filtered.filter((s) => s.state === stateFilter);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "points-desc":
          return (b.pointsEarned || 0) - (a.pointsEarned || 0);
        case "points-asc":
          return (a.pointsEarned || 0) - (b.pointsEarned || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [submissions, searchQuery, stateFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1 lg:max-w-md">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by team, user, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="points-desc">Most Points</SelectItem>
              <SelectItem value="points-asc">Least Points</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-muted-foreground text-sm">
        Showing {filteredSubmissions.length} of {submissions.length} submissions
      </div>

      {/* Submission Cards */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">No submissions found</p>
          </div>
        ) : (
          filteredSubmissions.map((submission) => (
            <SubmissionCard
              key={submission._id}
              submission={submission}
              images={[]} // Will be fetched per card
              currentUser={currentUser}
              onApprove={() => onApprove?.(submission._id)}
              onReject={() => onReject?.(submission._id)}
              onEdit={() => onEdit?.(submission._id)}
              onDelete={() => onDelete?.(submission._id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
