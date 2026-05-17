"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import { tryMutate } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useUser } from "../../../hooks/useUser";
import { TeamInvitationsListView } from "./team-invitations-view";

export function TeamInvitationsList({
  pendingOnly,
}: {
  pendingOnly?: boolean;
}) {
  const [processingId, setProcessingId] = useState<Id<"joinRequests"> | null>(
    null,
  );

  const { user } = useUser({ shouldThrow: false });
  const invitations = useQuery(
    api.joinRequests.list,
    user ? { userId: user._id, initiator: "team" } : "skip",
  );
  const acceptInvitation = useMutation(api.joinRequests.accept);
  const rejectInvitation = useMutation(api.joinRequests.reject);

  const handleRespond = async (
    invitationId: Id<"joinRequests">,
    accept: boolean,
  ) => {
    setProcessingId(invitationId);

    await tryMutate({
      fn: () =>
        accept
          ? acceptInvitation({ requestId: invitationId })
          : rejectInvitation({ requestId: invitationId }),
      onFinally: () => setProcessingId(null),
      successToast: accept
        ? "Invitation accepted! You've joined the team."
        : "Invitation declined",
      defaultFailureToast: accept
        ? "Failed to accept invitation"
        : "Failed to decline invitation",
    });
  };

  return (
    <TeamInvitationsListView
      invitations={invitations}
      processingId={processingId}
      onAccept={(id) => handleRespond(id, true)}
      onReject={(id) => handleRespond(id, false)}
      pendingOnly={pendingOnly}
    />
  );
}
