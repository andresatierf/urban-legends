import {
  ArrowRight,
  Check,
  Clock,
  Crown,
  ImageIcon,
  type LucideIcon,
  Pencil,
  RefreshCw,
  Shield,
  Star,
  Trash2,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";

import { SectionHeader } from "@/components/section-header";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Image } from "@/components/ui/image";
import { Progress } from "@/components/ui/progress";
import { getInitials } from "@/components/users/utils";
import { cn } from "@/lib/utils";

import type { SubmissionDetailsData } from "./details-demo-fixtures";
import { managedByLabel } from "./review/submission-review-card-shared";

type StateKey = "pending" | "approved" | "rejected" | "deleted";

// Mirrors TournamentOverviewCard's HEADER_BG / STATUS_LABEL maps.
const HEADER_BG: Record<StateKey, string> = {
  approved: "bg-primary text-primary-foreground",
  pending: "bg-muted text-muted-foreground",
  rejected: "bg-destructive/15 text-destructive",
  deleted: "bg-secondary text-secondary-foreground",
};

const STATE_LABEL: Record<StateKey, string> = {
  approved: "Approved",
  pending: "Pending review",
  rejected: "Rejected",
  deleted: "Deleted",
};

const STATE_PROGRESS: Record<StateKey, number> = {
  pending: 33,
  approved: 100,
  rejected: 100,
  deleted: 100,
};

