import { Crown } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { getInitials } from "../../users/utils";
import type { TeamCardData } from "./types";

export function CaptainSpotlight({ data }: { data: TeamCardData }) {
  const captain = data.members.find((m) => m.memberRole === "captain");
  const crew = data.members.filter((m) => m.memberRole !== "captain");
  const [expanded, setExpanded] = useState(false);

  if (!captain) {
    return (
      <div className="text-muted-foreground text-[0.65rem]">
        {data.memberCount} member{data.memberCount === 1 ? "" : "s"} · no
        captain
      </div>
    );
  }

  return (
    <div className="border-ink/15 flex flex-col gap-2 rounded-md border p-2">
      <div className="flex items-center gap-2.5">
        <Avatar size="default">
          <AvatarFallback className="bg-warning/15 text-xs">
            {getInitials(captain.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <Crown className="size-3 shrink-0 text-amber-500" />
            <span className="truncate text-xs font-semibold">
              {captain.name}
            </span>
          </div>
          {crew.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="text-muted-foreground hover:text-ink flex items-center gap-1 self-start text-[0.65rem] transition-colors"
            >
              <span>{expanded ? "Hide" : "+"}</span>
              <span>
                {crew.length} teammate{crew.length === 1 ? "" : "s"}
              </span>
            </button>
          )}
        </div>
      </div>
      {expanded && crew.length > 0 && (
        <ul className="border-ink/10 grid grid-cols-2 gap-x-2 gap-y-1 border-t pt-2">
          {crew.map((m) => (
            <li
              key={m._id}
              className="flex items-center gap-1.5 truncate text-[0.7rem]"
            >
              <Avatar size="sm">
                <AvatarFallback className="text-[0.5rem]">
                  {getInitials(m.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{m.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
