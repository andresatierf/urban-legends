"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import { tryMutate } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { InvitationsList } from "./layout";

type Props = {
  teamId: Id<"teams">;
  canCancel: boolean;
};

export function InvitedUsersList({ teamId, canCancel }: Props) {
  const [processingId, setProcessingId] = useState<Id<"joinRequests"> | null>(
    null,
  );

  const invitations = useQuery(api.joinRequests.list, {
    teamId,
    initiator: "team",
  });
  const cancelInvitation = useMutation(api.joinRequests.cancel);

  const handleCancelInvitation = async (invitationId: Id<"joinRequests">) => {
    setProcessingId(invitationId);
    await tryMutate({
      fn: () => cancelInvitation({ requestId: invitationId }),
      onFinally: () => setProcessingId(null),
      successToast: "Invitation cancelled",
      defaultFailureToast: "Failed to cancel invitation",
    });
  };

  return (
    <InvitationsList
      title="Invited Users"
      itemLabel={{ singular: "invitation", plural: "invitations" }}
      emptyTitle="No invitations sent"
      emptyDescription={`Use the "Invite Member" button to invite users to join your team.`}
      loading={invitations === undefined}
      invitations={(invitations ?? []).map((invitation) => ({
        key: invitation._id,
        invitation: { ...invitation, counterparty: invitation.user },
        viewer: "team",
        processing: processingId === invitation._id,
        onReject: () => handleCancelInvitation(invitation._id),
        canRespond: canCancel,
      }))}
    />
  );
}
