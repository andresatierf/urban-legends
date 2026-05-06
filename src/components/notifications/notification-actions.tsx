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
  variant?: "solid" | "outline" | "ghost" | "link";
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
  const respondToInvitation = useMutation(
    api.teamInvitations.respondToInvitation,
  );
  const respondToJoinRequest = useMutation(
    api.joinRequests.respondToJoinRequest,
  );

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
        const isAccept = action.action === "accept";

        // Check if this is a team invitation
        if (action.args?.invitationId) {
          await respondToInvitation({
            invitationId: action.args.invitationId as Id<"joinRequests">,
            accept: isAccept,
          });

          toast.success(
            isAccept
              ? "Invitation accepted! Welcome to the team."
              : "Invitation declined.",
          );
        }
        // Check if this is a join request
        else if (action.args?.requestId) {
          await respondToJoinRequest({
            requestId: action.args.requestId as Id<"joinRequests">,
            approve: isAccept,
          });

          toast.success(
            isAccept ? "Join request approved." : "Join request declined.",
          );
        } else {
          toast.error(
            "Unable to process action. Missing required information.",
          );
        }
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
      aria-label="Notification actions"
    >
      {actions.map((action) => (
        <Button
          key={`${action.action}-${action.label}`}
          size="sm"
          variant={getActionVariant(action.action)}
          onClick={() => handleAction(action)}
          disabled={isLoading}
          className="h-7 text-xs"
          aria-label={`${action.label} notification`}
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
