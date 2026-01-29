import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function useNotifications(userId: Id<"users">, limit = 50) {
  const notifications = useQuery(api.notifications.list, {
    userId,
    limit,
    filter: "all",
  });

  return notifications;
}
