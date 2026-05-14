"use client";

import { useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";

import { Badge } from "./badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

interface SidebarBadgeProps {
  query: FunctionReference<"query">;
  color?: "success" | "warning" | "error" | "info" | "social" | "neutral";
  tooltip?: string;
}

export function SidebarBadge({
  query,
  color = "neutral",
  tooltip,
}: SidebarBadgeProps) {
  // query is already a valid FunctionReference<"query">
  const count = useQuery(query);

  // Early returns after all hooks have been called
  if (!count || count === 0) return null;

  const InnerBadge = (
    <Badge
      variant={color}
      className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs tracking-normal"
    >
      {count > 99 ? "99+" : count}
    </Badge>
  );

  if (!tooltip) return InnerBadge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{InnerBadge}</TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
