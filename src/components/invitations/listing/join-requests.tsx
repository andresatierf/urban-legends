"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import { tryMutate } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { InvitationsList } from "./layout";

type Props = {
  teamId: Id<"teams">;
  canRespond?: boolean;
};

export function JoinRequestsList({ teamId, canRespond = true }: Props) {
  const [processingId, setProcessingId] = useState<Id<"joinRequests"> | null>(
    null,
  );

  const requests = useQuery(api.joinRequests.list, {
    teamId,
    initiator: "user",
  });
  const respondToRequest = useMutation(api.joinRequests.respondToJoinRequest);

  const handleRespond = async (
    requestId: Id<"joinRequests">,
    approve: boolean,
  ) => {
    setProcessingId(requestId);

    await tryMutate({
      fn: () => respondToRequest({ requestId, approve }),
      onFinally: () => setProcessingId(null),
      successToast: approve
        ? "Join request approved!"
        : "Join request rejected",
      defaultFailureToast: approve
        ? "Failed to approve join request"
        : "Failed to reject join request",
    });
  };

  return (
    <InvitationsList
      title="Join Requests"
      itemLabel={{ singular: "request", plural: "requests" }}
      emptyTitle="No pending requests"
      emptyDescription="When users request to join your team, they'll appear here."
      loading={requests === undefined}
      invitations={(requests ?? []).map((request) => ({
        key: request._id,
        invitation: { ...request, counterparty: request.user },
        viewer: "team",
        processing: processingId === request._id,
        canRespond,
        onAccept: canRespond
          ? () => handleRespond(request._id, true)
          : undefined,
        onReject: canRespond
          ? () => handleRespond(request._id, false)
          : undefined,
      }))}
    />
  );
}
