"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import { tryMutate } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { JoinRequestsListView } from "./join-requests-view";

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
  const acceptRequest = useMutation(api.joinRequests.accept);
  const rejectRequest = useMutation(api.joinRequests.reject);

  const handleRespond = async (
    requestId: Id<"joinRequests">,
    approve: boolean,
  ) => {
    setProcessingId(requestId);

    await tryMutate({
      fn: () =>
        approve ? acceptRequest({ requestId }) : rejectRequest({ requestId }),
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
    <JoinRequestsListView
      requests={requests}
      processingId={processingId}
      onAccept={(id) => handleRespond(id, true)}
      onReject={(id) => handleRespond(id, false)}
      canRespond={canRespond}
    />
  );
}
