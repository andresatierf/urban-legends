"use client";

import { Toaster } from "sonner";
import { Layout } from "@/components/layout";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/30">
      <main className="flex-1">
        <Layout>{children}</Layout>
      </main>
      <Toaster />
    </div>
  );
}
