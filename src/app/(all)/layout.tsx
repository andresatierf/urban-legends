"use client";

import { RedirectToSignIn } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import { Toaster } from "sonner";
import { Layout } from "@/components/layout";

export default function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Authenticated>
        <div className="flex min-h-screen w-full flex-col bg-gray-50">
          <main className="flex-1">
            <Layout>{children}</Layout>
          </main>
          <Toaster />
        </div>
      </Authenticated>
      <Unauthenticated>
        <RedirectToSignIn />
      </Unauthenticated>
    </>
  );
}
