import { capitalize } from "lodash";
import { Calendar, Mail, UserPlus } from "lucide-react";

import { useFormattedDate } from "@/hooks/useFormattedDate";

import type { InvitationDoc, Viewer } from "./types";

export function MetaList({
  invitation,
  viewer,
}: {
  invitation: InvitationDoc;
  viewer: Viewer;
}) {
  const { format } = useFormattedDate();
  const isTeamOutgoingInvite =
    viewer === "team" && invitation.initiator === "team";
  const dateLabel = invitation.initiator === "team" ? "Invited" : "Requested";

  return (
    <div className="text-muted-foreground flex flex-col items-start gap-1 text-xs">
      {viewer === "team" && invitation.counterparty?.email && (
        <span className="flex items-center gap-1 text-sm">
          <Mail className="h-3 w-3" />
          {invitation.counterparty.email}
        </span>
      )}
      {invitation.message && (
        <p className="text-muted-foreground mt-1 text-sm">
          {invitation.message}
        </p>
      )}
      {viewer === "user" && invitation.invitedByUser && (
        <span className="flex items-center gap-1">
          <UserPlus className="h-3 w-3" />
          Invited by {invitation.invitedByUser.name}
        </span>
      )}
      {isTeamOutgoingInvite && invitation.invitedByUser && (
        <span className="flex items-center gap-1">
          <UserPlus className="h-3 w-3" />
          Invited by {invitation.invitedByUser.name} on{" "}
          {format(invitation.createdAt, "short")}
        </span>
      )}
      {!isTeamOutgoingInvite && (
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {dateLabel} {format(invitation.createdAt, "short")}
        </span>
      )}
      {(invitation.respondedAt ?? invitation.expiresAt) && (
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {invitation.respondedAt
            ? `${capitalize(invitation.status)} ${format(invitation.respondedAt, "short")}`
            : `Expires ${format(invitation.expiresAt!, "short")}`}
        </span>
      )}
    </div>
  );
}
