import {
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit,
  FileText,
  Shield,
  Trophy,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type { TournamentWithAuthority } from "../../../../convex/tournaments";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";

type Props = {
  tournament: TournamentWithAuthority;
};

function getStatus(t: { startDate: string; endDate: string }) {
  const now = Date.now();
  const start = new Date(t.startDate).getTime();
  const end = new Date(t.endDate).getTime();
  if (start > now) return "upcoming" as const;
  if (end < now) return "ended" as const;
  return "active" as const;
}

function daysUntil(iso: string) {
  return Math.ceil(
    (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

function formatShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

const HEADER_BG = {
  active: "bg-primary text-primary-foreground",
  upcoming: "bg-muted text-muted-foreground",
  ended: "bg-secondary text-secondary-foreground",
} as const;

const STATUS_LABEL = {
  active: "Active",
  upcoming: "Upcoming",
  ended: "Ended",
} as const;

export function TournamentCardStats({ tournament }: Props) {
  const status = getStatus(tournament);
  const { authority, teamCount } = tournament;

  const daysLeft =
    status === "active"
      ? daysUntil(tournament.endDate)
      : status === "upcoming"
        ? daysUntil(tournament.startDate)
        : 0;

  return (
    <Card className="gap-0 py-0">
      {/* Status header band */}
      <div
        className={cn(
          "flex items-center justify-between rounded-t-lg px-4 py-2.5",
          HEADER_BG[status],
        )}
      >
        <span className="text-xs font-semibold tracking-wider uppercase">
          {STATUS_LABEL[status]}
        </span>
        <span className="flex items-center gap-1 text-xs">
          <Calendar className="h-3 w-3" />
          {formatShort(tournament.startDate)} –{" "}
          {formatShort(tournament.endDate)}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 px-4 py-3">
        {/* Title */}
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

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          <StatCell
            Icon={Users}
            value={teamCount}
            label={teamCount === 1 ? "Team" : "Teams"}
          />
          <StatCell
            Icon={Clock}
            value={status === "ended" ? "—" : `${daysLeft}d`}
            label={
              status === "active"
                ? "Left"
                : status === "upcoming"
                  ? "Until start"
                  : "Ended"
            }
          />
          <StatCell
            Icon={Trophy}
            value={authority.team ? authority.team.points : "—"}
            label="Points"
          />
        </div>

        {/* Team membership card */}
        {authority.team && (
          <div className="rounded-md border">
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
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {authority.team.approvedSubmissions} approved
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {authority.team.totalSubmissions} total
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Review callout */}
        {authority.canReview && authority.pendingReviewCount > 0 && (
          <div className="bg-destructive/10 text-destructive flex items-center justify-center gap-2 rounded-md py-2 text-xs font-medium">
            <Trophy className="h-3.5 w-3.5" />
            {authority.pendingReviewCount} submission
            {authority.pendingReviewCount !== 1 && "s"} awaiting review
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {authority.canManage ? (
            <>
              <Button variant="outline" size="sm" className="flex-1">
                <Edit className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <BarChart3 className="h-3.5 w-3.5" />
                Leaderboard
              </Button>
            </>
          ) : (
            <Button size="sm" className="w-full">
              Browse Teams
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
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
