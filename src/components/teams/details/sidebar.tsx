import { linkOptions } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import {
  Crown,
  DoorOpen,
  Pencil,
  Shield,
  Trash2,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { useCallback, useState } from "react";

import { InviteMemberFormDialog } from "@/components/form/invite-member-form";
import { TransferCaptaincyFormDialog } from "@/components/form/transfer-captaincy-form";
import { UpsertTeamFormDialog } from "@/components/form/upsert-team-form";
import { tryMutate } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";
import {
  SidebarCard,
  type SidebarCardAction,
  type SidebarCardBadge,
  type SidebarCardStat,
} from "../../ui/sidebar-card";
import { PerformanceCard } from "./performance-card";
import type { TeamDetails } from "./types";

export function Sidebar({ data }: { data: TeamDetails }) {
  const { team, tournament, statistics, userMembership } = data;
  const isFull =
    team.maxMembers != null && statistics.memberCount >= team.maxMembers;

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editTeamDialogOpen, setEditTeamDialogOpen] = useState(false);
  const [transferCaptaincyDialogOpen, setTransferCaptaincyDialogOpen] =
    useState(false);

  const deleteTeam = useMutation(api.teams.removeUserTeam);
  const leaveTeam = useMutation(api.teams.leaveTeam);

  const handleDeleteTeam = useCallback(() => {
    void tryMutate({
      fn: () => deleteTeam({ teamId: team._id }),
      successToast: "Team deleted successfully",
      defaultFailureToast: "Failed to delete team",
    });
  }, [deleteTeam, team._id]);

  const handleLeaveTeam = useCallback(() => {
    void tryMutate({
      fn: () => leaveTeam({ teamId: team._id }),
      successToast: "Successfully left the team",
      defaultFailureToast: "Failed to leave team",
    });
  }, [leaveTeam, team._id]);

  const badges: SidebarCardBadge[] = [
    isFull
      ? { label: "Full", variant: "error" }
      : {
          label: team.joinPolicy === "open" ? "Open" : "Closed",
          variant: team.joinPolicy === "open" ? "success" : "neutral",
        },
  ];
  if (userMembership) {
    badges.push({
      label: userMembership.role,
      variant: "warning",
      icon: Shield,
    });
  }

  const stats: SidebarCardStat[] = [
    { label: "Points", value: String(statistics.points) },
    {
      label: "Members",
      value: `${statistics.memberCount}${team.maxMembers ? `/${team.maxMembers}` : ""}`,
    },
    { label: "Submissions", value: String(statistics.submissionCount) },
    {
      label: "Approval",
      value: `${(statistics.approvalRate * 100).toFixed(0)}%`,
    },
  ];

  const actions: SidebarCardAction[] = [];
  if (data.canInvite) {
    actions.push({
      label: "Invite Member",
      icon: UserPlus,
      onClick: () => setInviteDialogOpen(true),
    });
  }
  if (data.canEdit) {
    actions.push({
      label: "Edit Team",
      icon: Pencil,
      onClick: () => setEditTeamDialogOpen(true),
    });
  }
  if (data.canTransferCaptaincy) {
    actions.push({
      label: "Transfer Captaincy",
      icon: Crown,
      onClick: () => setTransferCaptaincyDialogOpen(true),
    });
  }
  if (data.canLeave) {
    actions.push({
      label: "Leave Team",
      icon: DoorOpen,
      onClick: handleLeaveTeam,
    });
  }
  if (data.canDelete) {
    actions.push({
      label: "Delete Team",
      icon: Trash2,
      variant: "destructive",
      onClick: handleDeleteTeam,
    });
  }

  return (
    <>
      {data.canInvite && (
        <InviteMemberFormDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          teamId={team._id}
        />
      )}
      {data.canEdit && (
        <UpsertTeamFormDialog
          open={editTeamDialogOpen}
          onOpenChange={setEditTeamDialogOpen}
          tournamentId={team.tournamentId}
          team={team}
        />
      )}
      {data.canTransferCaptaincy && (
        <TransferCaptaincyFormDialog
          open={transferCaptaincyDialogOpen}
          onOpenChange={setTransferCaptaincyDialogOpen}
          teamId={team._id}
          isViewerCaptain={userMembership?.role === "captain"}
        />
      )}

      <SidebarCard
        icon={Users}
        badges={badges}
        title={team.name}
        description={tournament?.name}
        descriptionIcon={Trophy}
        descriptionLink={
          tournament
            ? linkOptions({
                to: "/tournaments/$tournamentId",
                params: { tournamentId: team.tournamentId },
              })
            : undefined
        }
        stats={stats}
        actions={actions}
      />

      <PerformanceCard teamId={team._id} />
    </>
  );
}
