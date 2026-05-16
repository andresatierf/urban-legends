"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback } from "react";
import { toast } from "sonner";

import { tryMutate } from "@/lib/utils";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { JoinTeamRequestState } from "./card/join-team-button";

type TeamCardActions = {
  joinRequest: JoinTeamRequestState;
  onRequestJoin: (message: string | undefined) => Promise<void>;
  onCancelRequest: () => void;
  onLeave: () => void;
};

export function useTeamCardActions(): (teamId: Id<"teams">) => TeamCardActions {
  const joinRequests = useQuery(api.joinRequests.listUserJoinRequests, {});
  const cancelMutation = useMutation(api.joinRequests.cancelJoinRequest);
  const requestToJoinMutation = useMutation(api.joinRequests.requestToJoin);
  const leaveTeamMutation = useMutation(api.teams.leaveTeam);

  return useCallback(
    (teamId: Id<"teams">) => {
      const joinRequest =
        joinRequests?.find((r) => r.teamId === teamId) ?? null;

      return {
        joinRequest,
        onRequestJoin: async (message: string | undefined) => {
          try {
            await requestToJoinMutation({ teamId, message });
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
        onCancelRequest: () => {
          if (!joinRequest) return;
          void tryMutate({
            fn: () =>
              cancelMutation({
                requestId: joinRequest._id as Id<"joinRequests">,
              }),
            successToast: "Join request cancelled",
            defaultFailureToast: "Failed to cancel join request",
          });
        },
        onLeave: () => {
          void tryMutate({
            fn: () => leaveTeamMutation({ teamId }),
            successToast: "Successfully left the team",
            defaultFailureToast: "Failed to leave team",
          });
        },
      };
    },
    [joinRequests, cancelMutation, requestToJoinMutation, leaveTeamMutation],
  );
}
