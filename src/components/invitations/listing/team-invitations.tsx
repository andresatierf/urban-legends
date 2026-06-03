"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import { tryMutate } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useUser } from "../../../hooks/useUser";
import { InvitationsList } from "./layout";

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
    <InvitationsList
      title="Team Invitations"
      itemLabel={{ singular: "invitation", plural: "invitations" }}
      emptyTitle="No pending invitations"
      emptyDescription="When team captains invite you to join their team, invitations will appear here."
      emptyClassName="gap-3 p-2!"
      loading={invitations === undefined}
      pendingOnly={pendingOnly}
      hidePendingHeader={pendingOnly}
      invitations={(invitations ?? []).map((invitation) => ({
        key: invitation._id,
        invitation: { ...invitation, counterparty: null },
        viewer: "user",
        processing: processingId === invitation._id,
        onAccept: () => handleRespond(invitation._id, true),
        onReject: () => handleRespond(invitation._id, false),
      }))}
    />
  );
}
