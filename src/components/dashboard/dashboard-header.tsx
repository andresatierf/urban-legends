"use client";

import { SectionHeader } from "@/components/section-header";

interface DashboardHeaderProps {
  userName: string;
  activeTournamentsCount: number;
}

export function DashboardHeader({
  userName,
  activeTournamentsCount,
}: DashboardHeaderProps) {
  const greeting = `Welcome back, ${userName}`;
  const status =
    activeTournamentsCount > 0
      ? `You're participating in ${activeTournamentsCount} active tournament${activeTournamentsCount !== 1 ? "s" : ""}`
      : "Ready to join a tournament?";

  return <SectionHeader as="h1" title={greeting} description={status} />;
}
