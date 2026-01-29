"use client";

import { useMutation } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface NotificationItemProps {
  notification: {
    _id: Id<"notifications">;
    title: string;
    body?: string;
    isRead: boolean;
    createdAt: string;
    actionUrl?: string;
  };
  onClick?: () => void;
}

export function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const markAsRead = useMutation(api.notifications.markAsRead);

  const handleClick = async () => {
    if (!notification.isRead) {
      await markAsRead({ notificationId: notification._id });
    }

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }

    onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full flex-col gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-accent",
        !notification.isRead && "bg-accent/50 font-semibold",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm">{notification.title}</p>
        {!notification.isRead && (
          <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
        )}
      </div>
      {notification.body && (
        <p className="text-muted-foreground text-xs">{notification.body}</p>
      )}
      <p className="text-muted-foreground text-xs">
        {formatDistanceToNow(new Date(notification.createdAt), {
          addSuffix: true,
        })}
      </p>
    </button>
  );
}
