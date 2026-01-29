import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function useUnreadCount(userId: Id<"users"> | undefined) {
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    userId ? { userId } : "skip",
  );

  return unreadCount ?? 0;
}
