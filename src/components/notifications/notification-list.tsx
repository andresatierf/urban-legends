"use client";

import { useMutation } from "convex/react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { NotificationItem } from "./notification-item";

interface NotificationListProps {
  userId: Id<"users">;
  limit?: number;
}

export function NotificationList({ userId, limit }: NotificationListProps) {
  const notifications = useNotifications(userId, limit);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  const handleMarkAllAsRead = async () => {
    await markAllAsRead({ userId });
  };

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
    <div className="flex flex-col gap-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between border-b pb-2">
          <p className="text-muted-foreground text-sm">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="h-8"
          >
            Mark all as read
          </Button>
        </div>
      )}
      <div className="flex flex-col gap-2">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification._id}
            notification={notification}
          />
        ))}
      </div>
    </div>
  );
}
