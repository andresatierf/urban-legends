"use client";

import { Toaster } from "sonner";

import { useUnreadCount } from "@/hooks/use-unread-count";
import { useUser } from "@/hooks/useUser";

import { AppSidebar } from "./app-sidebar";
import { FloatingSidebarActions } from "./floating-sidebar-actions";
import { NotificationDropdown } from "./notifications/notification-dropdown";
import { SubmissionDialogProvider } from "./submission-dialog-context";
import { ThemeSwitcher } from "./theme-switcher";
import { SidebarProvider } from "./ui/sidebar";

export function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = useUser();
  const unreadCount = useUnreadCount(user?._id);

  return (
    <SubmissionDialogProvider>
      <SidebarProvider>
        <AppSidebar />
        <FloatingSidebarActions />
        <div className="pointer-events-auto fixed top-2 right-2 z-50 flex items-center gap-1">
          <ThemeSwitcher />
          {user && (
            <NotificationDropdown userId={user._id} unreadCount={unreadCount} />
          )}
        </div>
        <div className="bg-muted/30 flex min-h-screen w-full flex-col items-center">
          <main className="mt-8 flex w-full flex-1 flex-col gap-4 p-4">
            {children}
          </main>
          <Toaster />
        </div>
      </SidebarProvider>
    </SubmissionDialogProvider>
  );
}
