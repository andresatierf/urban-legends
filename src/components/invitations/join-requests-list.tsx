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
import { JoinRequestCard } from "./join-request-card";

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

  const pendindRequests = requests.filter((req) => req.status === "pending");
  const otherRequests = requests.filter((req) => req.status !== "pending");

  const handleApprove = async (requestId: Id<"joinRequests">) => {
    setProcessingId(requestId);
    try {
      await respondToRequest({ requestId, approve: true });
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
      await respondToRequest({ requestId, approve: false });
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
          {pendindRequests.length} pending request
          {pendindRequests.length !== 1 ? "s" : ""}
          {otherRequests.length > 0 &&
            ` · ${otherRequests.length} past request${otherRequests.length !== 1 ? "s" : ""}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendindRequests.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Pending Requests</h3>
            {pendindRequests.map((request) => (
              <JoinRequestCard
                key={request._id}
                request={request}
                processing={processingId === request._id}
                onApprove={() => handleApprove(request._id)}
                onReject={() => handleReject(request._id)}
              />
            ))}
          </div>
        )}

        {otherRequests.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Past Requests</h3>
            {otherRequests.map((request) => (
              <JoinRequestCard
                key={request._id}
                request={request}
                processing={processingId === request._id}
                onApprove={() => handleApprove(request._id)}
                onReject={() => handleReject(request._id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
