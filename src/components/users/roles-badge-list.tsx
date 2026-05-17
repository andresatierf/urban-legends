"use client";

import { useQuery } from "convex/react";
import { X } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { api } from "../../../convex/_generated/api";

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

export function RolesBadgeList({
  roles,
  editable = false,
  onRemove,
  className,
}: RolesBadgeListProps) {
  const rolesData = useQuery(api.role.admin.listRoles);

  // Create a map of role name to role data
  const roleMap = useMemo(() => {
    const map = new Map<string, { displayName: string; hierarchy: number }>();
    rolesData?.forEach((role) => {
      map.set(role.name, {
        displayName: role.displayName,
        hierarchy: role.hierarchy ?? 999,
      });
    });
    return map;
  }, [rolesData]);

  // Sort roles by hierarchy
  const sortedRoles = useMemo(() => {
    return [...roles].sort((a, b) => {
      const hierarchyA = roleMap.get(a)?.hierarchy ?? 999;
      const hierarchyB = roleMap.get(b)?.hierarchy ?? 999;
      return hierarchyA - hierarchyB;
    });
  }, [roles, roleMap]);

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {sortedRoles.map((role) => {
        const roleData = roleMap.get(role);
        const displayName = roleData?.displayName || role;

        return (
          <Badge
            key={role}
            variant={roleVariants[role] || "neutral"}
            className="flex items-center gap-1"
          >
            <span>{displayName}</span>
            {editable && onRemove && (
              <Button
                variant="ghost"
                size="sm"
                className="h-3 w-3 rounded-sm p-0 hover:bg-transparent"
                onClick={(e) => {
                  e.preventDefault();
                  onRemove(role);
                }}
                aria-label={`Remove ${displayName} role`}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </Badge>
        );
      })}
      {roles.length === 0 && (
        <span className="text-muted-foreground text-sm">No roles assigned</span>
      )}
    </div>
  );
}
