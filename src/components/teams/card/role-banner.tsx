import { Trophy } from "lucide-react";

import type { TeamCardData } from "./types";

export function RoleBanner({ data }: { data: TeamCardData }) {
  if (!data.userRole) return null;

  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-1.5">
      <Trophy className="text-muted-foreground size-3.5" />
      <span className="text-xs">
        Your role:{" "}
        <span className="font-medium capitalize">{data.userRole}</span>
      </span>
      <span className="text-muted-foreground ml-auto text-xs tabular-nums">
        {data.team.points.toLocaleString()} pts
      </span>
    </div>
  );
}
