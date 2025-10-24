"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { RedirectToDashboard } from "@/components/redirect-to-dashboard";

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
          <main className="m-4 flex flex-1 flex-col items-center justify-center gap-4">
            {children}
          </main>
        </div>
        {children}
      </Unauthenticated>
    </>
  );
}
