import { Toaster } from "sonner";
import { Sidebar } from "./app-sidebar";
import { Navigation } from "./navigation";
import { SidebarProvider } from "./ui/sidebar";

export function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
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
