import { Link } from "@tanstack/react-router";
import { capitalize } from "lodash";
import { Calendar, Check, Loader2, Mail, UserPlus, X } from "lucide-react";

import { ComposedCard } from "@/components/common/card/composed-card";
import { EdgeOverlay } from "@/components/common/card/edge-overlay";
import { useFormattedDate } from "@/hooks/useFormattedDate";
import { cn } from "@/lib/utils";

import type { Doc } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { getStatusBadge } from "./utils";

const STATUS_BORDER: Record<string, string> = {
  pending: "border-warning",
  accepted: "border-success",
  rejected: "border-crimson",
  cancelled: "border-mute",
  expired: "border-mute",
};

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

  const secondaryButton =
    showActions && secondaryAction ? (
      <Button
        size="sm"
        variant="destructive"
        onClick={onReject}
        disabled={processing}
      >
        {processing ? <Loader2 className="animate-spin" /> : <X />}
        {secondaryAction}
      </Button>
    ) : null;

  const primaryButton =
    showActions && primaryAction ? (
      <Button
        size="sm"
        variant="grass"
        onClick={onAccept}
        disabled={processing}
      >
        {processing ? <Loader2 className="animate-spin" /> : <Check />}
        {primaryAction}
      </Button>
    ) : null;

  return (
    <EdgeOverlay
      className={className}
      topRight={getStatusBadge(displayStatus)}
      bottomLeft={secondaryButton}
      bottomRight={primaryButton}
    >
      <ComposedCard
        className={cn("pb-2", STATUS_BORDER[displayStatus])}
        title={primaryName}
        eyebrow={
          viewer === "user" && invitation.tournament
            ? invitation.tournament.name
            : undefined
        }
        eyebrowTo={
          viewer === "user" && invitation.tournament
            ? "/tournaments/$tournamentId"
            : undefined
        }
        eyebrowParams={
          viewer === "user" && invitation.tournament
            ? { tournamentId: invitation.tournament._id }
            : undefined
        }
      >
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
      </ComposedCard>
    </EdgeOverlay>
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
  if (initiator === "team") {
    return { primaryAction: "Accept", secondaryAction: "Decline" };
  }
  return { primaryAction: "Approve", secondaryAction: "Reject" };
}
