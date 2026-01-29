"use client";

import { useNotifications } from "@/hooks/use-notifications";
import type { Id } from "../../../convex/_generated/dataModel";
import { NotificationItem } from "./notification-item";

interface NotificationListProps {
  userId: Id<"users">;
  limit?: number;
}

export function NotificationList({ userId, limit }: NotificationListProps) {
  const notifications = useNotifications(userId, limit);

  if (notifications === undefined) {
    return <div className="p-4 text-sm">Loading notifications...</div>;
  }

  if (notifications.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        No notifications yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {notifications.map((notification) => (
        <NotificationItem key={notification._id} notification={notification} />
      ))}
    </div>
  );
}
