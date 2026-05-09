import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { NotificationList } from "@/components/notifications/notification-list";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";

export const Route = createFileRoute("/_protected/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useUser();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated on tournament activities and team events
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate({ to: "/dashboard" })}
        >
          Back
        </Button>
      </div>

      <NotificationList userId={user._id} limit={100} enableFiltering={true} />
    </div>
  );
}
