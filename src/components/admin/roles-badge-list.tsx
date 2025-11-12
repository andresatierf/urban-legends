"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RolesBadgeListProps {
  roles: string[];
  editable?: boolean;
  onRemove?: (roleName: string) => void;
  className?: string;
}

const roleVariants: Record<string, string> = {
  admin: "border-red-200 bg-red-100 text-red-800 hover:bg-red-100/80",
  user: "border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-100/80",
  moderator:
    "border-purple-200 bg-purple-100 text-purple-800 hover:bg-purple-100/80",
};

export function RolesBadgeList({
  roles,
  editable = false,
  onRemove,
  className,
}: RolesBadgeListProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {roles.map((role) => (
        <Badge
          key={role}
          className={cn(
            roleVariants[role] || "border-gray-200 bg-gray-100 text-gray-800",
            "flex items-center gap-1",
          )}
        >
          <span>{role}</span>
          {editable && onRemove && (
            <Button
              variant="ghost"
              size="sm"
              className="h-3 w-3 rounded-sm p-0 hover:bg-transparent"
              onClick={(e) => {
                e.preventDefault();
                onRemove(role);
              }}
              aria-label={`Remove ${role} role`}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </Badge>
      ))}
      {roles.length === 0 && (
        <span className="text-muted-foreground text-sm">No roles assigned</span>
      )}
    </div>
  );
}
