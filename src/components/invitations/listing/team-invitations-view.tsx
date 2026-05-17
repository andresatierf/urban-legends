import type { Id } from "../../../../convex/_generated/dataModel";
import { InvitationsList } from "./layout";
import type { JoinRequestRow } from "./types";

type Props = {
  invitations: JoinRequestRow[] | undefined;
  processingId: Id<"joinRequests"> | null;
  onAccept: (invitationId: Id<"joinRequests">) => void;
  onReject: (invitationId: Id<"joinRequests">) => void;
  pendingOnly?: boolean;
};

export function TeamInvitationsListView({
  invitations,
  processingId,
  onAccept,
  onReject,
  pendingOnly,
}: Props) {
  return (
    <InvitationsList
      title="Team Invitations"
      itemLabel={{ singular: "invitation", plural: "invitations" }}
      emptyTitle="No pending invitations"
      emptyDescription="When team captains invite you to join their team, invitations will appear here."
      emptyClassName="gap-3 p-2!"
      loading={invitations === undefined}
      pendingOnly={pendingOnly}
      hidePendingHeader={pendingOnly}
      invitations={(invitations ?? []).map((invitation) => ({
        key: invitation._id,
        invitation: { ...invitation, counterparty: null },
        viewer: "user",
        processing: processingId === invitation._id,
        onAccept: () => onAccept(invitation._id),
        onReject: () => onReject(invitation._id),
      }))}
    />
  );
}
