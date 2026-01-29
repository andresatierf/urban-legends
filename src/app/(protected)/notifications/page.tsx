"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { NotificationList } from "@/components/notifications/notification-list";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { api } from "../../../../convex/_generated/api";

export default function NotificationsPage() {
  const { user } = useUser();
  const router = useRouter();
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-sm">Loading...</p>
      </div>
    );
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead({ userId: user._id });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated on tournament activities and team events
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          <Button variant="solid" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        </div>
      </div>

      <NotificationList userId={user._id} limit={100} />
    </div>
  );
}
