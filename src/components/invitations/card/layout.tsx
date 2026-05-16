import { ComposedCard } from "@/components/common/card/composed-card";
import { EdgeOverlay } from "@/components/common/card/edge-overlay";
import { cn } from "@/lib/utils";

import {
  PrimaryActionButton,
  resolveActionLabels,
  SecondaryActionButton,
} from "./actions";
import { MetaList } from "./meta-list";
import { STATUS_BORDER, StatusBadge } from "./status-badge";
import type { InvitationDoc, Viewer } from "./types";

type Props = {
  invitation: InvitationDoc;
  viewer: Viewer;
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
}: Props) {
  const isExpired =
    !!invitation.expiresAt && new Date(invitation.expiresAt) < new Date();
  const displayStatus = isExpired ? "expired" : invitation.status;

  const primaryName =
    viewer === "team"
      ? (invitation.counterparty?.name ?? "Unknown user")
      : (invitation.team?.name ?? "Unknown team");

  const { primary, secondary } = resolveActionLabels({
    viewer,
    initiator: invitation.initiator,
  });

  const showActions =
    !isExpired && invitation.status === "pending" && canRespond;

  const showTournament = viewer === "user" && !!invitation.tournament;

  return (
    <EdgeOverlay
      className={className}
      topRight={<StatusBadge status={displayStatus} />}
      bottomLeft={
        showActions && secondary ? (
          <SecondaryActionButton
            label={secondary}
            processing={processing}
            onClick={onReject}
          />
        ) : null
      }
      bottomRight={
        showActions && primary ? (
          <PrimaryActionButton
            label={primary}
            processing={processing}
            onClick={onAccept}
          />
        ) : null
      }
    >
      <ComposedCard
        className={cn("pb-2", STATUS_BORDER[displayStatus])}
        title={primaryName}
        eyebrow={showTournament ? invitation.tournament!.name : undefined}
        eyebrowTo={showTournament ? "/tournaments/$tournamentId" : undefined}
        eyebrowParams={
          showTournament
            ? { tournamentId: invitation.tournament!._id }
            : undefined
        }
      >
        <MetaList invitation={invitation} viewer={viewer} />
      </ComposedCard>
    </EdgeOverlay>
  );
}
