import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import {
  Check,
  ChevronRight,
  Pencil,
  RefreshCw,
  Trash2,
  Trophy,
  User,
  Users,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";

import { tryMutate } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";
import { UpsertSubmissionFormDialog } from "../../form/upsert-submission-form";
import {
  SidebarCard,
  type SidebarCardAction,
  type SidebarCardBadge,
  type SidebarCardStat,
} from "../../ui/sidebar-card";
import { stateBadgeVariant } from "../review/submission-review-card-shared";
import { ReviewTimeline } from "./review-timeline";
import { ScoringCard } from "./scoring-card";
import { SubmitterCard } from "./submitter-card";
import type { SubmissionDetailsData } from "./types";

export function Sidebar({ data }: { data: SubmissionDetailsData }) {
  const { submission, team, tournament, submitter, teammates, managedByUser } =
    data;
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const approveSubmission = useMutation(api.submissions.approve);
  const rejectSubmission = useMutation(api.submissions.reject);
  const removeSubmission = useMutation(api.submissions.remove);

  const handleApprove = useCallback(() => {
    void tryMutate({
      fn: () => approveSubmission({ submissionId: submission._id }),
      successToast: "Submission approved successfully",
      defaultFailureToast: "Failed to approve submission",
    });
  }, [approveSubmission, submission._id]);

  const handleReject = useCallback(() => {
    void tryMutate({
      fn: () => rejectSubmission({ submissionId: submission._id }),
      successToast: "Submission rejected successfully",
      defaultFailureToast: "Failed to reject submission",
    });
  }, [rejectSubmission, submission._id]);

  const handleDelete = useCallback(() => {
    void tryMutate({
      fn: () => removeSubmission({ submissionId: submission._id }),
      onSuccess: () => {
        navigate({ to: "/submissions" });
      },
      successToast: "Submission deleted successfully",
      defaultFailureToast: "Failed to delete submission",
    });
  }, [removeSubmission, submission._id, navigate]);

  const isTeamSubmission = submission.submissionType === "team";
  const headlineTitle = isTeamSubmission ? team.name : submitter.name;
  const headlineIcon = isTeamSubmission ? Users : User;

  const badges: SidebarCardBadge[] = [
    { label: submission.state, variant: stateBadgeVariant(submission.state) },
    {
      label: submission.tier,
      variant: submission.tier === "advanced" ? "default" : "secondary",
    },
    ...(isTeamSubmission
      ? [
          {
            label: "Team",
            variant: "outline" as const,
            icon: Users,
          },
        ]
      : []),
  ];

  const actions: SidebarCardAction[] = [];
  if (data.canApprove) {
    actions.push({
      label: "Approve",
      icon: Check,
      variant: "default",
      onClick: handleApprove,
    });
  }
  if (data.canReject) {
    actions.push({
      label: "Reject",
      icon: X,
      variant: "destructive",
      onClick: handleReject,
    });
  }
  if (data.canEdit) {
    actions.push({
      label: submission.state === "rejected" ? "Resubmit" : "Edit",
      icon: submission.state === "rejected" ? RefreshCw : Pencil,
      onClick: () => setEditDialogOpen(true),
    });
  }
  if (data.canDelete) {
    actions.push({
      label: "Delete",
      icon: Trash2,
      variant: "outline",
      onClick: handleDelete,
    });
  }

  const stats: SidebarCardStat[] = [
    { label: "Points", value: `${submission.pointsEarned}` },
    { label: "Evidence", value: `${data.evidence.length}` },
    { label: "Players", value: `${1 + teammates.length}` },
    { label: "Tier", value: submission.tier },
  ];

  return (
    <>
      <div className="hidden">
        {data.canEdit && (
          <UpsertSubmissionFormDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            submission={submission}
          />
        )}
      </div>

      <SidebarCard
        icon={headlineIcon}
        badges={badges}
        title={headlineTitle}
        stats={stats}
        actions={actions.length > 0 ? actions : undefined}
      >
        <div className="text-muted-foreground space-y-1 text-xs">
          <Link
            to="/teams/$teamId"
            params={{ teamId: team._id }}
            className="hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 truncate">{team.name}</span>
            <ChevronRight className="h-3 w-3 shrink-0" />
          </Link>
          <Link
            to="/tournaments/$tournamentId"
            params={{ tournamentId: tournament._id }}
            className="hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            <Trophy className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 truncate">{tournament.name}</span>
            <ChevronRight className="h-3 w-3 shrink-0" />
          </Link>
        </div>

        <ReviewTimeline submission={submission} managedByUser={managedByUser} />
      </SidebarCard>

      <ScoringCard submission={submission} tournament={tournament} />

      {isTeamSubmission && <SubmitterCard submitter={submitter} />}
    </>
  );
}
