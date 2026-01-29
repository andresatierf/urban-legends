"use client";

import { Toaster } from "sonner";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { useUser } from "@/hooks/useUser";
import { AppSidebar } from "./app-sidebar";
import { NotificationDropdown } from "./notifications/notification-dropdown";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";

export function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = useUser();
  const unreadCount = useUnreadCount(user?._id);

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="pointer-events-auto fixed top-2 left-2 z-50 flex flex-row gap-0.5 p-1">
        <div className="-z-10 pointer-events-none absolute inset-0 right-auto w-8 rounded-lg bg-transparent backdrop-blur-xs transition-[background-color,width] delay-0 duration-250 max-sm:bg-sidebar/50 max-sm:delay-125 max-sm:duration-125"></div>
        <SidebarTrigger
          size="icon"
          className="z-10 size-6 bg-muted transition-colors focus-visible:outline-hidden [&_svg]:size-4"
        />
      </div>
      {user && (
        <div className="pointer-events-auto fixed top-2 right-2 z-50">
          <NotificationDropdown userId={user._id} unreadCount={unreadCount} />
        </div>
      )}
      <div className="flex min-h-screen w-full flex-col items-center bg-muted/30">
        <main className="mt-8 flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
          {children}
        </main>
        <Toaster />
      </div>
    </SidebarProvider>
  );
}
