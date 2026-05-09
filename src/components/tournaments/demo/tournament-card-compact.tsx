import {
  BarChart3,
  Calendar,
  ChevronRight,
  Clock,
  Edit,
  Shield,
  Trophy,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type { TournamentWithAuthority } from "../../../../convex/tournaments";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import {
  type TournamentStatus,
  daysUntil,
  formatShortDate,
  getStatus,
} from "./tournament-card-utils";

type Props = {
  tournament: TournamentWithAuthority;
};

const BORDER_COLOR: Record<TournamentStatus, string> = {
  active: "border-l-primary",
  upcoming: "border-l-muted-foreground/40",
  ended: "border-l-muted-foreground/20",
};

const STATUS_BADGE: Record<
  TournamentStatus,
  { label: string; variant: "default" | "outline" | "secondary" }
> = {
  active: { label: "Active", variant: "default" },
  upcoming: { label: "Upcoming", variant: "outline" },
  ended: { label: "Ended", variant: "secondary" },
};

export function TournamentCardCompact({ tournament }: Props) {
  const status = getStatus(tournament);
  const { authority, teamCount } = tournament;
  const badge = STATUS_BADGE[status];

  let countdown: string | null = null;
  if (status === "active") countdown = `${daysUntil(tournament.endDate)}d left`;
  else if (status === "upcoming")
    countdown = `Starts in ${daysUntil(tournament.startDate)}d`;

  return (
    <Card className={cn("border-l-4", BORDER_COLOR[status])}>
      <CardContent className="flex flex-col gap-3">
        {/* Row 1: Title + status */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-heading truncate text-sm font-medium">
                {tournament.name}
              </span>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
            {tournament.description && (
              <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                {tournament.description}
              </p>
            )}
          </div>
        </div>

        {/* Row 2: Inline metadata chips */}
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {teamCount} team{teamCount !== 1 && "s"}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatShortDate(tournament.startDate)} –{" "}
            {formatShortDate(tournament.endDate)}
          </span>
          {countdown && (
            <span className="flex items-center gap-1 font-medium">
              <Clock className="h-3.5 w-3.5" />
              {countdown}
            </span>
          )}
        </div>

        {/* Row 3: Team membership strip */}
        {authority.team && (
          <div className="bg-muted/50 flex items-center justify-between gap-2 rounded px-2.5 py-1.5 text-xs">
            <div className="flex items-center gap-2">
              <Users className="text-muted-foreground h-3.5 w-3.5" />
              <span className="font-medium">{authority.team.name}</span>
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
            <span className="text-muted-foreground whitespace-nowrap">
              {authority.team.points} pts · {authority.team.approvedSubmissions}
              /{authority.team.totalSubmissions}
            </span>
          </div>
        )}

        {/* Row 4: Review callout */}
        {authority.canReview && authority.pendingReviewCount > 0 && (
          <div className="bg-primary/10 text-primary flex items-center gap-2 rounded px-2.5 py-1.5 text-xs font-medium">
            <Trophy className="h-3.5 w-3.5" />
            {authority.pendingReviewCount} pending review
            {authority.pendingReviewCount !== 1 && "s"}
          </div>
        )}

        {/* Row 5: Actions */}
        <div className="flex flex-wrap gap-2">
          {authority.canManage ? (
            <>
              <Button variant="outline" size="sm">
                <Edit className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-3.5 w-3.5" />
                Leaderboard
              </Button>
            </>
          ) : (
            <Button size="sm">
              Browse Teams
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
