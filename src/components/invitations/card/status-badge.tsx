import { Check, Clock, Hourglass, X } from "lucide-react";

import { Badge } from "../../ui/badge";

export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="warning">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case "accepted":
      return (
        <Badge variant="success">
          <Check className="h-3 w-3" />
          Accepted
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="error">
          <X className="h-3 w-3" />
          Declined
        </Badge>
      );
    case "cancelled":
      return <Badge variant="neutral">Cancelled</Badge>;
    case "expired":
      return (
        <Badge variant="neutral">
          <Hourglass className="h-3 w-3" />
          Expired
        </Badge>
      );
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

export const STATUS_BORDER: Record<string, string> = {
  pending: "border-warning",
  accepted: "border-success",
  rejected: "border-crimson",
  cancelled: "border-mute",
  expired: "border-mute",
};
