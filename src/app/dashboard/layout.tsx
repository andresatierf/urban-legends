"use client";

import { Sidebar } from "@/components/app-sidebar";
import { Navigation } from "@/components/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "sonner";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider>
      <Sidebar />
      <div className="w-full min-h-screen flex flex-col bg-gray-50">
        <Navigation />
        <main className="flex-1">{children}</main>
        <Toaster />
      </div>
    </SidebarProvider>
  );
}
