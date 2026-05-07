"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { RedirectToDashboard } from "@/components/redirect-to-dashboard";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function SignInLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Authenticated>
        <RedirectToDashboard />
      </Authenticated>
      <Unauthenticated>
        <div className="flex min-h-screen w-full flex-col bg-gray-50">
          <div className="pointer-events-auto fixed top-2 right-2 z-50">
            <ThemeSwitcher />
          </div>
          <main className="m-4 flex flex-1 flex-col items-center justify-center gap-4">
            {children}
          </main>
        </div>
        {children}
      </Unauthenticated>
    </>
  );
}
