import { Toaster } from "sonner";
import { AppSidebar } from "./app-sidebar";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";

export function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
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
      <div className="flex min-h-screen w-full flex-col items-center bg-gray-50">
        <main className="mt-8 flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
          {children}
        </main>
        <Toaster />
      </div>
    </SidebarProvider>
  );
}
