import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Clock,
  Edit,
  Shield,
  Star,
  Trophy,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useFormattedDate } from "@/hooks/useFormattedDate";
import { cn } from "@/lib/utils";

import type { TournamentWithAuthority } from "../../../convex/tournaments";
import {
  daysUntil,
  getTournamentStatus,
  type TournamentStatus,
  tournamentProgress,
} from "./utils";

const HEADER_BG: Record<TournamentStatus, string> = {
  active: "bg-primary text-primary-foreground",
  upcoming: "bg-muted text-muted-foreground",
  ended: "bg-secondary text-secondary-foreground",
};

const STATUS_LABEL: Record<TournamentStatus, string> = {
  active: "Active",
  upcoming: "Upcoming",
  ended: "Ended",
};

const DAYS_LABEL: Record<TournamentStatus, string> = {
  active: "Left",
  upcoming: "Until start",
  ended: "Ended",
};

const PROGRESS_CLASS: Record<TournamentStatus, string> = {
  active: "",
  upcoming: "[&>[data-slot=progress-indicator]]:bg-muted-foreground/30",
  ended: "[&>[data-slot=progress-indicator]]:bg-muted-foreground/40",
};

export function TournamentOverviewCard({
  tournament,
}: {
  tournament: TournamentWithAuthority;
}) {
  const { format } = useFormattedDate();
  const status = getTournamentStatus(tournament);
  const progress = tournamentProgress(tournament);
  const { authority, teamCount } = tournament;

  let timeLabel: string;
  if (status === "active")
    timeLabel = `${daysUntil(tournament.endDate)} days remaining`;
  else if (status === "upcoming")
    timeLabel = `Starts ${format(tournament.startDate, "long")}`;
  else timeLabel = `Ended ${format(tournament.endDate, "long")}`;

  let daysValue: string | number = "—";
  if (status === "active") daysValue = `${daysUntil(tournament.endDate)}d`;
  else if (status === "upcoming")
    daysValue = `${daysUntil(tournament.startDate)}d`;

  return (
    <Card className="gap-0 py-0">
      {/* Status header band */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 rounded-t-lg px-4 py-2.5",
          HEADER_BG[status],
        )}
      >
        <span className="text-xs font-semibold tracking-wider uppercase">
          {STATUS_LABEL[status]}
        </span>
        <span className="text-xs whitespace-nowrap">
          {format(tournament.startDate, "long")} –{" "}
          {format(tournament.endDate, "long")}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 px-4 py-3">
        {/* Title + description */}
        <div>
          <h3 className="font-heading text-sm font-medium">
            {tournament.name}
          </h3>
          {tournament.description && (
            <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
              {tournament.description}
            </p>
          )}
        </div>

        {/* Timeline progress bar */}
        <div className="flex flex-col gap-1.5">
          <Progress
            value={progress}
            className={cn("h-2", PROGRESS_CLASS[status])}
          />
          <div
            className={cn(
              "text-center text-[0.625rem] font-medium",
              status === "active" ? "text-primary" : "text-muted-foreground",
            )}
          >
            {timeLabel}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          <StatCell
            Icon={Users}
            value={teamCount}
            label={teamCount === 1 ? "Team" : "Teams"}
          />
          <StatCell Icon={Clock} value={daysValue} label={DAYS_LABEL[status]} />
          <StatCell
            Icon={Trophy}
            value={authority.team ? authority.team.points : "—"}
            label="Points"
          />
        </div>

        {/* Team membership card */}
        {authority.team && (
          <Link
            to="/teams/$teamId"
            params={{ teamId: authority.team._id }}
            className="hover:bg-muted/30 block rounded-md border transition-colors"
          >
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">
                  {authority.team.name}
                </span>
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
            </div>
            <div className="border-t px-3 py-1.5">
              <div className="flex items-center justify-between text-xs">
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
          </Link>
        )}

        {/* Pending reviews */}
        {authority.canReview && authority.pendingReviewCount > 0 && (
          <Link
            to="/reviewer"
            className="bg-primary/10 text-primary hover:bg-primary/15 flex items-center gap-2 rounded px-2.5 py-1.5 text-xs font-medium transition-colors"
          >
            <Trophy className="h-3.5 w-3.5" />
            {authority.pendingReviewCount} pending review
            {authority.pendingReviewCount !== 1 && "s"}
          </Link>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {authority.canManage && (
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link to={`/admin/tournaments?edit=${tournament._id}` as never}>
                <Edit className="h-3.5 w-3.5" />
                Manage
              </Link>
            </Button>
          )}
          <Button size="sm" className="flex-1" asChild>
            <Link
              to="/tournaments/$tournamentId"
              params={{ tournamentId: tournament._id }}
            >
              {authority.team ? "View" : "Browse Teams"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function StatCell({
  Icon,
  value,
  label,
}: {
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  value: string | number;
  label: string;
}) {
  return (
    <div className="bg-muted/50 flex flex-col items-center rounded-md px-2 py-2">
      <Icon className="text-muted-foreground mb-1 h-3.5 w-3.5" />
      <span className="font-heading text-sm font-semibold">{value}</span>
      <span className="text-muted-foreground text-[0.625rem]">{label}</span>
    </div>
  );
}
