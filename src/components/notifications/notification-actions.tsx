"use client";

import { useMutation } from "convex/react";
import { CheckIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";

interface ActionButton {
  label: string;
  action: "accept" | "reject" | "view" | "dismiss";
  mutationName?: string;
  args?: Record<string, unknown>;
  variant?: "default" | "destructive" | "outline" | "secondary";
}

interface NotificationActionsProps {
  notificationId: Id<"notifications">;
  actions?: ActionButton[];
  onActionComplete?: () => void;
}

export function NotificationActions({
  notificationId,
  actions,
  onActionComplete,
}: NotificationActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const markAsRead = useMutation(api.notifications.markAsRead);

  if (!actions || actions.length === 0) {
    return null;
  }

  const handleAction = async (action: ActionButton) => {
    setIsLoading(true);

    try {
      // Mark notification as read
      await markAsRead({ notificationId });

      // Handle different action types
      if (action.action === "accept" || action.action === "reject") {
        // For accept/reject actions, we would call the appropriate mutation
        // This would need to be implemented based on the notification type
        // For now, we'll just mark as read
      } else if (action.action === "view") {
        // Navigate to the related page
        if (action.args?.url) {
          router.push(action.args.url as string);
        }
      } else if (action.action === "dismiss") {
        // Just mark as read (already done above)
      }

      onActionComplete?.();
    } catch (error) {
      console.error("Failed to handle action:", error);
      toast.error("Failed to perform action. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <fieldset
      className="mt-2 flex gap-2 border-0 p-0"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.stopPropagation();
        }
      }}
    >
      {actions.map((action) => (
        <Button
          key={`${action.action}-${action.label}`}
          size="sm"
          variant={getActionVariant(action.action)}
          onClick={() => handleAction(action)}
          disabled={isLoading}
          className="h-7 text-xs"
        >
          {action.action === "accept" && <CheckIcon className="mr-1 h-3 w-3" />}
          {action.action === "reject" && <XIcon className="mr-1 h-3 w-3" />}
          {action.label}
        </Button>
      ))}
    </fieldset>
  );
}

function getActionVariant(
  action: string,
): "solid" | "outline" | "ghost" | "link" {
  switch (action) {
    case "accept":
      return "solid";
    case "reject":
      return "solid";
    case "view":
      return "outline";
    case "dismiss":
      return "ghost";
    default:
      return "outline";
  }
}
