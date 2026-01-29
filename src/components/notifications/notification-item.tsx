"use client";

import { useMutation } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { NotificationActions } from "./notification-actions";

interface ActionButton {
  label: string;
  action: "accept" | "reject" | "view" | "dismiss";
  mutationName?: string;
  args?: Record<string, unknown>;
}

interface NotificationItemProps {
  notification: {
    _id: Id<"notifications">;
    title: string;
    body?: string;
    isRead: boolean;
    createdAt: string;
    actionUrl?: string;
    actionMetadata?: {
      buttons?: ActionButton[];
      [key: string]: unknown;
    };
  };
  onClick?: () => void;
  showActions?: boolean;
}

export function NotificationItem({
  notification,
  onClick,
  showActions = true,
}: NotificationItemProps) {
  const markAsRead = useMutation(api.notifications.markAsRead);
  const hasActions =
    showActions &&
    notification.actionMetadata?.buttons &&
    notification.actionMetadata.buttons.length > 0;

  const handleClick = async () => {
    // Don't navigate if there are action buttons - let user choose action
    if (hasActions) {
      return;
    }

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
        hasActions && "cursor-default",
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

      {/* Action buttons */}
      {hasActions && notification.actionMetadata && (
        <NotificationActions
          notificationId={notification._id}
          actions={notification.actionMetadata.buttons}
          onActionComplete={onClick}
        />
      )}
    </button>
  );
}
