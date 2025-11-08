"use client";

import { useQuery } from "convex/react";
import { Mail, Calendar, Check, X, Clock } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "../ui/empty";

type Props = {
  teamId: Id<"teams">;
};

export function InvitedUsersList({ teamId }: Props) {
  const invitations = useQuery(api.teams.listTeamInvitations, {
    teamId,
  });

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="default" className="bg-green-600">
            <Check className="h-3 w-3" />
            Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <X className="h-3 w-3" />
            Declined
          </Badge>
        );
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      case "expired":
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

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
        {invitations.length === 0 ? (
          <Empty>
            <EmptyTitle>No invitations sent</EmptyTitle>
            <EmptyDescription>
              Use the "Invite Member" button to invite users to join your team.
            </EmptyDescription>
          </Empty>
        ) : (
          <>
            {pendingInvitations.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-sm">Pending Invitations</h3>
                {pendingInvitations.map((invitation) => {
                  const isExpired =
                    new Date(invitation.expiresAt) < new Date();

                  return (
                    <div
                      key={invitation._id}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {invitation.invitedUser?.name}
                            </p>
                            {getStatusBadge(
                              isExpired ? "expired" : invitation.status,
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-muted-foreground text-sm">
                            <Mail className="h-3 w-3" />
                            {invitation.invitedEmail}
                          </div>
                          <div className="mt-1 flex items-center gap-4 text-muted-foreground text-xs">
                            <span>
                              Invited by {invitation.invitedByUser?.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Expires{" "}
                              {new Date(
                                invitation.expiresAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {otherInvitations.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-sm">Past Invitations</h3>
                {otherInvitations.map((invitation) => (
                  <div
                    key={invitation._id}
                    className="rounded-lg border bg-muted/50 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {invitation.invitedUser?.name}
                          </p>
                          {getStatusBadge(invitation.status)}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-muted-foreground text-sm">
                          <Mail className="h-3 w-3" />
                          {invitation.invitedEmail}
                        </div>
                        <div className="mt-1 text-muted-foreground text-xs">
                          {invitation.respondedAt
                            ? `Responded ${new Date(invitation.respondedAt).toLocaleDateString()}`
                            : `Invited ${new Date(invitation.createdAt).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
