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
import { InvitedUserCard } from "./invited-user-card";

type Props = {
  teamId: Id<"teams">;
  canCancel: boolean;
};

export function InvitedUsersList({ teamId, canCancel }: Props) {
  const [processingId, setProcessingId] =
    useState<Id<"teamInvitations"> | null>(null);

  const invitations = useQuery(api.teamInvitations.listTeamInvitations, {
    teamId,
  });
  const cancelInvitation = useMutation(api.teamInvitations.cancelInvitation);

  if (invitations === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invited Users</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "pending",
  );
  const otherInvitations = invitations.filter(
    (inv) => inv.status !== "pending",
  );

  const handleCancelInvitation = async (
    invitationId: Id<"teamInvitations">,
  ) => {
    setProcessingId(invitationId);
    try {
      await cancelInvitation({ invitationId });
      toast.success("Invitation cancelled");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel invitation",
      );
    } finally {
      setProcessingId(null);
    }
  };

  if (invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invited Users</CardTitle>
          <CardDescription>No pending invitations</CardDescription>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyTitle>No invitations sent</EmptyTitle>
            <EmptyDescription>
              Use the "Invite Member" button to invite users to join your team.
            </EmptyDescription>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invited Users</CardTitle>
        <CardDescription>
          {pendingInvitations.length} pending invitation
          {pendingInvitations.length !== 1 ? "s" : ""}
          {otherInvitations.length > 0 &&
            ` · ${otherInvitations.length} past invitation${otherInvitations.length !== 1 ? "s" : ""}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingInvitations.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Pending Invitations</h3>
            {pendingInvitations.map((invitation) => (
              <InvitedUserCard
                key={invitation._id}
                invitation={invitation}
                processing={processingId === invitation._id}
                onClick={() => handleCancelInvitation(invitation._id)}
                canCancel={canCancel}
              />
            ))}
          </div>
        )}

        {otherInvitations.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Past Invitations</h3>
            {otherInvitations.map((invitation) => (
              <InvitedUserCard
                key={invitation._id}
                invitation={invitation}
                processing={false}
                onClick={() => {}}
                className="bg-muted/50"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
