import { Star } from "lucide-react";

import { Badge } from "../../ui/badge";
import { CardHeader, CardTitle } from "../../ui/card";
import type { TeamCardData } from "./types";

export function Header({ data }: { data: TeamCardData }) {
  const { team, memberCount, isUserMember } = data;
  const isFull = team.maxMembers != null && memberCount >= team.maxMembers;

  return (
    <CardHeader className="px-4 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <CardTitle className="flex items-center gap-1.5 text-base">
          {team.name}
          {isUserMember && (
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
          )}
        </CardTitle>
        <Badge variant={team.joinPolicy === "open" ? "success" : "neutral"}>
          {team.joinPolicy === "open" ? "Open" : "Closed"}
        </Badge>
        {isFull && <Badge variant="error">Full</Badge>}
      </div>
    </CardHeader>
  );
}
