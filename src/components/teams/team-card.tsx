import { Link } from "@tanstack/react-router";
import { Crown, Trophy, Users } from "lucide-react";

import type { Doc } from "../../../convex/_generated/dataModel";
import { JoinTeamFormButton } from "../form/join-team-form-button";
import { getStatusBadge } from "../tournaments/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

type MemberPreview = {
  _id: string;
  name: string;
  memberRole: "captain" | "member";
};

type Props = {
  team: Doc<"teams">;
  tournament?: Doc<"tournaments">;
  memberCount: number;
  isUserMember: boolean;
  isUserInTeam: boolean;
  members?: MemberPreview[];
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const MAX_VISIBLE_AVATARS = 5;

export function TeamCard({
  team,
  tournament,
  memberCount,
  isUserMember,
  isUserInTeam,
  members,
}: Props) {
  if (!team) return <TeamCardSkeleton />;

  const isFull = team.maxMembers && memberCount >= team.maxMembers;

  const showRoster = members && members.length > 0;

  const sortedMembers = showRoster
    ? [...members].sort((a, b) =>
        a.memberRole === "captain" ? -1 : b.memberRole === "captain" ? 1 : 0,
      )
    : [];

  const visibleMembers = sortedMembers.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = sortedMembers.length - visibleMembers.length;

  return (
    <Card key={team._id}>
      <CardContent className="xs:flex-row flex flex-col items-center justify-between gap-4">
        <div className="flex flex-1 flex-col justify-between self-start">
          <div className="flex items-center gap-2">
            <CardTitle>{team.name}</CardTitle>
            <Badge
              variant={team.joinPolicy === "open" ? "default" : "secondary"}
            >
              {team.joinPolicy === "open" ? "Open" : "Closed"}
            </Badge>
            {isFull && <Badge variant="destructive">Full</Badge>}
          </div>
          <CardDescription className="mt-2">
            {tournament && (
              <div className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4" />
                <Link
                  to="/tournaments/$tournamentId"
                  params={{ tournamentId: tournament._id }}
                  className="hover:underline"
                >
                  {tournament.name}
                </Link>
                {getStatusBadge(tournament)}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {memberCount}
              {team.maxMembers ? ` / ${team.maxMembers} ` : " "}
              members
            </div>
            {showRoster && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <AvatarGroup>
                  {visibleMembers.map((m) => (
                    <Avatar key={m._id} size="sm">
                      <AvatarFallback>{getInitials(m.name)}</AvatarFallback>
                    </Avatar>
                  ))}
                  {overflow > 0 && (
                    <AvatarGroupCount>+{overflow}</AvatarGroupCount>
                  )}
                </AvatarGroup>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  {sortedMembers.map((m) => (
                    <span
                      key={m._id}
                      className="flex items-center gap-1 text-xs"
                    >
                      <span className="max-w-[8rem] truncate">{m.name}</span>
                      {m.memberRole === "captain" && (
                        <Crown className="h-3 w-3 shrink-0 text-amber-500" />
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardDescription>
        </div>
        <div className="xs:flex-col flex flex-wrap gap-2">
          <JoinTeamFormButton
            teamId={team._id}
            team={team}
            currentMemberCount={memberCount}
            isUserMember={isUserMember}
            isUserInTeam={isUserInTeam}
          />
          <Button variant="outline" asChild>
            <Link to="/teams/$teamId" params={{ teamId: team._id }}>
              View
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function TeamCardSkeleton() {
  return (
    <Card>
      <CardContent className="xs:flex-row flex flex-col items-center justify-between gap-4">
        <div className="flex flex-1 flex-col justify-between self-start">
          <div className="flex items-center gap-2">
            <CardTitle>
              <Skeleton className="h-6 w-40" />
            </CardTitle>
          </div>
          <CardDescription className="mt-2 flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-32" />
            </div>
          </CardDescription>
        </div>
        <div className="xs:flex-col flex flex-wrap gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
        </div>
      </CardContent>
    </Card>
  );
}
