import { Check, Clock, X } from "lucide-react";
import { Badge } from "../ui/badge";

export const getStatusBadge = (status: string) => {
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
