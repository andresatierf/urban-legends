"use client";

import { useMutation, useQuery } from "convex/react";
import { Calendar, CheckCircle, Clock, Search } from "lucide-react";
import { redirect } from "next/navigation";
import { useMemo, useState } from "react";
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

export default function TournamentManagerSubmissions() {
  const { user } = useUser();

  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, _setStateFilter] = useState<string>("all");
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

  const pendingSubmissions = useMemo(() => {
    if (!submissions) return [];
    return submissions.filter((s) => s.state === "pending");
  }, [submissions]);

  const resolvedSubmissions = useMemo(() => {
    if (!submissions) return [];
    return submissions.filter((s) => s.state !== "pending");
  }, [submissions]);

  const filteredPendingSubmissions = useMemo(() => {
    if (!submissions) return [];
    return filteredSubmissions.filter((s) => s.state === "pending");
  }, [submissions, filteredSubmissions]);

  const filteredResolvedSubmissions = useMemo(() => {
    if (!submissions) return [];
    return filteredSubmissions.filter((s) => s.state !== "pending");
  }, [submissions, filteredSubmissions]);

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
            All ({submissions.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            <Clock className="mr-2 h-4 w-4" />
            Pending ({pendingSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            <CheckCircle className="mr-2 h-4 w-4" />
            Approved ({resolvedSubmissions.length})
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
            Showing {filteredSubmissions.length} of {submissions.length}{" "}
            submissions
          </div>

          {user && (
            <SubmissionCardList
              submissions={filteredSubmissions}
              currentUser={user}
              onApprove={(id) => approve({ submissionId: id })}
              onReject={(id) => reject({ submissionId: id })}
              onDelete={(id) => remove({ submissionId: id })}
            />
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="text-muted-foreground text-sm">
            Showing {filteredPendingSubmissions.length} of{" "}
            {pendingSubmissions.length} submissions
          </div>

          {user && (
            <SubmissionCardList
              submissions={filteredPendingSubmissions}
              currentUser={user}
              onApprove={(id) => approve({ submissionId: id })}
              onReject={(id) => reject({ submissionId: id })}
              onDelete={(id) => remove({ submissionId: id })}
            />
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <div className="text-muted-foreground text-sm">
            Showing {filteredResolvedSubmissions.length} of{" "}
            {resolvedSubmissions.length} submissions
          </div>

          {user && (
            <SubmissionCardList
              submissions={filteredResolvedSubmissions}
              currentUser={user}
              onApprove={(id) => approve({ submissionId: id })}
              onReject={(id) => reject({ submissionId: id })}
              onDelete={(id) => remove({ submissionId: id })}
            />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
