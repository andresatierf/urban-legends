import { useMutation, useQuery } from "convex/react";
import { Crown, DoorOpen, Pencil, Trash2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { DetailsCard } from "../details-card";
import { InviteMemberFormDialog } from "../form/invite-member-form";
import { TransferCaptaincyFormDialog } from "../form/transfer-captaincy-form";
import { UpsertTeamFormDialog } from "../form/upsert-team-form";

type Props = {
  team: Doc<"teams">;
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

  const deleteTeam = useMutation(api.teams.remove);
  const leaveTeam = useMutation(api.teams.leaveTeam);

  const userMembership = teamMembers?.find((m) => m.userId === user?._id);
  const isCaptain = userMembership?.role === "captain";

  const details = [
    { key: "tournament", value: tournament?.name || "" },
    { key: "score", value: `${score || 0} pts` },
  ];

  const actions = useMemo(
    () => [
      {
        label: "Invite member",
        onClick: () => setInviteDialogOpen(true),
        icon: UserPlus,
        condition: isCaptain,
        separator: "after" as const,
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
        onClick: () => leaveTeam({ teamId: team?._id }),
        icon: DoorOpen,
        condition: !isCaptain,
      },
      {
        label: "Delete team",
        onClick: () => deleteTeam({ teamId: team?._id }),
        icon: Trash2,
        condition: isCaptain,
        separator: "before" as const,
      },
    ],
    [deleteTeam, leaveTeam, team._id, isCaptain],
  );

  if (team === undefined) return null; // TODO: Add skeleton

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
