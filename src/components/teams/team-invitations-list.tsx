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

export function TeamInvitationsList() {
  const [processingId, setProcessingId] = useState<
    Id<"teamInvitations"> | null
  >(null);

  const invitations = useQuery(api.teams.listUserInvitations, {
    status: "pending",
  });
  const respondToInvitation = useMutation(api.teams.respondToInvitation);

  if (invitations === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Invitations</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleAccept = async (invitationId: Id<"teamInvitations">) => {
    setProcessingId(invitationId);
    try {
      await respondToInvitation({ invitationId, accept: true });
      toast.success("Invitation accepted! You've joined the team.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to accept invitation",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (invitationId: Id<"teamInvitations">) => {
    setProcessingId(invitationId);
    try {
      await respondToInvitation({ invitationId, accept: false });
      toast.success("Invitation declined");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to decline invitation",
      );
    } finally {
      setProcessingId(null);
    }
  };

  if (invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Invitations</CardTitle>
          <CardDescription>View your pending team invitations</CardDescription>
        </CardHeader>
        <CardContent>
          <Empty
            title="No pending invitations"
            description="When team captains invite you to join their team, invitations will appear here."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Invitations</CardTitle>
        <CardDescription>
          {invitations.length} pending invitation{invitations.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {invitations.map((invitation) => {
          const isExpired =
            new Date(invitation.expiresAt) < new Date();

          return (
            <div
              key={invitation._id}
              className="flex items-start justify-between rounded-lg border p-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{invitation.team?.name}</p>
                  <Badge variant="secondary">
                    {invitation.tournament?.name}
                  </Badge>
                  {isExpired && <Badge variant="destructive">Expired</Badge>}
                </div>
                <p className="mt-1 text-muted-foreground text-sm">
                  Invited by {invitation.invitedByUser?.name}
                </p>
                <p className="mt-1 text-muted-foreground text-xs">
                  Expires{" "}
                  {new Date(invitation.expiresAt).toLocaleDateString()}
                </p>
              </div>
              {!isExpired && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(invitation._id)}
                    disabled={processingId === invitation._id}
                  >
                    {processingId === invitation._id ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <X />
                    )}
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAccept(invitation._id)}
                    disabled={processingId === invitation._id}
                  >
                    {processingId === invitation._id ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Check />
                    )}
                    Accept
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
