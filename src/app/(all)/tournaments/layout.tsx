"use client";

import { Layout } from "@/components/layout";

export default function TeamsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <Layout>{children}</Layout>;
}
