"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { NotificationIndicator } from "./notification-indicator";
import { NotificationItem } from "./notification-item";

interface NotificationDropdownProps {
  userId: Id<"users">;
  unreadCount: number;
}

export function NotificationDropdown({
  userId,
  unreadCount,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Conditional query - only fetch when dropdown is open
  const recentNotifications = useQuery(
    api.notifications.recent,
    isOpen ? { userId, limit: 5 } : "skip",
  );

  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead({ userId });
  };

  const handleNotificationClick = () => {
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div>
          <NotificationIndicator unreadCount={unreadCount} isOpen={isOpen} />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-80"
        align="end"
        role="dialog"
        aria-label="Notification panel"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-auto p-1 text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>

        {recentNotifications === undefined ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            Loading...
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            No notifications yet
          </div>
        ) : (
          <ul
            className="max-h-96 space-y-2 overflow-y-auto"
            aria-label="Recent notifications"
          >
            {recentNotifications.map((notification: Doc<"notifications">) => (
              <li key={notification._id}>
                <NotificationItem
                  notification={notification}
                  onClick={handleNotificationClick}
                />
              </li>
            ))}
          </ul>
        )}

        {recentNotifications && recentNotifications.length > 0 && (
          <div className="mt-3 border-t pt-3">
            <Button
              variant="link"
              className="h-auto w-full p-0 text-sm"
              asChild
            >
              <Link href="/notifications">View all notifications</Link>
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
