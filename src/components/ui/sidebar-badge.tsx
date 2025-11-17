"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "./badge";

interface SidebarBadgeProps {
  query: string; // e.g., "captain.getPendingActionsCount"
  color?: "default" | "destructive" | "secondary" | "outline";
}

export function SidebarBadge({ query, color = "default" }: SidebarBadgeProps) {
  // Parse query string to Convex API call
  const [namespace, method] = query.split(".");

  // Dynamically access the API based on the query string
  const apiNamespace = api[namespace as keyof typeof api] as Record<
    string,
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic API access requires any
    any
  >;
  const count = useQuery(apiNamespace?.[method]);

  if (!count || count === 0) return null;

  return (
    <Badge
      variant={color}
      className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full p-0 text-xs"
    >
      {count > 99 ? "99+" : count}
    </Badge>
  );
}
