"use client";

import { ActivityDialogProvider } from "./activity-dialog-context";
import { AppSidebar } from "./app-sidebar";
import { SiteHeader } from "./site-header";
import { SidebarInset, SidebarProvider } from "./ui/sidebar";

export function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ActivityDialogProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-muted/30">
          <SiteHeader />
          <div className="flex w-full flex-1 flex-col items-center">
            <main className="flex w-full flex-1 flex-col gap-4 p-4">
              {children}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ActivityDialogProvider>
  );
}
