import { formatDistanceToNow } from "date-fns";

/**
 * Format a timestamp for display in notifications
 */
export function formatNotificationTime(timestamp: string): string {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch (error) {
    console.error("Error formatting notification time:", error);
    return "recently";
  }
}

/**
 * Get the routing URL for a notification based on related entity
 */
export function getNotificationRoute(
  relatedEntityType?: string,
  relatedEntityId?: string,
  actionUrl?: string,
): string {
  // If explicit action URL is provided, use it
  if (actionUrl) {
    return actionUrl;
  }

  // Otherwise, generate based on entity type
  if (!relatedEntityType || !relatedEntityId) {
    return "/notifications";
  }

  switch (relatedEntityType) {
    case "team":
      return `/teams/${relatedEntityId}`;
    case "tournament":
      return `/tournaments/${relatedEntityId}`;
    case "activity":
      return `/activities/${relatedEntityId}`;
    case "participation":
      return `/activities/${relatedEntityId}`;
    default:
      return "/notifications";
  }
}

/**
 * Determine if a notification is actionable (has Accept/Reject buttons)
 */
export function isActionableNotification(type: string): boolean {
  const actionableTypes = [
    "team_invitation_received",
    "team_join_request_received",
  ];
  return actionableTypes.includes(type);
}

/**
 * Get notification icon/color based on type
 */
export function getNotificationStyle(type: string): {
  color: string;
  bgColor: string;
} {
  if (type.startsWith("team_")) {
    return { color: "text-blue-600", bgColor: "bg-blue-100" };
  }
  if (type.startsWith("activity_")) {
    return { color: "text-green-600", bgColor: "bg-green-100" };
  }
  if (type.startsWith("tournament_")) {
    return { color: "text-purple-600", bgColor: "bg-purple-100" };
  }
  if (type.startsWith("role_") || type === "pending_items_digest") {
    return { color: "text-orange-600", bgColor: "bg-orange-100" };
  }
  return { color: "text-gray-600", bgColor: "bg-gray-100" };
}
