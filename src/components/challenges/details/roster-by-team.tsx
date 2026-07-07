import { Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInitials } from "@/components/users/utils";

import type { ChallengeDetailsData } from "./types";

const UNASSIGNED = "__unassigned__";

export function RosterByTeam({ data }: { data: ChallengeDetailsData }) {
  const groups = new Map<
    string,
    {
      teamId: string;
      teamName: string;
      members: ChallengeDetailsData["roster"];
    }
  >();
  for (const entry of data.roster) {
    const teamId = entry.teamId ?? UNASSIGNED;
    const teamName = entry.teamName ?? "No team";
    const bucket = groups.get(teamId) ?? { teamId, teamName, members: [] };
    bucket.members.push(entry);
    groups.set(teamId, bucket);
  }
  const sortedGroups = Array.from(groups.values()).sort((a, b) =>
    a.teamName.localeCompare(b.teamName),
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-body-md flex items-center gap-2">
          <Users className="size-4" />
          Roster
        </CardTitle>
        <Badge variant="neutral">
          {data.roster.length}{" "}
          {data.roster.length === 1 ? "participant" : "participants"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedGroups.length === 0 ? (
          <p className="text-body-md text-muted-foreground">
            No participants have been added to this Challenge yet.
          </p>
        ) : (
          sortedGroups.map((group) => (
            <div key={group.teamId} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{group.teamName}</p>
                <span className="text-muted-foreground text-xs">
                  {group.members.length}{" "}
                  {group.members.length === 1 ? "member" : "members"}
                </span>
              </div>
              <ul className="flex flex-col gap-1">
                {group.members.map((m) => (
                  <li
                    key={m.userId}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5"
                  >
                    <Avatar size="default">
                      {m.imageUrl && (
                        <AvatarImage src={m.imageUrl} alt={m.name} />
                      )}
                      <AvatarFallback className="text-xs">
                        {getInitials(m.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-sm">{m.name}</div>
                      <div className="text-muted-foreground truncate text-xs">
                        {m.email}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
