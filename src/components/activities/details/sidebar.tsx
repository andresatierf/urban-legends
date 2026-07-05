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

import { UpsertActivityFormDialog } from "@/components/activities/form";
import { activityStateBadgeVariant } from "@/components/activities/state";
import { RejectReasonDialog } from "@/components/submissions/reject-reason-dialog";
import { tryMutate } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";
import {
  SidebarCard,
  type SidebarCardAction,
  type SidebarCardBadge,
  type SidebarCardStat,
} from "../../ui/sidebar-card";
import { CreatorCard } from "./creator-card";
import { ReviewTimeline } from "./review-timeline";
import { ScoringCard } from "./scoring-card";
import type { ActivityDetailsData } from "./types";

export function Sidebar({ data }: { data: ActivityDetailsData }) {
  const { activity, team, tournament, creator, managedByUser } = data;
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const approveActivity = useMutation(api.activities.approve);
  const rejectActivity = useMutation(api.activities.reject);
  const removeActivity = useMutation(api.activities.remove);

  const handleApprove = useCallback(() => {
    void tryMutate({
      fn: () => approveActivity({ activityId: activity._id }),
      successToast: "Activity approved successfully",
      defaultFailureToast: "Failed to approve activity",
    });
  }, [approveActivity, activity._id]);

  const handleRejectConfirm = useCallback(
    async (reason: string) => {
      setIsRejecting(true);
      try {
        await tryMutate({
          fn: () =>
            rejectActivity({
              activityId: activity._id,
              reason,
            }),
          successToast: "Activity rejected successfully",
          defaultFailureToast: "Failed to reject activity",
        });
      } finally {
        setIsRejecting(false);
        setRejectDialogOpen(false);
      }
    },
    [rejectActivity, activity._id],
  );

  const handleDelete = useCallback(() => {
    void tryMutate({
      fn: () => removeActivity({ activityId: activity._id }),
      onSuccess: () => {
        navigate({ to: "/activities" });
      },
      successToast: "Activity deleted successfully",
      defaultFailureToast: "Failed to delete activity",
    });
  }, [removeActivity, activity._id, navigate]);

  const isTeamExercise = activity.isTeamExercise;
  const headlineTitle = isTeamExercise
    ? team.name
    : (creator?.name ?? team.name);
  const headlineIcon = isTeamExercise ? Users : User;

  const badges: SidebarCardBadge[] = [
    {
      label: activity.state,
      variant: activityStateBadgeVariant(activity.state),
    },
    {
      label: activity.tier,
      variant: activity.tier === "advanced" ? "social" : "info",
    },
    ...(isTeamExercise
      ? [
          {
            label: "Team",
            variant: "neutral" as const,
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
      onClick: () => setRejectDialogOpen(true),
    });
  }
  if (data.canEdit) {
    actions.push({
      label: activity.state === "rejected" ? "Resubmit" : "Edit",
      icon: activity.state === "rejected" ? RefreshCw : Pencil,
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
    { label: "Points", value: `${activity.pointsEarned}` },
    { label: "Evidence", value: `${data.evidence.length}` },
    { label: "Players", value: `${activity.participantCount}` },
    { label: "Tier", value: activity.tier },
  ];

  return (
    <>
      {data.canEdit && (
        <UpsertActivityFormDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          activity={activity}
          initialEvidence={data.evidence}
        />
      )}

      <RejectReasonDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={handleRejectConfirm}
        isSubmitting={isRejecting}
      />

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

        <ReviewTimeline activity={activity} managedByUser={managedByUser} />
      </SidebarCard>

      <ScoringCard activity={activity} tournament={tournament} />

      {isTeamExercise && creator && <CreatorCard creator={creator} />}
    </>
  );
}
