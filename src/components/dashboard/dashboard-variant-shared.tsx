"use client";

import { CheckCircle, Clock, UserPlus, Users, XCircle } from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  "check-circle": CheckCircle,
  "x-circle": XCircle,
  users: Users,
  "user-plus": UserPlus,
};

export function ActivityIcon({ icon }: { icon: string }) {
  const Icon = ICON_MAP[icon] ?? Clock;
  return <Icon className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />;
}

export function formatRelative(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
