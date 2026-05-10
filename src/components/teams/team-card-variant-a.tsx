import { Crown, LogOut, Settings, Trophy, UserPlus, Users } from "lucide-react";

import type { TeamDemoItem } from "../team-card-demo-fixtures";
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
import { getInitials } from "../users/utils";

const MAX_VISIBLE = 5;

export function TeamCardVariantA({ item }: { item: TeamDemoItem }) {
  const { team, tournament, members, memberCount, isUserMember, userRole } =
    item;
  const isFull = team.maxMembers != null && memberCount >= team.maxMembers;
  const fillPct = team.maxMembers
    ? Math.min(100, (memberCount / team.maxMembers) * 100)
    : 0;

  const sorted = [...members].sort((a, b) =>
    a.memberRole === "captain" ? -1 : b.memberRole === "captain" ? 1 : 0,
  );
  const captain = sorted.find((m) => m.memberRole === "captain");
  const visible = sorted.slice(0, MAX_VISIBLE);
  const overflow = sorted.length - visible.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-1.5">
          <CardTitle className="text-base">{team.name}</CardTitle>
          <Badge variant={team.joinPolicy === "open" ? "default" : "secondary"}>
            {team.joinPolicy === "open" ? "Open" : "Closed"}
          </Badge>
          {isFull && <Badge variant="destructive">Full</Badge>}
          {userRole && (
            <Badge variant="outline">
              {userRole === "captain" ? "Captain" : "Member"}
            </Badge>
          )}
        </div>
        <CardAction>
          <span className="text-muted-foreground text-right text-xs tabular-nums">
            {team.points.toLocaleString()} pts
          </span>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <Trophy className="size-3.5 shrink-0" />
          <span className="truncate">{tournament.name}</span>
          <span className="ml-auto shrink-0">{getStatusBadge(tournament)}</span>
        </div>

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

        {sorted.length > 0 && (
          <div className="flex items-center gap-2">
            <AvatarGroup>
              {visible.map((m) => (
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
          <>
            <Button variant="outline" size="sm" className="flex-1">
              <Settings className="size-3.5" />
              Manage
            </Button>
            <Button variant="ghost" size="sm">
              <LogOut className="size-3.5" />
              Leave
            </Button>
          </>
        ) : (
          <>
            {!isFull && team.joinPolicy === "open" && (
              <Button size="sm" className="flex-1">
                <UserPlus className="size-3.5" />
                Join
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className={isFull || team.joinPolicy === "closed" ? "flex-1" : ""}
            >
              View
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
