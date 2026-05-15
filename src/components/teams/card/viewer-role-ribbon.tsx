import { Crown } from "lucide-react";

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
    <div
      aria-label={`You are ${userRole} of this team`}
      className={cn(
        "border-ink absolute -top-2 -right-2 z-10 flex items-center gap-1 rounded-md border-2 px-2 py-0.5 font-mono text-[0.6rem] font-bold tracking-widest uppercase shadow-sm",
        isCaptain ? "bg-warning text-ink" : "bg-sky text-paper",
      )}
    >
      {isCaptain && <Crown className="size-2.5" />}
      {isCaptain ? "Captain" : "You"}
    </div>
  );
}
