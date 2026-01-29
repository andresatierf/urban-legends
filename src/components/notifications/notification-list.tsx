"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { NotificationItem } from "./notification-item";

type NotificationType =
  | "all"
  | "team"
  | "submission"
  | "tournament"
  | "role"
  | "digest";

interface NotificationListProps {
  userId: Id<"users">;
  limit?: number;
  enableFiltering?: boolean;
}

export function NotificationList({
  userId,
  limit,
  enableFiltering = false,
}: NotificationListProps) {
  const notifications = useNotifications(userId, limit);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const [typeFilter, setTypeFilter] = useState<NotificationType>("all");

  // Filter notifications by type category
  const filteredNotifications = notifications?.filter((notification) => {
    if (typeFilter === "all") return true;

    const notifType = notification.type;

    switch (typeFilter) {
      case "team":
        return notifType.startsWith("team_") || notifType.includes("_team");
      case "submission":
        return notifType.startsWith("submission_");
      case "tournament":
        return notifType.startsWith("tournament_");
      case "role":
        return notifType.startsWith("role_");
      case "digest":
        return notifType === "pending_items_digest";
      default:
        return true;
    }
  });

  const unreadCount =
    filteredNotifications?.filter((n) => !n.isRead).length ?? 0;

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

  if (
    filteredNotifications &&
    filteredNotifications.length === 0 &&
    typeFilter !== "all"
  ) {
    return (
      <div className="flex flex-col gap-4">
        {enableFiltering && (
          <div className="flex gap-2 border-b pb-2">
            <FilterButtons
              currentFilter={typeFilter}
              onFilterChange={setTypeFilter}
            />
          </div>
        )}
        <div className="p-4 text-center text-muted-foreground text-sm">
          No {typeFilter} notifications
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {enableFiltering && (
        <div className="flex gap-2 border-b pb-2">
          <FilterButtons
            currentFilter={typeFilter}
            onFilterChange={setTypeFilter}
          />
        </div>
      )}
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
        {filteredNotifications?.map((notification) => (
          <NotificationItem
            key={notification._id}
            notification={notification}
          />
        ))}
      </div>
    </div>
  );
}

function FilterButtons({
  currentFilter,
  onFilterChange,
}: {
  currentFilter: NotificationType;
  onFilterChange: (filter: NotificationType) => void;
}) {
  const filters: { label: string; value: NotificationType }[] = [
    { label: "All", value: "all" },
    { label: "Team", value: "team" },
    { label: "Submission", value: "submission" },
    { label: "Tournament", value: "tournament" },
    { label: "Role", value: "role" },
    { label: "Digest", value: "digest" },
  ];

  return (
    <>
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={currentFilter === filter.value ? "solid" : "ghost"}
          size="sm"
          onClick={() => onFilterChange(filter.value)}
          className="h-7 text-xs"
        >
          {filter.label}
        </Button>
      ))}
    </>
  );
}
