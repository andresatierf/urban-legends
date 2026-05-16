"use client";

import { UserPlus } from "lucide-react";

import { JoinTeamFormDialog } from "@/components/form/join-team-form";
import { Button } from "@/components/ui/button";

import type { TeamCardData } from "./types";

export type JoinTeamRequestState = { _id: string } | null;

type Props = {
  data: TeamCardData;
  joinRequest: JoinTeamRequestState;
  onRequestJoin: (message: string | undefined) => Promise<void> | void;
  onCancelRequest: () => void;
};

export function JoinTeamButton({
  data,
  joinRequest,
  onRequestJoin,
  onCancelRequest,
}: Props) {
  const isFull =
    data.team.maxMembers != null && data.memberCount >= data.team.maxMembers;
  const isHidden = data.isUserInTeam;

  if (isHidden) return null;

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
