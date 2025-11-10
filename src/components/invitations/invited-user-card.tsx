import { capitalize } from "lodash";
import {
  Calendar,
  Check,
  Clock,
  Loader2,
  Mail,
  UserPlus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return (
        <Badge variant="pending">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case "accepted":
      return (
        <Badge variant="approved">
          <Check className="h-3 w-3" />
          Accepted
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="rejected">
          <X className="h-3 w-3" />
          Declined
        </Badge>
      );
    case "cancelled":
      return <Badge variant="outline">Cancelled</Badge>;
    case "expired":
      return <Badge variant="outline">Expired</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

type InvitedUserCardProps = {
  invitation: Doc<"teamInvitations"> & {
    invitedUser: Doc<"users"> | null;
    invitedByUser: Doc<"users"> | null;
  };
  processing: boolean;
  onClick: () => void;
  className?: string;
};

export function InvitedUserCard({
  invitation,
  processing,
  onClick,
  className,
}: InvitedUserCardProps) {
  const isExpired = new Date(invitation.expiresAt) < new Date();

  return (
    <div
      key={invitation._id}
      className={cn("rounded-lg border p-4", className)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{invitation.invitedUser?.name}</p>
            {getStatusBadge(isExpired ? "expired" : invitation.status)}
          </div>
          <div className="mt-1 flex items-center gap-1 text-muted-foreground text-sm">
            <Mail className="h-3 w-3" />
            {invitation.invitedEmail}
          </div>

          <div className="mt-1 flex items-center gap-4 text-muted-foreground text-xs">
            <span className="flex items-center gap-1">
              <UserPlus className="h-3 w-3" />
              Invited by {invitation.invitedByUser?.name} on{" "}
              {new Date(invitation.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {invitation.respondedAt
                ? `${capitalize(invitation.status)} ${new Date(invitation.respondedAt).toLocaleDateString()}`
                : `Expires ${new Date(invitation.expiresAt).toLocaleDateString()}`}
            </span>
          </div>
        </div>
        {!isExpired && (
          <Button
            size="sm"
            variant="outline"
            onClick={onClick}
            disabled={processing}
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
