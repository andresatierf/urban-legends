import {
  Check,
  ImageIcon,
  Pencil,
  RefreshCw,
  Star,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";

import { SectionHeader } from "@/components/section-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Image } from "@/components/ui/image";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInitials } from "@/components/users/utils";
import { cn } from "@/lib/utils";

import type { SubmissionDetailsData } from "./details-demo-fixtures";
import {
  managedByLabel,
  stateBadgeVariant,
} from "./review/submission-review-card-shared";

const STATE_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 border-yellow-500/30",
  approved: "bg-green-500/10 border-green-500/30",
  rejected: "bg-red-500/10 border-red-500/30",
  deleted: "bg-muted border-muted",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function SubmissionDetailsVariantB({
  data,
}: {
  data: SubmissionDetailsData;
}) {
  const { submission, team, tournament, submitter, teammates, managedByUser } =
    data;

  const heroImage = data.evidence[0];

  return (
    <>
      <SectionHeader as="h1" title="Submission Details" />

      {/* Hero Banner */}
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border",
          STATE_COLORS[submission.state],
        )}
      >
        {heroImage ? (
          <div className="relative h-48 sm:h-64">
            <Image
              src={heroImage.url}
              alt="Submission hero"
              width={1200}
              height={400}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <div className="mb-2 flex items-center gap-2">
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
                <Badge variant="outline" className="border-white/30 text-white">
                  {data.isTeamExercise ? "Team Exercise" : "Individual"}
                </Badge>
              </div>
              <h2 className="text-xl font-bold text-white">
                {formatDate(submission.date)}
              </h2>
              <p className="mt-1 text-sm text-white/80">
                {team.name} · {tournament.name}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-2 flex items-center gap-2">
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
              <Badge variant="outline">
                {data.isTeamExercise ? "Team Exercise" : "Individual"}
              </Badge>
            </div>
            <h2 className="text-xl font-bold">{formatDate(submission.date)}</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {team.name} · {tournament.name}
            </p>
          </div>
        )}
      </div>

      {/* Stat Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Points",
            value: submission.pointsEarned,
            icon: Star,
          },
          {
            label: "Evidence",
            value: data.evidence.length,
            icon: ImageIcon,
          },
          {
            label: "Participants",
            value: 1 + teammates.length,
            icon: Users,
          },
          {
            label: "Type",
            value: data.isTeamExercise ? "Team" : "Solo",
            icon: Zap,
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 py-3">
              <stat.icon className="text-muted-foreground h-5 w-5 shrink-0" />
              <div>
                <p className="text-lg leading-none font-bold">{stat.value}</p>
                <p className="text-muted-foreground text-xs">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions Bar */}
      {(data.canApprove ||
        data.canReject ||
        data.canEdit ||
        data.canDelete) && (
        <Card>
          <CardContent className="flex flex-wrap gap-2 py-3">
            {data.canApprove && (
              <Button size="sm">
                <Check className="h-4 w-4" />
                Approve
              </Button>
            )}
            {data.canReject && (
              <Button size="sm" variant="destructive">
                <X className="h-4 w-4" />
                Reject
              </Button>
            )}
            {data.canEdit && (
              <Button size="sm" variant="outline">
                {submission.state === "rejected" ? (
                  <RefreshCw className="h-4 w-4" />
                ) : (
                  <Pencil className="h-4 w-4" />
                )}
                {submission.state === "rejected" ? "Resubmit" : "Edit"}
              </Button>
            )}
            {data.canDelete && (
              <Button size="sm" variant="outline">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabbed Content */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="participants">
            Participants ({1 + teammates.length})
          </TabsTrigger>
          <TabsTrigger value="evidence">
            Evidence ({data.evidence.length})
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardContent className="space-y-4 pt-6">
              {submission.description && (
                <div>
                  <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                    Description
                  </p>
                  <p className="text-sm">{submission.description}</p>
                </div>
              )}
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Date</p>
                  <p className="font-medium">{formatDate(submission.date)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Tier</p>
                  <p className="font-medium capitalize">{submission.tier}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Team</p>
                  <p className="font-medium">{team.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Tournament</p>
                  <p className="font-medium">{tournament.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Points</p>
                  <p className="font-medium">{submission.pointsEarned} pts</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Exercise Type</p>
                  <p className="font-medium">
                    {data.isTeamExercise ? "Team Exercise" : "Individual"}
                  </p>
                </div>
              </div>
              {managedByUser && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {managedByLabel(submission.state)}
                    </span>
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={managedByUser.imageUrl} />
                      <AvatarFallback className="text-[0.5rem]">
                        {getInitials(managedByUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{managedByUser.name}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={submitter.imageUrl} />
                  <AvatarFallback>{getInitials(submitter.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{submitter.name}</p>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      Submitter
                    </Badge>
                  </div>
                  <p className="text-muted-foreground truncate text-xs">
                    {submitter.email}
                  </p>
                </div>
              </CardContent>
            </Card>
            {teammates.map((t) => (
              <Card key={t._id}>
                <CardContent className="flex items-center gap-3 py-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={t.imageUrl} />
                    <AvatarFallback>{getInitials(t.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{t.name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {t.email}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Evidence Tab */}
        <TabsContent value="evidence">
          {data.evidence.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {data.evidence.map((img, idx) => (
                <Card key={img._id} className="overflow-hidden p-0">
                  <Image
                    src={img.url}
                    alt={img.filename ?? `Evidence ${idx + 1}`}
                    width={400}
                    height={400}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                  {img.filename && (
                    <div className="p-2">
                      <p className="text-muted-foreground truncate text-xs">
                        {img.filename}
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ImageIcon className="text-muted-foreground mb-2 h-10 w-10" />
                <p className="text-muted-foreground text-sm">
                  No evidence attached
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
