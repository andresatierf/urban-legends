import { Trophy } from "lucide-react";

import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

import type { TeamCardData } from "./types";

export function RoleBanner({ data }: { data: TeamCardData }) {
  if (!data.userRole) return null;

  const isCaptain = data.userRole === "captain";

  return (
    <div
      className={cn(
        "border-ink shadow-fd-xs flex items-center gap-2 rounded-md border-2 px-3 py-1.5",
        isCaptain && "bg-warning/15",
      )}
    >
      <Trophy
        className={cn(
          "size-3.5",
          isCaptain ? "text-warning" : "text-muted-foreground",
        )}
      />
      <Eyebrow color={isCaptain ? "gold" : "mute"}>{data.userRole}</Eyebrow>
      <span className="text-metric text-muted-foreground ml-auto text-sm">
        {data.team.points.toLocaleString()} pts
      </span>
    </div>
  );
}
