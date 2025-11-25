"use client";

import { useMutation, useQuery } from "convex/react";
import { CheckCircle2, FileCheck, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
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

  // Action handlers
  const handleApproveIndividual = async (submissionId: Id<"submissions">) => {
    try {
      await approveSubmission({ submissionId });
      toast.success("Submission approved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to approve submission",
      );
    }
  };

  const handleRejectIndividual = async (submissionId: Id<"submissions">) => {
    try {
      await rejectSubmission({ submissionId });
      toast.success("Submission rejected");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reject submission",
      );
    }
  };

  const handleApproveGroup = async (groupId: Id<"submissionGroups">) => {
    try {
      await approveGroup({ groupId });
      toast.success("Team activity approved");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to approve team activity",
      );
    }
  };

  const handleRejectGroup = async (groupId: Id<"submissionGroups">) => {
    try {
      await rejectGroup({ groupId });
      toast.success("Team activity rejected");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to reject team activity",
      );
    }
  };

  // Loading state
  if (!pendingData || !tournaments) {
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

  const { items, total } = pendingData;

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <FileCheck className="h-8 w-8" />
          <div>
            <h1 className="font-bold text-3xl">Review Queue</h1>
            <p className="text-muted-foreground text-sm">
              {total} pending {total === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <FileCheck className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="font-medium text-muted-foreground">
            No pending submissions to review
          </p>
          <p className="text-muted-foreground text-sm">
            {selectedTournament !== "all"
              ? "Try selecting a different tournament"
              : "Check back later for new submissions"}
          </p>
        </div>
      )}

      {/* Submissions list */}
      <div className="space-y-4">
        {items.map((item) => {
          if (item.type === "individual") {
            const { submission, team, tournament, submitter } = item;

            return (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {team?.name || "Unknown Team"}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {tournament?.name || "Unknown Tournament"}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Submitted by {submitter?.name || "Unknown"} on{" "}
                      {submission.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 font-medium text-blue-800 text-xs">
                      Individual
                    </span>
                    <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 font-medium text-purple-800 text-xs">
                      {submission.tier === "base"
                        ? "Base Tier"
                        : "Advanced Tier"}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {submission.description && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">
                      {submission.description}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApproveIndividual(submission._id)}
                    className="gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    color="destructive"
                    onClick={() => handleRejectIndividual(submission._id)}
                    className="gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            );
          }

          // Group submission
          const { group, team, tournament, submitters } = item;

          return (
            <div
              key={item.id}
              className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Header */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold">
                    {team?.name || "Unknown Team"}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {tournament?.name || "Unknown Tournament"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Team activity on {group.date} • {group.participantCount} /{" "}
                    {group.totalTeamMembers} members participated
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 font-medium text-green-800 text-xs">
                    Team Activity
                  </span>
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 font-medium text-purple-800 text-xs">
                    {group.tier === "base" ? "Base Tier" : "Advanced Tier"}
                  </span>
                </div>
              </div>

              {/* Participants */}
              <div className="text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium">Participants:</span>{" "}
                  {submitters.map((s) => s.name).join(", ")}
                </p>
                {group.isTeamExercise && (
                  <p className="text-green-600 text-sm">
                    ✓ Qualifies as team exercise (
                    {Math.round(group.participationRate * 100)}% participation)
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleApproveGroup(group._id)}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve Team Activity
                </Button>
                <Button
                  size="sm"
                  color="destructive"
                  onClick={() => handleRejectGroup(group._id)}
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
