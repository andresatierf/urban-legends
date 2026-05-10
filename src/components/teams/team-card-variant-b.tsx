import {
  Crown,
  LogOut,
  Settings,
  Star,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type { TeamDemoItem } from "../team-card-demo-fixtures";
import { getTournamentStatus } from "../tournaments/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500",
  upcoming: "bg-blue-500",
  ended: "bg-muted-foreground",
};

export function TeamCardVariantB({ item }: { item: TeamDemoItem }) {
  const { team, tournament, members, memberCount, isUserMember, userRole } =
    item;
  const isFull = team.maxMembers != null && memberCount >= team.maxMembers;
  const fillPct = team.maxMembers
    ? Math.min(100, (memberCount / team.maxMembers) * 100)
    : 0;
  const status = getTournamentStatus(tournament);

  const sorted = [...members].sort((a, b) =>
    a.memberRole === "captain" ? -1 : b.memberRole === "captain" ? 1 : 0,
  );

  return (
    <div className="bg-card text-card-foreground ring-foreground/10 overflow-hidden rounded-lg ring-1">
      {/* Colored header band */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-2",
          STATUS_COLORS[status],
        )}
      >
        <span className="text-xs font-medium text-white">
          {tournament.name}
        </span>
        <span className="text-[0.625rem] text-white/80">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {/* Team identity */}
      <div className="flex items-start justify-between px-4 pt-3">
        <div className="flex items-center gap-2">
          <h3 className="font-heading text-base font-medium">{team.name}</h3>
          {isUserMember && (
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
          )}
        </div>
        <div className="flex gap-1.5">
          <Badge variant={team.joinPolicy === "open" ? "default" : "secondary"}>
            {team.joinPolicy === "open" ? "Open" : "Closed"}
          </Badge>
          {isFull && <Badge variant="destructive">Full</Badge>}
        </div>
      </div>

      {/* Stats grid */}
      <div className="mx-4 mt-3 grid grid-cols-3 divide-x rounded-md border text-center">
        <div className="py-2">
          <div className="text-sm font-semibold tabular-nums">
            {memberCount}
          </div>
          <div className="text-muted-foreground text-[0.625rem]">
            {team.maxMembers ? `of ${team.maxMembers}` : "Members"}
          </div>
        </div>
        <div className="py-2">
          <div className="text-sm font-semibold tabular-nums">
            {team.points.toLocaleString()}
          </div>
          <div className="text-muted-foreground text-[0.625rem]">Points</div>
        </div>
        <div className="py-2">
          <div className="text-sm font-semibold tabular-nums">
            {team.maxMembers ? `${Math.round(fillPct)}%` : "—"}
          </div>
          <div className="text-muted-foreground text-[0.625rem]">Capacity</div>
        </div>
      </div>

      {/* Capacity bar */}
      {team.maxMembers && (
        <div className="mx-4 mt-2">
          <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isFull ? "bg-destructive" : "bg-primary",
              )}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Member roster */}
      <div className="mx-4 mt-3 space-y-1.5">
        {sorted.slice(0, 4).map((m) => (
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
        {sorted.length > 4 && (
          <p className="text-muted-foreground text-[0.625rem]">
            +{sorted.length - 4} more members
          </p>
        )}
      </div>

      {/* Role badge */}
      {userRole && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-md border px-3 py-1.5">
          <Trophy className="text-muted-foreground size-3.5" />
          <span className="text-xs">
            Your role:{" "}
            <span className="font-medium capitalize">{userRole}</span>
          </span>
          <span className="text-muted-foreground ml-auto text-xs tabular-nums">
            {team.points.toLocaleString()} pts
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 px-4 py-3">
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
              className={cn(
                isFull || team.joinPolicy === "closed" ? "flex-1" : "",
              )}
            >
              View
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
