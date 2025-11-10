import { Check, Loader2, X } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

type TeamInvitationCardProps = {
  invitation: Doc<"teamInvitations"> & {
    team: Doc<"teams"> | null;
    tournament: Doc<"tournaments"> | null;
    invitedByUser: Doc<"users"> | null;
  };
  processing: boolean;
  onAccept: () => void;
  onReject: () => void;
};

export function TeamInvitationCard({
  invitation,
  processing,
  onAccept,
  onReject,
}: TeamInvitationCardProps) {
  const isExpired = new Date(invitation.expiresAt) < new Date();

  return (
    <div
      key={invitation._id}
      className="flex items-start justify-between rounded-lg border p-4"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{invitation.team?.name}</p>
          <Badge variant="secondary">{invitation.tournament?.name}</Badge>
          {isExpired && <Badge variant="destructive">Expired</Badge>}
        </div>
        <p className="mt-1 text-muted-foreground text-sm">
          Invited by {invitation.invitedByUser?.name}
        </p>
        <p className="mt-1 text-muted-foreground text-xs">
          Expires {new Date(invitation.expiresAt).toLocaleDateString()}
        </p>
      </div>
      {!isExpired && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onReject}
            disabled={processing}
          >
            {processing ? <Loader2 className="animate-spin" /> : <X />}
            Decline
          </Button>
          <Button size="sm" onClick={onAccept} disabled={processing}>
            {processing ? <Loader2 className="animate-spin" /> : <Check />}
            Accept
          </Button>
        </div>
      )}
    </div>
  );
}
