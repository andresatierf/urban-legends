"use client";

import { useMutation, useQuery } from "convex/react";
import { UserPlus } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";

import { JoinTeamFormDialog } from "@/components/form/join-team-form";
import { Button } from "@/components/ui/button";
import { tryMutate } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
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

export function JoinTeamButtonContainer({
  data,
  demo = false,
}: {
  data: TeamCardData;
  demo?: boolean;
}) {
  const isHidden = data.isUserInTeam;

  const joinRequests = useQuery(
    api.joinRequests.listUserJoinRequests,
    isHidden || demo ? "skip" : {},
  );
  const joinRequest =
    joinRequests?.find((r) => r.teamId === data.team._id) ?? null;
  const cancelMutation = useMutation(api.joinRequests.cancelJoinRequest);
  const requestToJoinMutation = useMutation(api.joinRequests.requestToJoin);

  const handleCancel = useCallback(() => {
    if (!joinRequest) return;
    void tryMutate({
      fn: () =>
        cancelMutation({ requestId: joinRequest._id as Id<"joinRequests"> }),
      successToast: "Join request cancelled",
      defaultFailureToast: "Failed to cancel join request",
    });
  }, [cancelMutation, joinRequest]);

  const handleRequest = useCallback(
    async (message: string | undefined) => {
      try {
        await requestToJoinMutation({ teamId: data.team._id, message });
        toast("Join request sent successfully!");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to send join request",
        );
        throw error;
      }
    },
    [requestToJoinMutation, data.team._id],
  );

  return (
    <JoinTeamButton
      data={data}
      joinRequest={joinRequest}
      onRequestJoin={handleRequest}
      onCancelRequest={handleCancel}
    />
  );
}
