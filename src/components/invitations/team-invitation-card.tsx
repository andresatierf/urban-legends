import { capitalize } from "lodash";
import { Calendar, Check, Loader2, Trophy, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useFormattedDate } from "@/hooks/useFormattedDate";
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
  const { format } = useFormattedDate();
  const isExpired = new Date(invitation.expiresAt) < new Date();

  return (
    <Card className={className}>
      <CardContent className="flex flex-col flex-wrap justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{invitation.team?.name}</p>
            {isExpired && <Badge variant="destructive">Expired</Badge>}
          </div>
          <div className="mt-1 flex flex-col items-start text-muted-foreground">
            <span className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              <Link
                href={`/tournaments/${invitation.tournament?._id}`}
                className="hover:underline"
              >
                {invitation.tournament?.name}
              </Link>
            </span>
            <span className="flex items-center gap-1 text-xs">
              <UserPlus className="h-3 w-3" />
              Invited by {invitation.invitedByUser?.name}
            </span>
            <span className="flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3" />
              {invitation.respondedAt
                ? `${capitalize(invitation.status)} ${format(invitation.respondedAt)}`
                : `Expires ${format(invitation.expiresAt)}`}
            </span>
          </div>
        </div>
        {!isExpired && invitation.status === "pending" && (
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
