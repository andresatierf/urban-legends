"use client";

import { useMutation, useQuery } from "convex/react";
import { FileCheck, Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import { useMemo } from "react";
import { api } from "@/../convex/_generated/api";
import type { Doc } from "@/../convex/_generated/dataModel";
import type { UserWithRoles } from "@/../convex/users";
import { SectionHeader } from "@/components/section-header";
import { SubmissionReviewList } from "@/components/submissions/review/submission-review-list";
import type { ReviewItem } from "@/components/submissions/review/types";
import { useUser } from "@/hooks/useUser";
import { tryMutate } from "@/lib/utils";

const ALLOWED_ROLES = ["admin", "tournament_manager", "reviewer"];

// Type guard to check if a user object has roles (UserWithRoles)
function isUserWithRoles(user: Doc<"users">): user is UserWithRoles {
  return (
    "roleNames" in user &&
    "roles" in user &&
    Array.isArray((user as UserWithRoles).roleNames) &&
    Array.isArray((user as UserWithRoles).roles)
  );
}

// Convert Doc<"users"> to UserWithRoles with safe fallback
function toUserWithRoles(user: Doc<"users">): UserWithRoles {
  if (isUserWithRoles(user)) {
    return user;
  }
  // Fallback for users without roles loaded
  return {
    ...user,
    roles: [],
    roleNames: [],
  };
}

export default function ReviewerDashboard() {
  const { user } = useUser();

  // Queries (must be called before any conditional returns - hooks rule)
  const pendingData = useQuery(
    api.reviewer.getPendingSubmissions,
    user && ALLOWED_ROLES.some((role) => user.roleNames.includes(role))
      ? {}
      : "skip",
  );

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
            submitter: toUserWithRoles(item.submitter),
            // Placeholders for features not yet implemented:
            images: [], // Will be populated when image storage is implemented
            isTeamExercise: false, // Individual submissions are not team exercises
            participationRate: 0, // Not applicable for individual submissions
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
            submitters: item.submitters.map(toUserWithRoles),
            // Placeholder for image storage feature:
            // TODO: Aggregate images from all submissions in the group when image upload is implemented
            images: [],
          },
        };
      }
    });
  }, [pendingData]);

  // Action handlers
  const handleApprove = async (item: ReviewItem) => {
    if (item.type === "individual") {
      await tryMutate({
        fn: () => approveSubmission({ submissionId: item.data.submission._id }),
        successToast: "Submission approved successfully",
        defaultFailureToast: "Failed to approve submission",
      });
    } else {
      await tryMutate({
        fn: () => approveGroup({ groupId: item.data.group._id }),
        successToast: "Team activity approved successfully",
        defaultFailureToast: "Failed to approve team activity",
      });
    }
  };

  const handleReject = async (item: ReviewItem) => {
    if (item.type === "individual") {
      await tryMutate({
        fn: () => rejectSubmission({ submissionId: item.data.submission._id }),
        successToast: "Submission rejected successfully",
        defaultFailureToast: "Failed to reject submission",
      });
    } else {
      await tryMutate({
        fn: () => rejectGroup({ groupId: item.data.group._id }),
        successToast: "Team activity rejected successfully",
        defaultFailureToast: "Failed to reject team activity",
      });
    }
  };

  // Authorization check (after all hooks to comply with React rules)
  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!ALLOWED_ROLES.some((role) => user.roleNames.includes(role))) {
    redirect("/dashboard");
  }

  // Loading state
  if (!pendingData) {
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
      />

      <SubmissionReviewList
        variant="detailed"
        items={reviewItems}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
}
