"use client";

import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { formatDistanceToNow } from "date-fns";

import { getNotificationRoute } from "@/lib/notification-utils";
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
    type: string;
    title: string;
    body?: string;
    isRead: boolean;
    createdAt: string;
    actionUrl?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
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
  const navigate = useNavigate();
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

    // Generate route using actionUrl or fallback to getNotificationRoute
    const route = getNotificationRoute(
      notification.relatedEntityType,
      notification.relatedEntityId,
      notification.actionUrl,
    );

    if (route) {
      navigate({ to: route });
    }

    onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Notification: ${notification.title}${!notification.isRead ? " (unread)" : ""}`}
      aria-pressed={!notification.isRead ? "true" : "false"}
      className={cn(
        "hover:bg-accent focus-visible:ring-ring flex w-full flex-col gap-1 rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        !notification.isRead && "bg-accent/50 font-semibold",
        hasActions && "cursor-default",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm">{notification.title}</p>
        {!notification.isRead && (
          <span className="bg-destructive h-2 w-2 shrink-0 rounded-full" />
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
