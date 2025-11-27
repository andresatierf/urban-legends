"use client";

import { useMutation, useQuery } from "convex/react";
import {
  Check,
  CheckCircle2,
  FileCheck,
  Loader2,
  X,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { SectionHeader } from "@/components/section-header";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useFormattedDate } from "@/hooks/useFormattedDate";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";

export default function ReviewerDashboard() {
  const { user } = useUser();
  const { format } = useFormattedDate();
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
      {items.length === 0 && (
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

      {/* Submissions list */}
      <div className="space-y-4">
        {items.map((item) => {
          if (item.type === "individual") {
            const { submission, team, tournament, submitter } = item;

            return (
              <ReviewCard
                key={item.id}
                teamName={team.name}
                tournamentName={tournament.name}
                subtitle={`Submitted by ${submitter?.name || "Unknown"} on ${format(submission.date, "long")}`}
                badges={[
                  {
                    content: "Individual",
                    className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
                  },
                  {
                    content:
                      submission.tier === "base"
                        ? "Base Tier"
                        : "Advanced Tier",
                    className: cn("font-medium", {
                      "bg-gray-100 text-gray-800 hover:bg-gray-100":
                        submission.tier === "base",
                      "bg-purple-100 text-purple-800 hover:bg-purple-100":
                        submission.tier === "advanced",
                    }),
                  },
                ]}
                onApprove={() => handleApproveIndividual(submission._id)}
                onReject={() => handleRejectIndividual(submission._id)}
              >
                {submission.description && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">
                      {submission.description}
                    </p>
                  </div>
                )}
              </ReviewCard>
            );
          }

          // Group submission
          const { group, team, tournament, submitters } = item;

          return (
            <ReviewCard
              key={item.id}
              teamName={team.name}
              tournamentName={tournament.name}
              subtitle={`Team activity on ${format(group.date, "long")} • ${group.participantCount} / ${group.totalTeamMembers} members participated`}
              badges={[
                {
                  content: "Team Activity",
                  className: "bg-green-100 text-green-800 hover:bg-green-100",
                },
                {
                  content:
                    group.tier === "base" ? "Base Tier" : "Advanced Tier",
                  className: cn({
                    "bg-gray-100 text-gray-800 hover:bg-gray-100":
                      group.tier === "base",
                    "bg-purple-100 text-purple-800 hover:bg-purple-100":
                      group.tier === "advanced",
                  }),
                },
              ]}
              onApprove={() => handleApproveGroup(group._id)}
              onReject={() => handleRejectGroup(group._id)}
            >
              <p className="text-muted-foreground">
                <span className="font-medium">Participants:</span>{" "}
                {submitters.map((s) => s.name).join(", ")}
              </p>
              {group.isTeamExercise ? (
                <p className="flex items-center gap-1 text-green-600 text-sm">
                  <Check className="h-3 w-3" />
                  Qualifies as team exercise (
                  {Math.round(group.participationRate * 100)}% participation)
                </p>
              ) : (
                <p className="flex items-center gap-1 text-red-600 text-sm">
                  <X className="h-3 w-3" />
                  Does not qualify as team exercise (
                  {Math.round(group.participationRate * 100)}% participation)
                </p>
              )}
            </ReviewCard>
          );
        })}
      </div>
    </>
  );
}

type ReviewCardProps = {
  teamName: string;
  tournamentName: string;
  subtitle: string;
  badges: {
    content: string;
    variant?: BadgeProps["variant"];
    className?: string;
  }[];
  children: React.ReactNode;
  onApprove: () => void;
  onReject: () => void;
};

function ReviewCard({
  teamName,
  tournamentName,
  subtitle,
  badges,
  children,
  onApprove,
  onReject,
}: ReviewCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle>{teamName}</CardTitle>
          <CardDescription>
            <p className="text-muted-foreground text-sm">{tournamentName}</p>
            <p className="text-muted-foreground text-sm">{subtitle} </p>
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {badges.map(({ content, variant, className }) => (
            <Badge
              key={content}
              variant={variant}
              className={cn("font-medium", className)}
            >
              {content}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="text-sm">{children}</CardContent>
      <CardFooter className="gap-2">
        <Button size="sm" color="green" onClick={onApprove} className="gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Approve Team Activity
        </Button>
        <Button
          size="sm"
          color="destructive"
          onClick={onReject}
          className="gap-2"
        >
          <XCircle className="h-4 w-4" />
          Reject
        </Button>
      </CardFooter>
    </Card>
  );
}
