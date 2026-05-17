import type { Id } from "../../../../convex/_generated/dataModel";
import { InvitationsList } from "./layout";
import type { JoinRequestRow } from "./types";

type Props = {
  requests: JoinRequestRow[] | undefined;
  processingId: Id<"joinRequests"> | null;
  onAccept: (requestId: Id<"joinRequests">) => void;
  onReject: (requestId: Id<"joinRequests">) => void;
  canRespond: boolean;
};

export function JoinRequestsListView({
  requests,
  processingId,
  onAccept,
  onReject,
  canRespond,
}: Props) {
  return (
    <InvitationsList
      title="Join Requests"
      itemLabel={{ singular: "request", plural: "requests" }}
      emptyTitle="No pending requests"
      emptyDescription="When users request to join your team, they'll appear here."
      loading={requests === undefined}
      invitations={(requests ?? []).map((request) => ({
        key: request._id,
        invitation: { ...request, counterparty: request.user },
        viewer: "team",
        processing: processingId === request._id,
        canRespond,
        onAccept: canRespond ? () => onAccept(request._id) : undefined,
        onReject: canRespond ? () => onReject(request._id) : undefined,
      }))}
    />
  );
}
