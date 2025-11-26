import { capitalize } from "lodash";
import { Calendar, Loader2, Mail, UserPlus, X } from "lucide-react";
import { useFormattedDate } from "@/hooks/useFormattedDate";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { getStatusBadge } from "./utils";

type InvitedUserCardProps = {
  invitation: Doc<"teamInvitations"> & {
    invitedUser: Doc<"users"> | null;
    invitedByUser: Doc<"users"> | null;
  };
  processing: boolean;
  onClick: () => void;
  canCancel?: boolean;
  className?: string;
};

export function InvitedUserCard({
  invitation,
  processing,
  onClick,
  canCancel = false,
  className,
}: InvitedUserCardProps) {
  const { format } = useFormattedDate();
  const isExpired = new Date(invitation.expiresAt) < new Date();

  return (
    <Card className={className}>
      <CardContent className="flex xs:flex-row flex-col xs:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{invitation.invitedUser?.name}</p>
            {getStatusBadge(isExpired ? "expired" : invitation.status)}
          </div>
          <div className="mt-1 flex items-center gap-1 text-muted-foreground text-sm">
            <Mail className="h-3 w-3" />
            {invitation.invitedEmail}
          </div>
          <div className="mt-1 flex flex-col items-start text-muted-foreground text-xs">
            <span className="flex items-center gap-1">
              <UserPlus className="h-3 w-3" />
              Invited by {invitation.invitedByUser?.name} on{" "}
              {format(invitation.createdAt, "short")}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {invitation.respondedAt
                ? `${capitalize(invitation.status)} ${format(invitation.respondedAt, "short")}`
                : `Expires ${format(invitation.expiresAt, "short")}`}
            </span>
          </div>
        </div>
        {!isExpired && invitation.status === "pending" && canCancel && (
          <Button
            size="sm"
            variant="outline"
            onClick={onClick}
            disabled={processing}
            className="flex gap-2 xs:self-auto self-end"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
