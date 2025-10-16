"use client";

import { Sidebar } from "@/components/app-sidebar";
import { Navigation } from "@/components/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "sonner";

export default function Home({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider>
      <Sidebar />
      <div className="flex min-h-screen w-full flex-col bg-gray-50">
        <Navigation />
        <main className="m-4 flex flex-1 flex-col gap-4">{children}</main>
        <Toaster />
      </div>
    </SidebarProvider>
  );
}
