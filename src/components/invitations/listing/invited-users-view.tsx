import type { Id } from "../../../../convex/_generated/dataModel";
import { InvitationsList } from "./layout";
import type { JoinRequestRow } from "./types";

type Props = {
  invitations: JoinRequestRow[] | undefined;
  processingId: Id<"joinRequests"> | null;
  onCancel: (invitationId: Id<"joinRequests">) => void;
  canCancel: boolean;
};

export function InvitedUsersListView({
  invitations,
  processingId,
  onCancel,
  canCancel,
}: Props) {
  return (
    <InvitationsList
      title="Invited Users"
      itemLabel={{ singular: "invitation", plural: "invitations" }}
      emptyTitle="No invitations sent"
      emptyDescription={`Use the "Invite Member" button to invite users to join your team.`}
      loading={invitations === undefined}
      invitations={(invitations ?? []).map((invitation) => ({
        key: invitation._id,
        invitation: { ...invitation, counterparty: invitation.user },
        viewer: "team",
        processing: processingId === invitation._id,
        onReject: () => onCancel(invitation._id),
        canRespond: canCancel,
      }))}
    />
  );
}
