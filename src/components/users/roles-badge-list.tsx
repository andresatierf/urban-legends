"use client";

import { useQuery } from "convex/react";
import { X } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { api } from "../../../convex/_generated/api";
import type { ResolvedRole } from "./types";

interface RolesBadgeListViewProps {
  resolvedRoles: ResolvedRole[];
  editable?: boolean;
  onRemove?: (roleName: string) => void;
  className?: string;
}

interface RolesBadgeListProps {
  roles: string[];
  editable?: boolean;
  onRemove?: (roleName: string) => void;
  className?: string;
}

const roleVariants: Record<
  string,
  "error" | "info" | "social" | "warning" | "success" | "neutral"
> = {
  admin: "warning",
  tournament_manager: "social",
  reviewer: "success",
  player: "info",
  viewer: "neutral",
};

export function RolesBadgeListView({
  resolvedRoles,
  editable = false,
  onRemove,
  className,
}: RolesBadgeListViewProps) {
  const sortedRoles = useMemo(() => {
    return [...resolvedRoles].sort((a, b) => a.hierarchy - b.hierarchy);
  }, [resolvedRoles]);

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {sortedRoles.map((role) => (
        <Badge
          key={role.name}
          variant={roleVariants[role.name] || "neutral"}
          className="flex items-center gap-1"
        >
          <span>{role.displayName}</span>
          {editable && onRemove && (
            <Button
              variant="ghost"
              size="sm"
              className="h-3 w-3 rounded-sm p-0 hover:bg-transparent"
              onClick={(e) => {
                e.preventDefault();
                onRemove(role.name);
              }}
              aria-label={`Remove ${role.displayName} role`}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </Badge>
      ))}
      {resolvedRoles.length === 0 && (
        <span className="text-muted-foreground text-sm">No roles assigned</span>
      )}
    </div>
  );
}

export function RolesBadgeList({
  roles,
  editable = false,
  onRemove,
  className,
}: RolesBadgeListProps) {
  const rolesData = useQuery(api.role.admin.listRoles);

  const resolvedRoles = useMemo<ResolvedRole[]>(() => {
    const map = new Map<string, { displayName: string; hierarchy: number }>();
    rolesData?.forEach((role) => {
      map.set(role.name, {
        displayName: role.displayName,
        hierarchy: role.hierarchy ?? 999,
      });
    });
    return roles.map((name) => {
      const data = map.get(name);
      return {
        name,
        displayName: data?.displayName || name,
        hierarchy: data?.hierarchy ?? 999,
      };
    });
  }, [roles, rolesData]);

  return (
    <RolesBadgeListView
      resolvedRoles={resolvedRoles}
      editable={editable}
      onRemove={onRemove}
      className={className}
    />
  );
}
