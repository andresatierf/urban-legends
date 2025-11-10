import { Calendar, Check, Loader2, UserPlus, X } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

type TeamInvitationCardProps = {
  invitation: Doc<"teamInvitations"> & {
    team: Doc<"teams"> | null;
    tournament: Doc<"tournaments"> | null;
    invitedByUser: Doc<"users"> | null;
  };
  processing: boolean;
  onAccept: () => void;
  onReject: () => void;
  className?: string;
};

export function TeamInvitationCard({
  invitation,
  processing,
  onAccept,
  onReject,
  className,
}: TeamInvitationCardProps) {
  const isExpired = new Date(invitation.expiresAt) < new Date();

  return (
    <Card className={className}>
      <CardContent className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{invitation.team?.name}</p>
            <Badge variant="secondary">{invitation.tournament?.name}</Badge>
            {isExpired && <Badge variant="destructive">Expired</Badge>}
          </div>
          <div className="mt-1 flex flex-col items-start text-muted-foreground text-xs">
            <span className="flex items-center gap-1">
              <UserPlus className="h-3 w-3" />
              Invited by {invitation.invitedByUser?.name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Expires {new Date(invitation.expiresAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        {!isExpired && (
          <div className="flex gap-2 self-end sm:self-auto">
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
      </CardContent>
    </Card>
  );
}
