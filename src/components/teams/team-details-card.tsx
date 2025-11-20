"use client";

import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  ChartArea,
  Crown,
  DoorOpen,
  Pencil,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { tryMutate } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import { DetailsCard } from "../details-card";
import { InviteMemberFormDialog } from "../form/invite-member-form";
import { TransferCaptaincyFormDialog } from "../form/transfer-captaincy-form";
import { UpsertTeamFormDialog } from "../form/upsert-team-form";
import { DetailsCardSkeleton } from "../ui/details-card-skeleton";

interface TeamDetailsCardProps {
  data?: FunctionReturnType<typeof api.teams.getDetails>;
  className?: string;
}

export function TeamDetailsCard({ data, className }: TeamDetailsCardProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editTeamDialogOpen, setEditTeamDialogOpen] = useState(false);
  const [transferCaptaincyDialogOpen, setTransferCaptaincyDialogOpen] =
    useState(false);

  const deleteTeam = useMutation(api.teams.removeUserTeam);
  const leaveTeam = useMutation(api.teams.leaveTeam);

  const handleDeleteTeam = useCallback(async () => {
    if (!data) return;

    await tryMutate({
      fn: () => deleteTeam({ teamId: data.team._id }),
      successToast: "Team deleted successfully",
      defaultFailureToast: "Failed to delete team",
    });
  }, [deleteTeam, data]);

  const handleLeaveTeam = useCallback(async () => {
    if (!data) return;

    await tryMutate({
      fn: () => leaveTeam({ teamId: data.team._id }),
      successToast: "Successfully left the team",
      defaultFailureToast: "Failed to leave team",
    });
  }, [leaveTeam, data]);

  const details = useMemo(() => {
    if (!data) return [];

    const baseDetails = [
      { key: "tournament", value: data.tournament?.name || "Unknown" },
      { key: "score", value: `${data.statistics.points} pts` },
      { key: "members", value: `${data.statistics.memberCount}` },
      { key: "submissions", value: `${data.statistics.submissionCount}` },
      {
        key: "approval rate",
        value: `${(data.statistics.approvalRate * 100).toFixed(1)}%`,
      },
    ];

    if (data.captain) {
      baseDetails.push({
        key: "captain",
        value: data.captain.name,
      });
    }

    return baseDetails;
  }, [data]);

  const actions = useMemo(() => {
    if (!data) return [];

    return [
      {
        label: "View statistics",
        href: `/teams/${data.team._id}/statistics`,
        icon: ChartArea,
        condition: true,
        separator: "after" as const,
        external: true,
      },
      {
        label: "Invite member",
        onClick: () => setInviteDialogOpen(true),
        icon: UserPlus,
        condition: data.canInvite,
      },
      {
        label: "Edit team",
        onClick: () => setEditTeamDialogOpen(true),
        icon: Pencil,
        condition: data.canEdit,
      },
      {
        label: "Transfer captaincy",
        onClick: () => setTransferCaptaincyDialogOpen(true),
        icon: Crown,
        condition: data.canTransferCaptaincy,
      },
      {
        label: "Leave team",
        onClick: handleLeaveTeam,
        icon: DoorOpen,
        condition: data.canLeave,
      },
      {
        label: "Delete team",
        onClick: handleDeleteTeam,
        icon: Trash2,
        condition: data.canDelete,
        separator: "before" as const,
      },
    ];
  }, [data, handleDeleteTeam, handleLeaveTeam]);

  if (!data) {
    return <DetailsCardSkeleton detailsCount={2} className={className} />;
  }

  return (
    <div>
      {data.canInvite && (
        <InviteMemberFormDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          teamId={data.team._id}
        />
      )}
      {data.canEdit && (
        <UpsertTeamFormDialog
          open={editTeamDialogOpen}
          onOpenChange={setEditTeamDialogOpen}
          tournamentId={data.team.tournamentId}
          team={data.team}
        />
      )}
      {data.canTransferCaptaincy && (
        <TransferCaptaincyFormDialog
          open={transferCaptaincyDialogOpen}
          onOpenChange={setTransferCaptaincyDialogOpen}
          teamId={data.team._id}
        />
      )}
      <DetailsCard
        title={data.team.name}
        details={details}
        actions={actions}
        className={className}
      />
    </div>
  );
}
