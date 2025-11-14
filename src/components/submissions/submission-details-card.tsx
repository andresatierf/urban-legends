"use client";

import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { format } from "date-fns";
import { Check, Pencil, Trash2, Trophy, Users, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { DetailsCard } from "@/components/details-card";
import { Badge } from "@/components/ui/badge";
import { api } from "../../../convex/_generated/api";
import { UpsertSubmissionFormDialog } from "../form/upsert-submission-form";
import { Button } from "../ui/button";
import { DetailsCardSkeleton } from "../ui/details-card-skeleton";

interface SubmissionDetailsCardProps {
  data?: FunctionReturnType<typeof api.submissions.getDetails>;
  className?: string;
}

export function SubmissionDetailsCard({
  data,
  className,
}: SubmissionDetailsCardProps) {
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const submissionId = data?.submission._id;

  const approveSubmission = useMutation(api.submissions.approve);
  const rejectSubmission = useMutation(api.submissions.reject);
  const removeSubmission = useMutation(api.submissions.remove);

  const handleApprove = useCallback(async () => {
    if (!data) return;
    if (!submissionId) return;

    try {
      await approveSubmission({ submissionId });
      toast.success("Submission approved successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to approve submission",
      );
    }
  }, [approveSubmission, submissionId, data]);

  const handleReject = useCallback(async () => {
    if (!data) return;
    if (!submissionId) return;

    try {
      await rejectSubmission({ submissionId });
      toast.success("Submission rejected");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reject submission",
      );
    }
  }, [rejectSubmission, submissionId, data]);

  const handleDelete = useCallback(async () => {
    if (!data) return;
    if (!submissionId) return;

    try {
      await removeSubmission({ submissionId });
      toast.success("Submission deleted successfully");
      router.push("/submissions");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete submission",
      );
    }
  }, [removeSubmission, submissionId, router, data]);

  const details = useMemo(() => {
    if (!data) return [];

    return [
      {
        key: "Date",
        value: data.submission.date,
      },
      {
        key: "Status",
        value: (
          <Badge variant={data.submission.state}>{data.submission.state}</Badge>
        ),
      },
      {
        key: "Tier",
        value: (
          <Badge
            variant={
              data.submission.tier === "advanced" ? "default" : "secondary"
            }
          >
            {data.submission.tier}
          </Badge>
        ),
      },
      {
        key: "Exercise Type",
        value: data.isTeamExercise ? "Team Exercise" : "Individual Exercise",
      },
      {
        key: "Points Earned",
        value: `${data.submission.pointsEarned} pts`,
      },
      {
        key: "Team",
        value: data.team ? (
          <Button variant="link" className="p-0" asChild>
            <Link
              href={`/teams/${data.team._id}`}
              className="text-blue-600 hover:underline"
            >
              {data.team.name}
            </Link>
          </Button>
        ) : (
          "Unknown"
        ),
      },
      {
        key: "Tournament",
        value: data.tournament ? (
          <Button variant="link" className="p-0" asChild>
            <Link
              href={`/tournaments/${data.tournament._id}`}
              className="text-blue-600 hover:underline"
            >
              {data.tournament.name}
            </Link>
          </Button>
        ) : (
          "Unknown"
        ),
      },
      {
        key: "Submitted By",
        value: `${data.submitter.name} (${data.submitter.email})`,
      },
      {
        key: "Teammates",
        value:
          data.teammates.length > 0
            ? data.teammates.map((t) => t.name).join(", ")
            : "None",
      },
      ...(data.submission.state !== "pending" && data.managedByUser
        ? [
            {
              key:
                data.submission.state === "approved"
                  ? "Approved By"
                  : data.submission.state === "rejected"
                    ? "Rejected By"
                    : "Deleted By",
              value: `${data.managedByUser.name} (${data.managedByUser.email})`,
            },
          ]
        : []),
    ];
  }, [data]);

  const actions = useMemo(() => {
    if (!data) return [];

    return [
      {
        label: "Approve",
        onClick: handleApprove,
        icon: Check,
        condition: data.canApprove,
        external: true,
      },
      {
        label: "Reject",
        onClick: handleReject,
        icon: X,
        condition: data.canReject,
        external: true,
        separator: "after" as const,
      },
      {
        label: "Edit Submission",
        onClick: () => setEditDialogOpen(true),
        icon: Pencil,
        condition: data.canEdit,
        external: true,
        separator: "after" as const,
      },
      {
        label: "View Team",
        href: `/teams/${data.submission.teamId}`,
        icon: Users,
        condition: true,
      },
      {
        label: "View Tournament",
        href: `/tournaments/${data.submission.tournamentId}`,
        icon: Trophy,
        condition: true,
      },
      {
        label: "Delete Submission",
        onClick: handleDelete,
        icon: Trash2,
        condition: data.canDelete,
        separator: "before" as const,
      },
    ];
  }, [data, handleApprove, handleReject, handleDelete]);

  if (!data) {
    return <DetailsCardSkeleton detailsCount={9} className={className} />;
  }

  return (
    <>
      <UpsertSubmissionFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        submission={data.submission}
      />
      <DetailsCard
        title={format(new Date(data.submission.date), "EEEE, LLLL do, yyyy")}
        description={data.submission.description || "No description provided."}
        details={details}
        actions={actions}
        className={className}
      />
    </>
  );
}
