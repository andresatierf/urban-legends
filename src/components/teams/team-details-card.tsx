import { useMutation, useQuery } from "convex/react";
import { Crown, DoorOpen, Trash2Icon, UserPlus } from "lucide-react";
import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { DetailsCard } from "../details-card";
import { InviteMemberFormDialog } from "../form/invite-member-form";
import { TransferCaptaincyFormDialog } from "../form/transfer-captaincy-form";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";

type Props = {
  team: Doc<"teams">;
  tournament: Doc<"tournaments">;
  score: number;
  enableActions?: boolean;
  className?: string;
};

export function TeamDetailsCard({
  team,
  tournament,
  score,
  enableActions,
  className,
}: Props) {
  const { user, isAdmin } = useUser();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [transferCaptaincyDialogOpen, setTransferCaptaincyDialogOpen] =
    useState(false);

  const teamMembers = useQuery(
    api.teams.listMembers,
    team ? { teamIds: team._id } : "skip",
  );

  const deleteTeam = useMutation(api.teams.remove);
  const leaveTeam = useMutation(api.teams.leaveTeam);
  const transferCaptaincy = useMutation(api.teams.transferCaptaincy);

  const userMembership = teamMembers?.find((m) => m.userId === user?._id);
  const isCaptain = userMembership?.role === "captain";
  const canInviteMembers = isAdmin || isCaptain;

  if (!team) return null; // TODO: Add skeleton

  const details = [
    { key: "tournament", value: tournament.name },
    { key: "score", value: `${score || 0} pts` },
  ];

  return (
    <div>
      <InviteMemberFormDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        teamId={team._id}
        tournamentId={team.tournamentId}
      />
      <TransferCaptaincyFormDialog
        open={transferCaptaincyDialogOpen}
        onOpenChange={setTransferCaptaincyDialogOpen}
        teamId={team._id}
      />
      <DetailsCard title={team.name} details={details} className={className}>
        {canInviteMembers && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => setInviteDialogOpen(true)}>
                <UserPlus />
                Invite Member
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuGroup>
          {isCaptain && (
            <DropdownMenuItem
              onSelect={() => setTransferCaptaincyDialogOpen(true)}
            >
              <Crown />
              Transfer captaincy
            </DropdownMenuItem>
          )}
          {!isCaptain && (
            <DropdownMenuItem onSelect={() => leaveTeam({ teamId: team._id })}>
              <DoorOpen />
              Leave Team
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        {isCaptain && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={() => deleteTeam({ teamId: team._id })}
              >
                <Trash2Icon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DetailsCard>
    </div>
  );
}
