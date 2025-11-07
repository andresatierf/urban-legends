"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
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
import { RequestCard } from "./request-card";

type Props = {
  teamId: Id<"teams">;
};

export function JoinRequestsList({ teamId }: Props) {
  const [processingId, setProcessingId] = useState<Id<"joinRequests"> | null>(
    null,
  );

  const requests = useQuery(api.teams.listJoinRequests, {
    teamId,
    status: "pending",
  });
  const approveRequest = useMutation(api.teams.approveJoinRequest);
  const rejectRequest = useMutation(api.teams.rejectJoinRequest);

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

  const handleApprove = async (requestId: Id<"joinRequests">) => {
    setProcessingId(requestId);
    try {
      await approveRequest({ requestId });
      toast.success("Join request approved!");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to approve join request",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: Id<"joinRequests">) => {
    setProcessingId(requestId);
    try {
      await rejectRequest({ requestId });
      toast.success("Join request rejected");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to reject join request",
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join Requests</CardTitle>
        <CardDescription>
          {requests.length} pending request{requests.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.length !== 0 ? (
          requests.map((request) => (
            <RequestCard
              key={request._id}
              request={request}
              processing={processingId === request._id}
              onApprove={() => handleApprove(request._id)}
              onReject={() => handleReject(request._id)}
            />
          ))
        ) : (
          <Empty>
            <EmptyTitle>No pending requests</EmptyTitle>
            <EmptyDescription>
              When users request to join your team, they'll appear here.
            </EmptyDescription>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
