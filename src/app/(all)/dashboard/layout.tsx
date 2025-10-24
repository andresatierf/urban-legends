"use client";

import { Layout } from "@/components/layout";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <Layout>{children}</Layout>;
}