const PROGRESS_CLASS: Record<StateKey, string> = {
  approved: "",
  pending: "[&>[data-slot=progress-indicator]]:bg-muted-foreground/30",
  rejected: "[&>[data-slot=progress-indicator]]:bg-destructive/60",
  deleted: "[&>[data-slot=progress-indicator]]:bg-muted-foreground/40",
};

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatLongDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function SubmissionDetailsVariantF({
  data,
}: {
  data: SubmissionDetailsData;
}) {
  const { submission, team, tournament, submitter, teammates, managedByUser } =
    data;
  const state = submission.state as StateKey;
  const participants = [submitter, ...teammates];

  return (
    <>
      <SectionHeader as="h1" title="Submission Details">
        <Button variant="outline" size="sm">
          <ArrowRight className="h-4 w-4" />
          Back
        </Button>
      </SectionHeader>

      {/* Single dense overview card — mirrors TournamentOverviewCard */}
      <Card className="gap-0 py-0">
        {/* Status header band */}
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 rounded-t-lg px-4 py-2.5",
            HEADER_BG[state],
          )}
        >
          <span className="text-xs font-semibold tracking-wider uppercase">
            {STATE_LABEL[state]}
          </span>
          <span className="text-xs whitespace-nowrap">
            {formatShortDate(submission.date)}
          </span>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3 px-4 py-3">
          {/* Title + description */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-heading text-sm font-medium">
                {formatLongDate(submission.date)}
              </h3>
              <div className="flex shrink-0 gap-1">
                <Badge
                  variant={
                    submission.tier === "advanced" ? "default" : "secondary"
                  }
                >
                  {submission.tier}
                </Badge>
                <Badge variant="outline">
                  {data.isTeamExercise ? (
                    <>
                      <Users className="h-3 w-3" />
                      Team
                    </>
                  ) : (
                    <>
                      <Zap className="h-3 w-3" />
                      Solo
                    </>
                  )}
                </Badge>
              </div>
            </div>
            {submission.description && (
              <p className="text-muted-foreground mt-1 line-clamp-3 text-xs">
                {submission.description}
              </p>
            )}
          </div>

          {/* Review progress bar */}
          <div className="flex flex-col gap-1.5">
            <Progress
              aria-label="Review progress"
              value={STATE_PROGRESS[state]}
              className={cn("h-2", PROGRESS_CLASS[state])}
            />
            <div
              className={cn(
                "flex items-center justify-center gap-1.5 text-[0.625rem] font-medium",
                state === "approved" ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Clock className="h-3 w-3" />
              {STATE_LABEL[state]}
            </div>
          </div>

          {/* Stat grid */}
          <div className="grid grid-cols-3 gap-2">
            <StatCell
              Icon={Star}
              value={submission.pointsEarned}
              label="Points"
            />
            <StatCell
              Icon={ImageIcon}
              value={data.evidence.length}
              label={data.evidence.length === 1 ? "Photo" : "Photos"}
            />
            <StatCell
              Icon={Users}
              value={participants.length}
              label={participants.length === 1 ? "Player" : "Players"}
            />
          </div>

          {/* Team / tournament context strip — mirrors team membership card */}
          <div className="bg-muted/30 rounded-md border">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <Trophy className="text-muted-foreground h-3.5 w-3.5" />
                <span className="text-xs font-medium">{team.name}</span>
                <Badge
                  variant="secondary"
                  className="flex items-center gap-0.5"
                >
                  <Shield className="h-2.5 w-2.5" />
                  {data.isTeamExercise ? "Team exercise" : "Individual"}
                </Badge>
              </div>
              <AvatarGroup>
                {participants.slice(0, 4).map((p) => (
                  <Avatar key={p._id} size="sm">
                    <AvatarImage src={p.imageUrl} />
                    <AvatarFallback>{getInitials(p.name)}</AvatarFallback>
                  </Avatar>
                ))}
                {participants.length > 4 && (
                  <AvatarGroupCount>
                    +{participants.length - 4}
                  </AvatarGroupCount>
                )}
              </AvatarGroup>
            </div>
            <div className="border-t px-3 py-1.5">
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span className="truncate">{tournament.name}</span>
                <span>
                  <span className="text-foreground font-semibold">
                    {submission.pointsEarned}
                  </span>{" "}
                  /{" "}
                  {data.isTeamExercise
                    ? tournament.scoringConfig.teamExercisePoints.advanced
                    : tournament.scoringConfig.individualPoints.advanced}{" "}
                  pts
                </span>
              </div>
            </div>
          </div>

          {/* Reviewer strip — mirrors pending-reviews strip */}
          {managedByUser && (
            <div className="bg-primary/10 text-primary flex items-center gap-2 rounded px-2.5 py-1.5 text-xs font-medium">
              <Crown className="h-3.5 w-3.5" />
              {managedByLabel(submission.state)} {managedByUser.name}
            </div>
          )}

          {/* Actions row */}
          {(data.canApprove ||
            data.canReject ||
            data.canEdit ||
            data.canDelete) && (
            <div className="flex flex-wrap gap-2">
              {data.canApprove && (
                <Button size="sm" className="flex-1">
                  <Check className="h-3.5 w-3.5" />
                  Approve
                </Button>
              )}
              {data.canReject && (
                <Button size="sm" variant="destructive" className="flex-1">
                  <X className="h-3.5 w-3.5" />
                  Reject
                </Button>
              )}
              {data.canEdit && (
                <Button size="sm" variant="outline" className="flex-1">
                  {submission.state === "rejected" ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" />
                      Resubmit
                    </>
                  ) : (
                    <>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </>
                  )}
                </Button>
              )}
              {data.canDelete && (
                <Button size="sm" variant="outline">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Evidence — TeamRosters-style grid */}
      <SectionHeader as="h2" title="Evidence" Icon={ImageIcon} />
      {data.evidence.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.evidence.map((img, idx) => (
            <Card key={img._id} size="sm" className="overflow-hidden p-0">
              <Image
                src={img.url}
                alt={img.filename ?? `Evidence ${idx + 1}`}
                width={400}
                height={300}
                className="aspect-video w-full object-cover"
                loading="lazy"
              />
              <CardContent className="flex items-center justify-between gap-2 py-2">
                <span className="truncate text-xs font-medium">
                  {img.filename ?? `Evidence ${idx + 1}`}
                </span>
                <Badge variant="outline" className="shrink-0">
                  #{idx + 1}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-muted-foreground flex items-center gap-3 py-6 text-sm">
            <ImageIcon className="h-4 w-4" />
            No evidence attached.
          </CardContent>
        </Card>
      )}
    </>
  );
}

function StatCell({
  Icon,
  value,
  label,
}: {
  Icon: LucideIcon;
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
