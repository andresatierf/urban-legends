"use client";

import { useMutation, useQuery } from "convex/react";
import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Empty } from "../ui/empty";

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
        error instanceof Error ? error.message : "Failed to reject join request",
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
          <CardDescription>Manage requests to join your team</CardDescription>
        </CardHeader>
        <CardContent>
          <Empty
            title="No pending requests"
            description="When users request to join your team, they'll appear here."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join Requests</CardTitle>
        <CardDescription>
          {requests.length} pending request{requests.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((request) => (
          <div
            key={request._id}
            className="flex items-start justify-between rounded-lg border p-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{request.user?.name}</p>
                <Badge variant="secondary">{request.user?.email}</Badge>
              </div>
              {request.message && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {request.message}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Requested {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject(request._id)}
                disabled={processingId === request._id}
              >
                {processingId === request._id ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <X />
                )}
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => handleApprove(request._id)}
                disabled={processingId === request._id}
              >
                {processingId === request._id ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Check />
                )}
                Approve
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
