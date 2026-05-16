"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import { tryMutate } from "@/lib/utils";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "../ui/empty";
import { InvitationCard } from "./invitation-card";

type Props = {
  teamId: Id<"teams">;
};

export function JoinRequestsList({ teamId }: Props) {
  const [processingId, setProcessingId] = useState<Id<"joinRequests"> | null>(
    null,
  );

  const requests = useQuery(api.joinRequests.listJoinRequests, {
    teamId,
  });
  const respondToRequest = useMutation(api.joinRequests.respondToJoinRequest);

  if (requests === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Join Requests</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const pendingRequests = requests.filter((req) => req.status === "pending");
  const otherRequests = requests.filter((req) => req.status !== "pending");

  const handleApprove = async (requestId: Id<"joinRequests">) => {
    setProcessingId(requestId);

    await tryMutate({
      fn: () => respondToRequest({ requestId, approve: true }),
      onFinally: () => setProcessingId(null),
      successToast: "Join request approved!",
      defaultFailureToast: "Failed to approve join request",
    });
  };

  const handleReject = async (requestId: Id<"joinRequests">) => {
    setProcessingId(requestId);

    await tryMutate({
      fn: () => respondToRequest({ requestId, approve: false }),
      onFinally: () => setProcessingId(null),
      successToast: "Join request rejected",
      defaultFailureToast: "Failed to reject join request",
    });
  };

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Join Requests</CardTitle>
          <CardDescription>No pending requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyTitle>No pending requests</EmptyTitle>
            <EmptyDescription>
              When users request to join your team, they'll appear here.
            </EmptyDescription>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join Requests</CardTitle>
        <CardDescription>
          {pendingRequests.length} pending request
          {pendingRequests.length !== 1 ? "s" : ""}
          {otherRequests.length > 0 &&
            ` · ${otherRequests.length} past request${otherRequests.length !== 1 ? "s" : ""}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingRequests.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Pending Requests</h3>
            {pendingRequests.map((request) => (
              <InvitationCard
                key={request._id}
                invitation={{ ...request, counterparty: request.user }}
                viewer="team"
                processing={processingId === request._id}
                onAccept={() => handleApprove(request._id)}
                onReject={() => handleReject(request._id)}
              />
            ))}
          </div>
        )}

        {otherRequests.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Past Requests</h3>
            {otherRequests.map((request) => (
              <InvitationCard
                key={request._id}
                invitation={{ ...request, counterparty: request.user }}
                viewer="team"
                className="bg-muted/50"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
