"use client";

import { useMutation, useQuery } from "convex/react";
import { UserPlus } from "lucide-react";
import { useCallback } from "react";

import { JoinTeamFormDialog } from "@/components/form/join-team-form";
import { Button } from "@/components/ui/button";
import { tryMutate } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";
import type { TeamCardData } from "./types";

export function JoinTeamButton({
  data,
  demo = false,
}: {
  data: TeamCardData;
  demo?: boolean;
}) {
  const isFull =
    data.team.maxMembers != null && data.memberCount >= data.team.maxMembers;
  const isHidden =
    data.isUserInTeam || data.team.joinPolicy === "closed" || isFull;

  const joinRequest = useQuery(
    api.joinRequests.getUserJoinRequest,
    isHidden || demo ? "skip" : { teamId: data.team._id },
  );
  const cancelRequest = useMutation(api.joinRequests.cancelJoinRequest);

  const handleCancel = useCallback(() => {
    if (joinRequest?.status !== "pending") return;
    void tryMutate({
      fn: () => cancelRequest({ requestId: joinRequest._id }),
      successToast: "Join request cancelled",
      defaultFailureToast: "Failed to cancel join request",
    });
  }, [cancelRequest, joinRequest]);

  if (isHidden) return null;

  if (joinRequest?.status === "pending") {
    return (
      <Button
        variant="outline"
        size="sm"
        className="shadow-sm"
        onClick={handleCancel}
      >
        Cancel Request
      </Button>
    );
  }

  return (
    <JoinTeamFormDialog teamId={data.team._id} teamName={data.team.name}>
      <Button size="sm" variant="grass" className="shadow-sm">
        <UserPlus />
        Request to Join
      </Button>
    </JoinTeamFormDialog>
  );
}
