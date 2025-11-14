"use client";

import { useMutation, useQuery } from "convex/react";
import {
  ChartArea,
  Crown,
  DoorOpen,
  Pencil,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { DetailsCard } from "../details-card";
import { InviteMemberFormDialog } from "../form/invite-member-form";
import { TransferCaptaincyFormDialog } from "../form/transfer-captaincy-form";
import { UpsertTeamFormDialog } from "../form/upsert-team-form";
import { DetailsCardSkeleton } from "../ui/details-card-skeleton";

type Props = {
  team?: Doc<"teams">;
  score?: number;
  className?: string;
};

export function TeamDetailsCard({ team, score, className }: Props) {
  const { user } = useUser();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editTeamDialogOpen, setEditTeamDialogOpen] = useState(false);
  const [transferCaptaincyDialogOpen, setTransferCaptaincyDialogOpen] =
    useState(false);

  const tournament = useQuery(
    api.tournaments.get,
    team ? { tournamentId: team.tournamentId } : "skip",
  );
  const teamMembers = useQuery(
    api.teams.listMembers,
    team ? { teamIds: team._id } : "skip",
  );

  const deleteTeam = useMutation(api.teams.removeUserTeam);
  const leaveTeam = useMutation(api.teams.leaveTeam);

  const userMembership = teamMembers?.find((m) => m.userId === user?._id);
  const isCaptain = userMembership?.role === "captain";

  const handleDeleteTeam = useCallback(async () => {
    if (!team) return;

    try {
      await deleteTeam({ teamId: team._id });
      toast.success("Team deleted successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete team",
      );
    }
  }, [deleteTeam, team]);

  const handleLeaveTeam = useCallback(async () => {
    if (!team) return;

    try {
      await leaveTeam({ teamId: team._id });
      toast.success("Successfully left the team");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to leave team",
      );
    }
  }, [leaveTeam, team]);

  const details = useMemo(() => {
    if (!team) return [];

    return [
      { key: "tournament", value: tournament?.name || "" },
      { key: "score", value: `${score || 0} pts` },
    ];
  }, [score, tournament, team]);

  const actions = useMemo(() => {
    if (!team) return [];

    return [
      {
        label: "View statistics",
        href: `/teams/${team._id}/statistics`,
        icon: ChartArea,
        condition: true,
        separator: "after" as const,
        external: true,
      },
      {
        label: "Invite member",
        onClick: () => setInviteDialogOpen(true),
        icon: UserPlus,
        condition: isCaptain,
      },
      {
        label: "Edit team",
        onClick: () => setEditTeamDialogOpen(true),
        icon: Pencil,
        condition: isCaptain,
      },
      {
        label: "Transfer captaincy",
        onClick: () => setTransferCaptaincyDialogOpen(true),
        icon: Crown,
        condition: isCaptain,
      },
      {
        label: "Leave team",
        onClick: handleLeaveTeam,
        icon: DoorOpen,
        condition: !isCaptain,
      },
      {
        label: "Delete team",
        onClick: handleDeleteTeam,
        icon: Trash2,
        condition: isCaptain,
        separator: "before" as const,
      },
    ];
  }, [handleDeleteTeam, handleLeaveTeam, isCaptain, team]);

  if (!team) {
    return <DetailsCardSkeleton detailsCount={2} className={className} />;
  }

  return (
    <div>
      <InviteMemberFormDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        teamId={team._id}
        tournamentId={team.tournamentId}
      />
      <UpsertTeamFormDialog
        open={editTeamDialogOpen}
        onOpenChange={setEditTeamDialogOpen}
        tournamentId={team.tournamentId}
        team={team}
      />
      <TransferCaptaincyFormDialog
        open={transferCaptaincyDialogOpen}
        onOpenChange={setTransferCaptaincyDialogOpen}
        teamId={team._id}
      />
      <DetailsCard
        title={team.name}
        details={details}
        actions={actions}
        className={className}
      />
    </div>
  );
}
