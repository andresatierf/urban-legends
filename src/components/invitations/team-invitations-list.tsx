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
import { TeamInvitationCard } from "./team-invitation-card";

export function TeamInvitationsList({
  pendingOnly,
}: {
  pendingOnly?: boolean;
}) {
  const [processingId, setProcessingId] = useState<Id<"joinRequests"> | null>(
    null,
  );

  const invitations = useQuery(api.teamInvitations.listUserInvitations, {});
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

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "pending",
  );
  const otherInvitations = invitations.filter(
    (inv) => inv.status !== "pending",
  );

  const handleAccept = async (invitationId: Id<"joinRequests">) => {
    setProcessingId(invitationId);

    await tryMutate({
      fn: () => respondToInvitation({ invitationId, accept: true }),
      onFinally: () => setProcessingId(null),
      successToast: "Invitation accepted! You've joined the team.",
      defaultFailureToast: "Failed to accept invitation",
    });
  };

  const handleReject = async (invitationId: Id<"joinRequests">) => {
    setProcessingId(invitationId);

    await tryMutate({
      fn: () => respondToInvitation({ invitationId, accept: false }),
      onFinally: () => setProcessingId(null),
      successToast: "Invitation declined",
      defaultFailureToast: "Failed to decline invitation",
    });
  };

  if (
    invitations.length === 0 ||
    (pendingOnly && pendingInvitations.length === 0)
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Invitations</CardTitle>
          <CardDescription>View your pending team invitations</CardDescription>
        </CardHeader>
        <CardContent>
          <Empty className="gap-3 p-2!">
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
          {pendingInvitations.length} pending invitation
          {pendingInvitations.length !== 1 ? "s" : ""}
          {otherInvitations.length > 0 &&
            ` · ${otherInvitations.length} past invitation${otherInvitations.length !== 1 ? "s" : ""}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingInvitations.length > 0 && (
          <div className="space-y-3">
            {!pendingOnly && (
              <h3 className="font-medium text-sm">Pending Invitations</h3>
            )}
            {pendingInvitations.map((invitation) => (
              <TeamInvitationCard
                key={invitation._id}
                invitation={invitation}
                processing={processingId === invitation._id}
                onAccept={() => handleAccept(invitation._id)}
                onReject={() => handleReject(invitation._id)}
              />
            ))}
          </div>
        )}

        {!pendingOnly && otherInvitations.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Past Invitations</h3>
            {otherInvitations.map((invitation) => (
              <TeamInvitationCard
                key={invitation._id}
                invitation={invitation}
                processing={false}
                onAccept={() => {}}
                onReject={() => {}}
                className="bg-muted/50"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
