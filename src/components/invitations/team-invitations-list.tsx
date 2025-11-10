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
import { TeamInvitationCard } from "./team-invitation-card";

export function TeamInvitationsList() {
  const [processingId, setProcessingId] =
    useState<Id<"teamInvitations"> | null>(null);

  const invitations = useQuery(api.teamInvitations.listUserInvitations, {
    status: "pending",
  });
  const respondToInvitation = useMutation(
    api.teamInvitations.respondToInvitation,
  );

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
          <Empty>
            <EmptyTitle>No pending invitations</EmptyTitle>
            <EmptyDescription>
              When team captains invite you to join their team, invitations will
              appear here.
            </EmptyDescription>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Invitations</CardTitle>
        <CardDescription>
          {invitations.length} pending invitation
          {invitations.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {invitations.map((invitation) => (
          <TeamInvitationCard
            key={invitation._id}
            invitation={invitation}
            processing={processingId === invitation._id}
            onAccept={() => handleAccept(invitation._id)}
            onReject={() => handleReject(invitation._id)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
