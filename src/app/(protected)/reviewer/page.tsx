"use client";

import { useMutation, useQuery } from "convex/react";
import { FileCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import type { UserWithRoles } from "@/../convex/users";
import { SectionHeader } from "@/components/section-header";
import { SubmissionReviewCard } from "@/components/submissions/review/submission-review-card";
import type { ReviewItem } from "@/components/submissions/review/types";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/hooks/useUser";

export default function ReviewerDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [selectedTournament, setSelectedTournament] = useState<
    Id<"tournaments"> | "all"
  >("all");

  // Permission check (client-side navigation)
  useEffect(() => {
    if (
      user &&
      !user.roleNames.includes("reviewer") &&
      !user.roleNames.includes("admin")
    ) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  // Queries
  const pendingData = useQuery(api.reviewer.getPendingSubmissions, {
    tournamentId: selectedTournament === "all" ? undefined : selectedTournament,
  });

  const tournaments = useQuery(api.tournaments.list, {});

  // Mutations
  const approveSubmission = useMutation(api.submissions.approve);
  const rejectSubmission = useMutation(api.submissions.reject);
  const approveGroup = useMutation(api.submissionGroups.approve);
  const rejectGroup = useMutation(api.submissionGroups.reject);

  // Transform API data to ReviewItem format
  const reviewItems: ReviewItem[] = useMemo(() => {
    if (!pendingData) return [];

    return pendingData.items.map((item) => {
      if (item.type === "individual") {
        return {
          type: "individual" as const,
          data: {
            submission: item.submission,
            team: item.team,
            tournament: item.tournament,
            submitter: item.submitter as UserWithRoles,
            images: [],
            isTeamExercise: false,
            participationRate: 0,
          },
        };
      } else {
        return {
          type: "group" as const,
          data: {
            group: item.group,
            team: item.team,
            tournament: item.tournament,
            submissions: item.submissions,
            submitters: item.submitters as UserWithRoles[],
            images: [],
          },
        };
      }
    });
  }, [pendingData]);

  // Action handlers
  const handleApprove = async (item: ReviewItem) => {
    if (item.type === "individual") {
      await approveSubmission({ submissionId: item.data.submission._id });
    } else {
      await approveGroup({ groupId: item.data.group._id });
    }
  };

  const handleReject = async (item: ReviewItem) => {
    if (item.type === "individual") {
      await rejectSubmission({ submissionId: item.data.submission._id });
    } else {
      await rejectGroup({ groupId: item.data.group._id });
    }
  };

  // Loading state
  if (!pendingData || !tournaments || !user) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8 flex items-center gap-3">
          <FileCheck className="h-8 w-8" />
          <h1 className="font-bold text-3xl">Review Queue</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const { total } = pendingData;

  return (
    <>
      <SectionHeader
        as="h1"
        title="Review Queue"
        description={`${total} pending ${total === 1 ? "item" : "items"}`}
        Icon={FileCheck}
      >
        <Select
          value={selectedTournament}
          onValueChange={(value) =>
            setSelectedTournament(
              value === "all" ? "all" : (value as Id<"tournaments">),
            )
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All tournaments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tournaments</SelectItem>
            {tournaments.map((tournament) => (
              <SelectItem key={tournament._id} value={tournament._id}>
                {tournament.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SectionHeader>

      {/* Empty state */}
      {reviewItems.length === 0 && (
        <Card variant="dashed">
          <CardContent>
            <Empty className="gap-3 py-2! text-muted-foreground">
              <EmptyMedia>
                <FileCheck className="h-12 w-12" />
              </EmptyMedia>
              <EmptyHeader>No pending submissions to review</EmptyHeader>
              <EmptyDescription>
                {selectedTournament !== "all"
                  ? "Try selecting a different tournament"
                  : "Check back later for new submissions"}
              </EmptyDescription>
            </Empty>
          </CardContent>
        </Card>
      )}

      {/* Submissions list using new component */}
      <div className="space-y-4">
        {reviewItems.map((item) => {
          const key =
            item.type === "individual"
              ? `individual-${item.data.submission._id}`
              : `group-${item.data.group._id}`;

          return (
            <SubmissionReviewCard
              key={key}
              item={item}
              currentUser={user}
              variant="compact"
              onApprove={() => handleApprove(item)}
              onReject={() => handleReject(item)}
            />
          );
        })}
      </div>
    </>
  );
}
