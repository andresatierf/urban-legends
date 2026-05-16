import { Crown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { TeamCardData } from "./types";

type Props = {
  data: TeamCardData;
};

export function ViewerRoleBadge({ data }: Props) {
  if (!data.userRole) return null;
  const isCaptain = data.userRole === "captain";
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
