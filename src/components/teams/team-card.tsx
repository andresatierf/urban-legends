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
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
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

  const isFull = team.maxMembers != null && memberCount >= team.maxMembers;
  const fillPct = team.maxMembers
    ? Math.min(100, (memberCount / team.maxMembers) * 100)
    : 0;

  const sortedMembers = members
    ? [...members].sort((a, b) =>
        a.memberRole === "captain" ? -1 : b.memberRole === "captain" ? 1 : 0,
      )
    : [];
  const captain = sortedMembers.find((m) => m.memberRole === "captain");
  const visibleMembers = sortedMembers.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = sortedMembers.length - visibleMembers.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{team.name}</CardTitle>
          <Badge variant={team.joinPolicy === "open" ? "default" : "secondary"}>
            {team.joinPolicy === "open" ? "Open" : "Closed"}
          </Badge>
          {isFull && <Badge variant="destructive">Full</Badge>}
        </div>
        <CardAction>
          <span className="text-muted-foreground text-right text-xs tabular-nums">
            {team.points.toLocaleString()} pts
          </span>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {tournament && (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Trophy className="size-3.5 shrink-0" />
            <Link
              to="/tournaments/$tournamentId"
              params={{ tournamentId: tournament._id }}
              className="truncate hover:underline"
            >
              {tournament.name}
            </Link>
            <span className="ml-auto shrink-0">
              {getStatusBadge(tournament)}
            </span>
          </div>
        )}

        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <Users className="size-3.5 shrink-0" />
          <span>
            {memberCount}
            {team.maxMembers ? ` / ${team.maxMembers}` : ""} members
          </span>
          {team.maxMembers && (
            <div className="bg-muted ml-auto h-1.5 w-16 overflow-hidden rounded-full">
              <div
                className={`h-full rounded-full ${isFull ? "bg-destructive" : "bg-primary"}`}
                style={{ width: `${fillPct}%` }}
              />
            </div>
          )}
        </div>

        {sortedMembers.length > 0 && (
          <div className="flex items-center gap-2">
            <AvatarGroup>
              {visibleMembers.map((m) => (
                <Avatar key={m._id} size="sm">
                  <AvatarFallback>{getInitials(m.name)}</AvatarFallback>
                </Avatar>
              ))}
              {overflow > 0 && <AvatarGroupCount>+{overflow}</AvatarGroupCount>}
            </AvatarGroup>
            {captain && (
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Crown className="size-3 text-amber-500" />
                <span className="max-w-24 truncate">{captain.name}</span>
              </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        {isUserMember ? (
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to="/teams/$teamId" params={{ teamId: team._id }}>
              Manage
            </Link>
          </Button>
        ) : (
          <>
            <JoinTeamFormButton
              teamId={team._id}
              team={team}
              currentMemberCount={memberCount}
              isUserMember={isUserMember}
              isUserInTeam={isUserInTeam}
              size="sm"
            />
            <Button variant="outline" size="sm" asChild>
              <Link to="/teams/$teamId" params={{ teamId: team._id }}>
                View
              </Link>
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

export function TeamCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">
            <Skeleton className="h-5 w-32" />
          </CardTitle>
          <Skeleton className="h-4 w-12" />
        </div>
        <CardAction>
          <Skeleton className="h-4 w-12" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-6 w-32" />
      </CardContent>
      <CardFooter className="gap-2">
        <Skeleton className="h-7 flex-1" />
        <Skeleton className="h-7 w-16" />
      </CardFooter>
    </Card>
  );
}
