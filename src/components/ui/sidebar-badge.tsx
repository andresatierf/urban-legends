"use client";

import { useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import { useMemo } from "react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "./badge";

interface SidebarBadgeProps {
  query: string;
  color?: "default" | "destructive" | "secondary" | "outline";
}

export function SidebarBadge({ query, color = "default" }: SidebarBadgeProps) {
  // Parse and validate query string at render time (not conditionally)
  const apiMethod = useMemo(() => {
    if (!query.includes(".")) {
      console.error(
        `Invalid badge query format: "${query}". Expected "namespace.method"`,
      );
      return null;
    }

    const [namespace, method] = query.split(".");

    // Validate namespace exists in API
    const apiNamespace = api[namespace as keyof typeof api];
    if (!apiNamespace || typeof apiNamespace !== "object") {
      console.error(`Invalid namespace in badge query: "${namespace}"`);
      return null;
    }

    // Validate method exists in namespace
    const resolvedMethod = (
      apiNamespace as Record<string, FunctionReference<"query">>
    )[method];
    if (typeof resolvedMethod !== "object") {
      console.error(`Invalid method in badge query: "${namespace}.${method}"`);
      return null;
    }

    return resolvedMethod;
  }, [query]);

  const count = useQuery(apiMethod as FunctionReference<"query">);

  // Early returns after all hooks have been called
  if (!apiMethod) return null;
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
