import {
  Check,
  ChevronRight,
  ImageIcon,
  Pencil,
  RefreshCw,
  Star,
  Trash2,
  Trophy,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";

import { SectionHeader } from "@/components/section-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Image } from "@/components/ui/image";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/components/users/utils";
import { cn } from "@/lib/utils";

import type { SubmissionDetailsData } from "./details-demo-fixtures";
import {
  managedByLabel,
  stateBadgeVariant,
} from "./review/submission-review-card-shared";

const STATE_ACCENT: Record<string, string> = {
  pending: "border-l-yellow-500",
  approved: "border-l-green-500",
  rejected: "border-l-red-500",
  deleted: "border-l-muted-foreground",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "short",
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

export function SubmissionDetailsVariantC({
  data,
}: {
  data: SubmissionDetailsData;
}) {
  const { submission, team, tournament, submitter, teammates, managedByUser } =
    data;

  const participantCount = 1 + teammates.length;

  return (
    <>
      <SectionHeader as="h1" title="Submission Details" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Evidence Panel */}
        <div className="space-y-4">
          {/* Main Evidence Display */}
          <Card className="overflow-hidden p-0">
            {data.evidence.length > 0 ? (
              <>
                <div className="relative">
                  <Image
                    src={data.evidence[0].url}
                    alt={data.evidence[0].filename ?? "Evidence 1"}
                    width={800}
                    height={600}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <Badge variant={stateBadgeVariant(submission.state)}>
                      {submission.state}
                    </Badge>
                  </div>
                  {data.evidence.length > 1 && (
                    <div className="absolute right-3 bottom-3 rounded bg-black/70 px-2 py-1 text-xs text-white">
                      1 / {data.evidence.length}
                    </div>
                  )}
                </div>
                {data.evidence.length > 1 && (
                  <div className="flex gap-1 overflow-x-auto p-2">
                    {data.evidence.map((img, idx) => (
                      <div
                        key={img._id}
                        className={cn(
                          "shrink-0 overflow-hidden rounded border",
                          idx === 0 && "ring-primary ring-2",
                        )}
                      >
                        <Image
                          src={img.url}
                          alt={img.filename ?? `Thumbnail ${idx + 1}`}
                          width={64}
                          height={64}
                          className="h-14 w-14 object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex aspect-[4/3] flex-col items-center justify-center">
                <ImageIcon className="text-muted-foreground mb-2 h-12 w-12" />
                <p className="text-muted-foreground text-sm">
                  No evidence attached
                </p>
              </div>
            )}
          </Card>

          {/* Submitter Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                Submitted by
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={submitter.imageUrl} />
                  <AvatarFallback>{getInitials(submitter.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{submitter.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {submitter.email}
                  </p>
                </div>
                <Badge variant="secondary">Submitter</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Metadata + Participants + Actions */}
        <div className="space-y-4">
          {/* Status & Metadata Timeline */}
          <Card className={cn("border-l-4", STATE_ACCENT[submission.state])}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {formatLongDate(submission.date)}
                </CardTitle>
                <div className="flex gap-1.5">
                  <Badge variant={stateBadgeVariant(submission.state)}>
                    {submission.state}
                  </Badge>
                  <Badge
                    variant={
                      submission.tier === "advanced" ? "default" : "secondary"
                    }
                  >
                    {submission.tier}
                  </Badge>
                </div>
              </div>
              {submission.description && (
                <CardDescription className="mt-2">
                  {submission.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/50 flex items-center gap-2 rounded-lg p-3">
                  <Star className="text-primary h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">Points</p>
                    <p className="font-bold">{submission.pointsEarned}</p>
                  </div>
                </div>
                <div className="bg-muted/50 flex items-center gap-2 rounded-lg p-3">
                  <Zap className="text-primary h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">Type</p>
                    <p className="font-bold">
                      {data.isTeamExercise ? "Team" : "Individual"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Context Links */}
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="text-muted-foreground h-4 w-4" />
                    <span>{team.name}</span>
                  </div>
                  <ChevronRight className="text-muted-foreground h-4 w-4" />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Trophy className="text-muted-foreground h-4 w-4" />
                    <span>{tournament.name}</span>
                  </div>
                  <ChevronRight className="text-muted-foreground h-4 w-4" />
                </div>
              </div>

              {managedByUser && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 text-sm">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={managedByUser.imageUrl} />
                      <AvatarFallback className="text-[0.5rem]">
                        {getInitials(managedByUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground">
                      {managedByLabel(submission.state)}
                    </span>
                    <span className="font-medium">{managedByUser.name}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Participants */}
          {teammates.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    Participants
                  </CardTitle>
                  <Badge variant="outline">{participantCount}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {teammates.map((t) => (
                    <div key={t._id} className="flex items-center gap-3 py-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={t.imageUrl} />
                        <AvatarFallback className="text-xs">
                          {getInitials(t.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.name}</p>
                        <p className="text-muted-foreground truncate text-xs">
                          {t.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Participation</span>
                    <span className="font-medium">
                      {participantCount} members
                    </span>
                  </div>
                  <Progress value={Math.min(100, participantCount * 20)} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {(data.canApprove ||
            data.canReject ||
            data.canEdit ||
            data.canDelete) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.canApprove && (
                  <Button className="w-full" size="sm">
                    <Check className="h-4 w-4" />
                    Approve Submission
                  </Button>
                )}
                {data.canReject && (
                  <Button className="w-full" size="sm" variant="destructive">
                    <X className="h-4 w-4" />
                    Reject Submission
                  </Button>
                )}
                {data.canEdit && (
                  <Button className="w-full" size="sm" variant="outline">
                    {submission.state === "rejected" ? (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Resubmit
                      </>
                    ) : (
                      <>
                        <Pencil className="h-4 w-4" />
                        Edit Submission
                      </>
                    )}
                  </Button>
                )}
                {data.canDelete && (
                  <Button className="w-full" size="sm" variant="outline">
                    <Trash2 className="h-4 w-4" />
                    Delete Submission
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
