import {
  Crown,
  LogOut,
  Settings,
  Shield,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type { TeamDemoItem } from "../team-card-demo-fixtures";
import { getStatusBadge } from "../tournaments/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { getInitials } from "../users/utils";

export function TeamCardVariantC({ item }: { item: TeamDemoItem }) {
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

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-center gap-3">
          {/* Team avatar */}
          <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold">
            {team.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">{team.name}</CardTitle>
            <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
              <Trophy className="size-3 shrink-0" />
              <span className="truncate">{tournament.name}</span>
              {getStatusBadge(tournament)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={team.joinPolicy === "open" ? "default" : "secondary"}>
            <Shield className="size-3" />
            {team.joinPolicy === "open" ? "Open" : "Closed"}
          </Badge>
          {isFull && <Badge variant="destructive">Full</Badge>}
          {userRole && (
            <Badge variant="outline">
              {userRole === "captain" ? (
                <>
                  <Crown className="size-3" />
                  Captain
                </>
              ) : (
                "Member"
              )}
            </Badge>
          )}
          <span className="text-muted-foreground ml-auto text-xs tabular-nums">
            {team.points.toLocaleString()} pts
          </span>
        </div>

        {/* Capacity bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Users className="size-3" />
              {memberCount}
              {team.maxMembers ? ` / ${team.maxMembers}` : ""} members
            </span>
            {team.maxMembers && (
              <span
                className={cn(
                  "text-[0.625rem] tabular-nums",
                  isFull ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {Math.round(fillPct)}%
              </span>
            )}
          </div>
          {team.maxMembers && (
            <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isFull ? "bg-destructive" : "bg-primary",
                )}
                style={{ width: `${fillPct}%` }}
              />
            </div>
          )}
        </div>

        {/* Member list with dividers */}
        <div className="divide-y">
          {sorted.slice(0, 5).map((m) => (
            <div
              key={m._id}
              className="flex items-center gap-2.5 py-1.5 first:pt-0 last:pb-0"
            >
              <Avatar size="sm">
                <AvatarFallback className="text-[0.5rem]">
                  {getInitials(m.name)}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate text-xs">{m.name}</span>
              {m.memberRole === "captain" ? (
                <Badge variant="outline" className="text-[0.625rem]">
                  <Crown className="size-2.5 text-amber-500" />
                  Captain
                </Badge>
              ) : (
                <span className="text-muted-foreground text-[0.625rem]">
                  Member
                </span>
              )}
            </div>
          ))}
          {sorted.length > 5 && (
            <div className="text-muted-foreground pt-1.5 text-[0.625rem]">
              +{sorted.length - 5} more
            </div>
          )}
        </div>

        {/* Personal context banner */}
        {isUserMember && (
          <div className="bg-muted/50 -mx-1 flex items-center gap-2 rounded-md px-3 py-2">
            <span className="text-muted-foreground text-[0.625rem] tracking-wider uppercase">
              You
            </span>
            <span className="text-xs font-medium capitalize">{userRole}</span>
            {captain && userRole === "captain" && (
              <Crown className="size-3 text-amber-500" />
            )}
            <span className="text-muted-foreground ml-auto text-xs tabular-nums">
              {team.points.toLocaleString()} pts
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-wrap gap-2">
        {isUserMember ? (
          <>
            <Button variant="default" size="sm" className="flex-1">
              <Settings className="size-3.5" />
              Manage
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              View
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
                Join Team
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className={cn(
                isFull || team.joinPolicy === "closed" ? "flex-1" : "",
              )}
            >
              View Team
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
