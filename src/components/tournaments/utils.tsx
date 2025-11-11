import type { Doc } from "../../../convex/_generated/dataModel";
import { Badge } from "../ui/badge";

export const getStatusBadge = (tournament: Doc<"tournaments">) => {
  const now = new Date();
  const startDate = new Date(tournament.startDate);
  const endDate = new Date(tournament.endDate);

  const isActive = startDate <= now && now <= endDate;
  const isEnded = endDate < now;
  const isUpcoming = startDate > now;

  const status = isActive
    ? "active"
    : isUpcoming
      ? "upcoming"
      : isEnded
        ? "ended"
        : "unknown";

  switch (status) {
    case "upcoming":
      return <Badge variant="pending">Upcomming</Badge>;
    case "active":
      return <Badge variant="approved">Active</Badge>;
    case "ended":
      return <Badge variant="rejected">Ended</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};
