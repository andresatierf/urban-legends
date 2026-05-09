"use client";

import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Check, Pencil, Trash2, Trophy, Users, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { DetailsCard } from "@/components/details-card";
import { Badge } from "@/components/ui/badge";
import { useFormattedDate } from "@/hooks/useFormattedDate";
import { tryMutate } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import { UpsertSubmissionFormDialog } from "../form/upsert-submission-form";
import { Button } from "../ui/button";
import { DetailsCardSkeleton } from "../ui/details-card-skeleton";
import { SubmissionImageGallery } from "./display/submission-image-gallery";

interface SubmissionDetailsCardProps {
  data?: FunctionReturnType<typeof api.submissions.getDetails>;
  className?: string;
}

export function SubmissionDetailsCard({
  data,
  className,
}: SubmissionDetailsCardProps) {
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { format } = useFormattedDate();

  const submissionId = data?.submission._id;

  const approveSubmission = useMutation(api.submissions.approve);
  const rejectSubmission = useMutation(api.submissions.reject);
  const removeSubmission = useMutation(api.submissions.remove);

  const handleApprove = useCallback(async () => {
    if (!data) return;
    if (!submissionId) return;

    await tryMutate({
      fn: () => approveSubmission({ submissionId }),
      successToast: "Submission approved successfully",
      defaultFailureToast: "Failed to approve submission",
    });
  }, [approveSubmission, submissionId, data]);

  const handleReject = useCallback(async () => {
    if (!data) return;
    if (!submissionId) return;

    await tryMutate({
      fn: () => rejectSubmission({ submissionId }),
      successToast: "Submission rejected successfully",
      defaultFailureToast: "Failed to reject submission",
    });
  }, [rejectSubmission, submissionId, data]);

  const handleDelete = useCallback(async () => {
    if (!data) return;
    if (!submissionId) return;

    await tryMutate({
      fn: () => removeSubmission({ submissionId }),
      onSuccess: () => {
        navigate({ to: "/submissions" });
      },
      successToast: "Submission deleted successfully",
      defaultFailureToast: "Failed to delete submission",
    });
  }, [removeSubmission, submissionId, navigate, data]);

  const details = useMemo(() => {
    if (!data) return [];

    return [
      {
        key: "Date",
        value: format(data.submission.date, "long"),
      },
      {
        key: "Status",
        value: (
          <Badge
            variant={
              data.submission.state === "approved"
                ? "default"
                : data.submission.state === "rejected"
                  ? "destructive"
                  : data.submission.state === "deleted"
                    ? "secondary"
                    : "outline"
            }
          >
            {data.submission.state}
          </Badge>
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
              to="/teams/$teamId"
              params={{ teamId: data.team._id }}
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
              to="/tournaments/$tournamentId"
              params={{ tournamentId: data.tournament._id }}
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
            ? data.teammates.map((t: { name: string }) => t.name).join(", ")
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
  }, [data, format]);

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
      {data.evidence.length > 0 && (
        <div className="mb-4">
          <SubmissionImageGallery images={data.evidence} layout="grid" />
        </div>
      )}
      <DetailsCard
        title={format(data.submission.date, "full")}
        description={data.submission.description || "No description provided."}
        details={details}
        actions={actions}
        className={className}
      />
    </>
  );
}
