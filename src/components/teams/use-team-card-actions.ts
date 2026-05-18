"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback } from "react";
import { toast } from "sonner";

import { tryMutate } from "@/lib/utils";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useUser } from "../../hooks/useUser";
import type { JoinTeamRequestState } from "./card/membership-button";

type TeamCardActions = {
  joinRequest: JoinTeamRequestState;
  onRequestJoin: (message: string | undefined) => Promise<void>;
  onCancelRequest: () => void;
  onAcceptInvitation: () => void;
  onRejectInvitation: () => void;
  onLeave: () => void;
};

export function useTeamCardActions(): (teamId: Id<"teams">) => TeamCardActions {
  const { user } = useUser({ shouldThrow: false });
  const joinRequests = useQuery(
    api.joinRequests.list,
    user ? { userId: user._id, status: "pending" } : "skip",
  );
  const cancelMutation = useMutation(api.joinRequests.cancel);
  const acceptMutation = useMutation(api.joinRequests.accept);
  const rejectMutation = useMutation(api.joinRequests.reject);
  const requestToJoinMutation = useMutation(api.joinRequests.request);
  const leaveTeamMutation = useMutation(api.teams.leaveTeam);

  return useCallback(
    (teamId: Id<"teams">) => {
      const row = joinRequests?.find((r) => r.teamId === teamId) ?? null;
      const joinRequest = row
        ? { _id: row._id, initiator: row.initiator }
        : null;

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
          if (!row) return;
          void tryMutate({
            fn: () => cancelMutation({ requestId: row._id }),
            successToast: "Join request cancelled",
            defaultFailureToast: "Failed to cancel join request",
          });
        },
        onAcceptInvitation: () => {
          if (!row) return;
          void tryMutate({
            fn: () => acceptMutation({ requestId: row._id }),
            successToast: "Invitation accepted! You've joined the team.",
            defaultFailureToast: "Failed to accept invitation",
          });
        },
        onRejectInvitation: () => {
          if (!row) return;
          void tryMutate({
            fn: () => rejectMutation({ requestId: row._id }),
            successToast: "Invitation declined",
            defaultFailureToast: "Failed to decline invitation",
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
    [
      joinRequests,
      cancelMutation,
      acceptMutation,
      rejectMutation,
      requestToJoinMutation,
      leaveTeamMutation,
    ],
  );
}
