"use client";

import { useMutation, useQuery } from "convex/react";
import { Calendar, CheckCircle, Clock, Search } from "lucide-react";
import { redirect } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { SectionHeader } from "@/components/section-header";
import { SubmissionCardList } from "@/components/submissions/submission-card-list";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/useUser";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function TournamentManagerSubmissions() {
  const { user } = useUser();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("date-desc");

  const approve = useMutation(api.submissions.approve);
  const reject = useMutation(api.submissions.reject);
  const remove = useMutation(api.submissions.remove);

  const submissions = useQuery(api.tournamentManager.getSubmissions, {});

  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    if (!submissions) return [];

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
  }, [submissions, searchQuery, sortBy]);

  const {
    all,
    pending,
    resolved,
    filtered,
    filteredPending,
    filteredResolved,
  } = useMemo(() => {
    if (!submissions)
      return {
        all: [],
        pending: [],
        resolved: [],
        filtered: [],
        filteredPending: [],
        filteredResolved: [],
      };

    const pending = submissions.filter((s) => s.state === "pending");
    const resolved = submissions.filter((s) => s.state !== "pending");

    const filteredPending = filteredSubmissions.filter(
      (s) => s.state === "pending",
    );
    const filteredResolved = filteredSubmissions.filter(
      (s) => s.state !== "pending",
    );

    return {
      all: submissions,
      pending,
      resolved,
      filtered: filteredSubmissions,
      filteredPending,
      filteredResolved,
    };
  }, [submissions, filteredSubmissions]);

  const onApprove = useCallback(
    (submissionId: Id<"submissions">) => approve({ submissionId }),
    [approve],
  );

  const onReject = useCallback(
    (submissionId: Id<"submissions">) => reject({ submissionId }),
    [reject],
  );

  const onDelete = useCallback(
    (submissionId: Id<"submissions">) => remove({ submissionId }),
    [remove],
  );

  if (
    user &&
    !["admin", "tournament_manager"].some((r) => user.roleNames?.includes(r))
  ) {
    redirect("/dashboard");
  }

  if (!submissions) return null; // TODO: add skeleton

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
            All ({all.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            <Clock className="mr-2 h-4 w-4" />
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="done">
            <CheckCircle className="mr-2 h-4 w-4" />
            Done ({resolved.length})
          </TabsTrigger>
        </TabsList>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by team, user, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
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

        <TabsContent value="all" className="space-y-4">
          <div className="text-muted-foreground text-sm">
            Showing {filtered.length} of {all.length} submissions
          </div>

          {user && (
            <SubmissionCardList
              submissions={filtered}
              currentUser={user}
              onApprove={onApprove}
              onReject={onReject}
              onDelete={onDelete}
            />
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="text-muted-foreground text-sm">
            Showing {filteredPending.length} of {pending.length} submissions
          </div>

          {user && (
            <SubmissionCardList
              submissions={filteredPending}
              currentUser={user}
              onApprove={onApprove}
              onReject={onReject}
              onDelete={onDelete}
            />
          )}
        </TabsContent>

        <TabsContent value="done" className="space-y-4">
          <div className="text-muted-foreground text-sm">
            Showing {filteredResolved.length} of {resolved.length} submissions
          </div>

          {user && (
            <SubmissionCardList
              submissions={filteredResolved}
              currentUser={user}
              onApprove={onApprove}
              onReject={onReject}
              onDelete={onDelete}
            />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
