import { Crown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { TeamCardData } from "./types";

export function ViewerRoleRibbon({
  userRole,
}: {
  userRole: TeamCardData["userRole"];
}) {
  if (!userRole) return null;
  const isCaptain = userRole === "captain";
  return (
    <Badge
      variant="info"
      className={cn(
        "bg-sky text-paper! text-label-caps font-bold tracking-widest",
        { "bg-warning text-ink!": isCaptain },
      )}
    >
      {isCaptain && <Crown className="size-2.5" />}
      {isCaptain ? "Captain" : "You"}
    </Badge>
  );
}
