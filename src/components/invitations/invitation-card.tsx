import { Link } from "@tanstack/react-router";
import { capitalize } from "lodash";
import {
  Calendar,
  Check,
  Loader2,
  Mail,
  Trophy,
  UserPlus,
  X,
} from "lucide-react";

import { useFormattedDate } from "@/hooks/useFormattedDate";

import type { Doc } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { getStatusBadge } from "./utils";

type InvitationDoc = Doc<"joinRequests"> & {
  counterparty: Doc<"users"> | null;
  team?: Doc<"teams"> | null;
  tournament?: Doc<"tournaments"> | null;
  invitedByUser?: Doc<"users"> | null;
};

type InvitationCardProps = {
  invitation: InvitationDoc;
  viewer: "team" | "user";
  processing?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  canRespond?: boolean;
  className?: string;
};

export function InvitationCard({
  invitation,
  viewer,
  processing = false,
  onAccept,
  onReject,
  canRespond = true,
  className,
}: InvitationCardProps) {
  const { format } = useFormattedDate();
  const isExpired =
    !!invitation.expiresAt && new Date(invitation.expiresAt) < new Date();
  const displayStatus = isExpired ? "expired" : invitation.status;

  const viewerIsSender = viewer === invitation.initiator;
  const isTeamOutgoingInvite =
    viewer === "team" && invitation.initiator === "team";
  const primaryName =
    viewer === "team"
      ? (invitation.counterparty?.name ?? "Unknown user")
      : (invitation.team?.name ?? "Unknown team");

  const { primaryAction, secondaryAction } = resolveActions({
    viewerIsSender,
    initiator: invitation.initiator,
  });

  const showActions =
    !isExpired && invitation.status === "pending" && canRespond;

  const dateLabel = invitation.initiator === "team" ? "Invited" : "Requested";

  return (
    <Card className={className}>
      <CardContent className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{primaryName}</p>
            {getStatusBadge(displayStatus)}
          </div>
          <div className="text-muted-foreground mt-1 flex flex-col items-start gap-1 text-xs">
            {viewer === "team" && invitation.counterparty?.email && (
              <span className="flex items-center gap-1 text-sm">
                <Mail className="h-3 w-3" />
                {invitation.counterparty.email}
              </span>
            )}
            {viewer === "user" && invitation.tournament && (
              <span className="flex items-center gap-1 text-sm">
                <Trophy className="h-4 w-4" />
                <Link
                  to="/tournaments/$tournamentId"
                  params={{ tournamentId: invitation.tournament._id }}
                  className="hover:underline"
                >
                  {invitation.tournament.name}
                </Link>
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
            {viewer === "team" &&
              invitation.initiator === "team" &&
              invitation.invitedByUser && (
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
        </div>
        {showActions && (primaryAction || secondaryAction) && (
          <div className="flex gap-2 self-end sm:self-auto">
            {secondaryAction && (
              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
                disabled={processing}
              >
                {processing ? <Loader2 className="animate-spin" /> : <X />}
                {secondaryAction}
              </Button>
            )}
            {primaryAction && (
              <Button size="sm" onClick={onAccept} disabled={processing}>
                {processing ? <Loader2 className="animate-spin" /> : <Check />}
                {primaryAction}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function resolveActions({
  viewerIsSender,
  initiator,
}: {
  viewerIsSender: boolean;
  initiator: "team" | "user";
}): { primaryAction: string | null; secondaryAction: string | null } {
  if (viewerIsSender) {
    return { primaryAction: null, secondaryAction: "Cancel" };
  }
  // Recipient
  if (initiator === "team") {
    return { primaryAction: "Accept", secondaryAction: "Decline" };
  }
  return { primaryAction: "Approve", secondaryAction: "Reject" };
}
