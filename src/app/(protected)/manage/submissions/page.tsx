"use client";

import { useMutation, useQuery } from "convex/react";
import { Calendar, CheckCircle, Clock } from "lucide-react";
import { redirect } from "next/navigation";
import { useMemo } from "react";
import { api } from "@/../convex/_generated/api";
import type { UserWithRoles } from "@/../convex/users";
import { SectionHeader } from "@/components/section-header";
import { SubmissionReviewList } from "@/components/submissions/review/submission-review-list";
import type { ReviewItem } from "@/components/submissions/review/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/useUser";

export default function TournamentManagerSubmissions() {
  const { user } = useUser();

  const approve = useMutation(api.submissions.approve);
  const reject = useMutation(api.submissions.reject);

  const submissions = useQuery(api.tournamentManager.getSubmissions, {});
  const tournaments = useQuery(api.tournaments.list, {});

  // Transform submissions to ReviewItem format
  const reviewItems: ReviewItem[] = useMemo(() => {
    if (!submissions || !tournaments) return [];

    // Create tournament map for quick lookup
    const tournamentMap = new Map(tournaments.map((t) => [t._id, t]));

    return submissions
      .filter((s) => tournamentMap.has(s.tournamentId))
      .map((s) => ({
        type: "individual" as const,
        data: {
          submission: s,
          team: s.team,
          tournament: tournamentMap.get(s.tournamentId)!,
          submitter: s.user as UserWithRoles,
          // TODO: Fetch images for this submission when image upload is implemented
          images: [],
          isTeamExercise: false,
          participationRate: 0,
        },
      }));
  }, [submissions, tournaments]);

  // Filter items by state for tabs
  const { allItems, pendingItems, resolvedItems } = useMemo(() => {
    const pending = reviewItems.filter(
      (item) =>
        item.type === "individual" && item.data.submission.state === "pending",
    );
    const resolved = reviewItems.filter(
      (item) =>
        item.type === "individual" && item.data.submission.state !== "pending",
    );

    return {
      allItems: reviewItems,
      pendingItems: pending,
      resolvedItems: resolved,
    };
  }, [reviewItems]);

  const handleApprove = async (item: ReviewItem) => {
    if (item.type === "individual") {
      await approve({ submissionId: item.data.submission._id });
    }
  };

  const handleReject = async (item: ReviewItem) => {
    if (item.type === "individual") {
      await reject({ submissionId: item.data.submission._id });
    }
  };

  if (
    user &&
    !["admin", "tournament_manager"].some((r) => user.roleNames?.includes(r))
  ) {
    redirect("/dashboard");
  }

  if (!submissions || !tournaments || !user) return null; // TODO: add skeleton

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
            currentUser={user}
            onApprove={handleApprove}
            onReject={handleReject}
            showFilters={true}
            variant="detailed"
            emptyMessage="No submissions to display"
          />
        </TabsContent>

        <TabsContent value="pending">
          <SubmissionReviewList
            items={pendingItems}
            currentUser={user}
            onApprove={handleApprove}
            onReject={handleReject}
            showFilters={true}
            variant="detailed"
            emptyMessage="No pending submissions"
          />
        </TabsContent>

        <TabsContent value="done">
          <SubmissionReviewList
            items={resolvedItems}
            currentUser={user}
            onApprove={handleApprove}
            onReject={handleReject}
            showFilters={true}
            variant="detailed"
            emptyMessage="No resolved submissions"
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
