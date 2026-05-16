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

  const handleRespond = async (
    invitationId: Id<"joinRequests">,
    accept: boolean,
  ) => {
    setProcessingId(invitationId);

    await tryMutate({
      fn: () => respondToInvitation({ invitationId, accept }),
      onFinally: () => setProcessingId(null),
      successToast: accept
        ? "Invitation accepted! You've joined the team."
        : "Invitation declined",
      defaultFailureToast: accept
        ? "Failed to accept invitation"
        : "Failed to decline invitation",
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
              <h3 className="text-sm font-medium">Pending Invitations</h3>
            )}
            {pendingInvitations.map((invitation) => (
              <InvitationCard
                key={invitation._id}
                invitation={{ ...invitation, counterparty: null }}
                viewer="user"
                processing={processingId === invitation._id}
                onAccept={() => handleRespond(invitation._id, true)}
                onReject={() => handleRespond(invitation._id, false)}
              />
            ))}
          </div>
        )}

        {!pendingOnly && otherInvitations.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Past Invitations</h3>
            {otherInvitations.map((invitation) => (
              <InvitationCard
                key={invitation._id}
                invitation={{ ...invitation, counterparty: null }}
                viewer="user"
                className="bg-muted/50"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
