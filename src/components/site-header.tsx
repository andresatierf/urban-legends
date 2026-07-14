"use client";

import { useQuery } from "convex/react";
import { Plus } from "lucide-react";

import { UpsertActivityFormDialog } from "@/components/activities/form";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { useUser } from "@/hooks/useUser";

import { api } from "../../convex/_generated/api";
import { useActivityDialog } from "./activity-dialog-context";
import { HeaderBreadcrumbs } from "./header-breadcrumbs";
import { NotificationDropdown } from "./notifications/notification-dropdown";

export function SiteHeader() {
  const { state, isMobile } = useSidebar();
  const { user } = useUser({ shouldThrow: false });
  const { isOpen, openActivityDialog, onOpenChange } = useActivityDialog();
  const unreadCount = useUnreadCount(user?._id);

  // Quick-add is only useful for users who can actually submit activities —
  // that requires team membership, not the stored player identity role.
  const isPlayer =
    useQuery(api.captain.getIsPlayer, user ? {} : "skip") ?? false;
  const showPlus = isPlayer && (state === "collapsed" || isMobile);

  return (
    <header className="bg-background sticky top-0 z-30 flex h-14 shrink-0 items-center gap-1 px-3">
      <UpsertActivityFormDialog open={isOpen} onOpenChange={onOpenChange} />
      <SidebarTrigger aria-label="Toggle sidebar" />
      {showPlus && (
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="New activity"
          onClick={openActivityDialog}
        >
          <Plus />
        </Button>
      )}
      <HeaderBreadcrumbs />
      {user && (
        <div className="ml-auto flex items-center gap-1">
          <NotificationDropdown userId={user._id} unreadCount={unreadCount} />
        </div>
      )}
    </header>
  );
}
