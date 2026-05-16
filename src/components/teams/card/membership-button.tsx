"use client";

import { LogOut, UserPlus } from "lucide-react";

import { JoinTeamFormDialog } from "@/components/teams/form";
import { Button } from "@/components/ui/button";

import type { TeamCardData } from "./types";

export type JoinTeamRequestState = { _id: string } | null;

type Props = {
  data: TeamCardData;
  joinRequest: JoinTeamRequestState;
  onRequestJoin: (message: string | undefined) => Promise<void> | void;
  onCancelRequest: () => void;
  onLeave: () => void;
};

export function MembershipButton({
  data,
  joinRequest,
  onRequestJoin,
  onCancelRequest,
  onLeave,
}: Props) {
  if (data.isUserMember) {
    const canLeave =
      data.userRole === "member" ||
      (data.userRole === "captain" && data.memberCount === 1);
    if (!canLeave) return null;

    return (
      <Button
        variant="destructive"
        size="sm"
        className="shadow-sm"
        onClick={onLeave}
      >
        <LogOut className="size-3.5" />
        Leave
      </Button>
    );
  }

  if (data.isUserInTeam) return null;

  if (joinRequest) {
    return (
      <Button
        variant="secondary"
        size="sm"
        className="shadow-sm"
        onClick={onCancelRequest}
      >
        Cancel Request
      </Button>
    );
  }

  const isFull =
    data.team.maxMembers != null && data.memberCount >= data.team.maxMembers;
  if (isFull) {
    return (
      <Button variant="destructive" size="sm" className="shadow-sm" disabled>
        Full
      </Button>
    );
  }

  if (data.team.joinPolicy === "closed") {
    return (
      <Button variant="destructive" size="sm" className="shadow-sm" disabled>
        Closed to Invitations
      </Button>
    );
  }

  return (
    <JoinTeamFormDialog
      teamName={data.team.name}
      onSubmit={({ message }) => onRequestJoin(message)}
    >
      <Button size="sm" variant="grass" className="shadow-sm">
        <UserPlus />
        Request to Join
      </Button>
    </JoinTeamFormDialog>
  );
}
