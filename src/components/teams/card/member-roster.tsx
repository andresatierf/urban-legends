import { Crown } from "lucide-react";

import { Avatar, AvatarFallback } from "../../ui/avatar";
import { getInitials } from "../../users/utils";
import type { TeamCardData } from "./types";

const MAX_VISIBLE_MEMBERS = 4;

export function MemberRoster({ data }: { data: TeamCardData }) {
  const sorted = [...data.members].sort((a, b) =>
    a.memberRole === "captain" ? -1 : b.memberRole === "captain" ? 1 : 0,
  );
  const visible = sorted.slice(0, MAX_VISIBLE_MEMBERS);
  const overflow = sorted.length - visible.length;

  if (visible.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {visible.map((m) => (
        <div key={m._id} className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback className="text-[0.5rem]">
              {getInitials(m.name)}
            </AvatarFallback>
          </Avatar>
          <span className="flex-1 truncate text-xs">{m.name}</span>
          {m.memberRole === "captain" && (
            <Crown className="size-3 shrink-0 text-amber-500" />
          )}
        </div>
      ))}
      {overflow > 0 && (
        <p className="text-muted-foreground text-[0.625rem]">
          +{overflow} more member{overflow === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}
