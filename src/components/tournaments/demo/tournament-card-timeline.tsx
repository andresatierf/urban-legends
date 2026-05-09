import {
  BarChart3,
  ChevronRight,
  Edit,
  Shield,
  Star,
  Trophy,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type { TournamentWithAuthority } from "../../../../convex/tournaments";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import { Progress } from "../../ui/progress";
import {
  type TournamentStatus,
  daysUntil,
  formatShortDate,
  getProgress,
  getStatus,
} from "./tournament-card-utils";

type Props = {
  tournament: TournamentWithAuthority;
};

const STATUS_CONFIG: Record<
  TournamentStatus,
  {
    label: string;
    badgeVariant: "default" | "outline" | "secondary";
    progressClass: string;
  }
> = {
  active: {
    label: "Active",
    badgeVariant: "default",
    progressClass: "",
  },
  upcoming: {
    label: "Upcoming",
    badgeVariant: "outline",
    progressClass: "[&>[data-slot=progress-indicator]]:bg-muted-foreground/30",
  },
  ended: {
    label: "Ended",
    badgeVariant: "secondary",
    progressClass: "[&>[data-slot=progress-indicator]]:bg-muted-foreground/40",
  },
};

export function TournamentCardTimeline({ tournament }: Props) {
  const status = getStatus(tournament);
  const progress = getProgress(tournament);
  const { authority, teamCount } = tournament;
  const config = STATUS_CONFIG[status];

  let timeLabel: string;
  if (status === "active")
    timeLabel = `${daysUntil(tournament.endDate)} days remaining`;
  else if (status === "upcoming")
    timeLabel = `Starts ${formatShortDate(tournament.startDate, { year: true })}`;
  else
    timeLabel = `Ended ${formatShortDate(tournament.endDate, { year: true })}`;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        {/* Header: badge + team count */}
        <div className="flex items-center justify-between">
          <Badge variant={config.badgeVariant}>{config.label}</Badge>
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <Users className="h-3 w-3" />
            {teamCount}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-heading text-sm leading-tight font-medium">
          {tournament.name}
        </h3>

        {/* Timeline bar */}
        <div className="flex flex-col gap-1.5">
          <Progress
            value={progress}
            className={cn("h-2", config.progressClass)}
          />
          <div className="flex items-center justify-between text-[0.625rem]">
            <span className="text-muted-foreground">
              {formatShortDate(tournament.startDate, { year: true })}
            </span>
            <span
              className={cn(
                "font-medium",
                status === "active" ? "text-primary" : "text-muted-foreground",
              )}
            >
              {timeLabel}
            </span>
            <span className="text-muted-foreground">
              {formatShortDate(tournament.endDate, { year: true })}
            </span>
          </div>
        </div>

        {/* Description */}
        {tournament.description && (
          <p className="text-muted-foreground line-clamp-2 text-xs">
            {tournament.description}
          </p>
        )}

        {/* Team highlight block */}
        {authority.team && (
          <div
            className={cn(
              "rounded-lg px-3 py-2.5",
              status === "active"
                ? "bg-primary/5 ring-primary/20 ring-1"
                : "bg-muted/50",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">{authority.team.name}</span>
              {authority.team.isCaptain && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-0.5"
                >
                  <Shield className="h-2.5 w-2.5" />
                  Captain
                </Badge>
              )}
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <Star className="text-primary h-3 w-3" />
                <span className="font-semibold">{authority.team.points}</span>
                <span className="text-muted-foreground">pts</span>
              </span>
              <span className="text-muted-foreground">
                {authority.team.approvedSubmissions}/
                {authority.team.totalSubmissions} approved
              </span>
            </div>
          </div>
        )}

        {/* Review queue */}
        {authority.canReview && authority.pendingReviewCount > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-primary flex h-5 w-5 items-center justify-center rounded-full">
              <Trophy className="text-primary-foreground h-3 w-3" />
            </span>
            <span className="font-medium">
              {authority.pendingReviewCount} pending review
              {authority.pendingReviewCount !== 1 && "s"}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="bg-muted/30 mt-auto flex gap-1 rounded-lg p-1">
          {authority.canManage ? (
            <>
              <Button variant="ghost" size="sm" className="flex-1">
                <Edit className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button variant="ghost" size="sm" className="flex-1">
                <BarChart3 className="h-3.5 w-3.5" />
                Leaderboard
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" className="flex-1">
              Browse Teams
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
