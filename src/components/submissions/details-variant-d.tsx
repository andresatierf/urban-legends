import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  ImageIcon,
  Pencil,
  RefreshCw,
  Shield,
  Trash2,
  Trophy,
  User,
  Users,
  X,
} from "lucide-react";

import { DetailsPageLayout } from "@/components/details-page-layout";
import { SectionHeader } from "@/components/section-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image } from "@/components/ui/image";
import { Separator } from "@/components/ui/separator";
import {
  SidebarCard,
  type SidebarCardAction,
  type SidebarCardBadge,
  type SidebarCardStat,
} from "@/components/ui/sidebar-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getInitials } from "@/components/users/utils";

import type { SubmissionDetailsData } from "./details-demo-fixtures";
import {
  managedByLabel,
  stateBadgeVariant,
} from "./review/submission-review-card-shared";

function formatDate(input: string | number): string {
  return new Date(input).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatLongDate(input: string | number): string {
  return new Date(input).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function SubmissionDetailsVariantD({
  data,
}: {
  data: SubmissionDetailsData;
}) {
  const { submission, team, tournament, submitter, teammates, managedByUser } =
    data;
  const participants = [
    { ...submitter, isSubmitter: true as const },
    ...teammates.map((t) => ({ ...t, isSubmitter: false as const })),
  ];
  const share = participants.length > 0 ? 100 / participants.length : 0;

  // Pick which entity headlines this submission.
  const isTeamSubmission = submission.submissionType === "team";
  const headlineTitle = isTeamSubmission ? team.name : submitter.name;
  const headlineIcon = isTeamSubmission ? Users : User;

  // Scoring: only show the row matching the submission type.
  const scoringTiers = isTeamSubmission
    ? tournament.scoringConfig.teamExercisePoints
    : tournament.scoringConfig.individualPoints;
  const isApproved = submission.state === "approved";
  const possiblePoints =
    submission.tier === "advanced" ? scoringTiers.advanced : scoringTiers.base;

  const badges: SidebarCardBadge[] = [
    { label: submission.state, variant: stateBadgeVariant(submission.state) },
    {
      label: submission.tier,
      variant: submission.tier === "advanced" ? "default" : "secondary",
    },
    ...(isTeamSubmission
      ? [
          {
            label: "Team",
            variant: "outline" as const,
            icon: Users,
          },
        ]
      : []),
  ];

  const actions: SidebarCardAction[] = [];
  if (data.canApprove) {
    actions.push({
      label: "Approve",
      icon: Check,
      variant: "default",
      onClick: () => {},
    });
  }
  if (data.canReject) {
    actions.push({
      label: "Reject",
      icon: X,
      variant: "destructive",
      onClick: () => {},
    });
  }
  if (data.canEdit) {
    actions.push({
      label: submission.state === "rejected" ? "Resubmit" : "Edit",
      icon: submission.state === "rejected" ? RefreshCw : Pencil,
      onClick: () => {},
    });
  }
  if (data.canDelete) {
    actions.push({
      label: "Delete",
      icon: Trash2,
      variant: "outline",
      onClick: () => {},
    });
  }

  // Plain 2x2 tile grid (no icons) — values borrowed from variant E.
  const stats: SidebarCardStat[] = [
    { label: "Points", value: `${submission.pointsEarned}` },
    { label: "Evidence", value: `${data.evidence.length}` },
    { label: "Players", value: `${participants.length}` },
    { label: "Tier", value: submission.tier },
  ];

  const reviewedLabel = managedByUser
    ? managedByLabel(submission.state)
    : "Awaiting review";

  const sidebar = (
    <>
      <SidebarCard
        icon={headlineIcon}
        badges={badges}
        title={headlineTitle}
        stats={stats}
        actions={actions.length > 0 ? actions : undefined}
      >
        {/* Linked context — team (individual only) above tournament (always) */}
        <div className="text-muted-foreground space-y-1 text-xs">
          {!isTeamSubmission && (
            <Link
              to="/teams/$teamId"
              params={{ teamId: team._id }}
              className="hover:text-foreground flex items-center gap-1.5 transition-colors"
            >
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 truncate">{team.name}</span>
              <ChevronRight className="h-3 w-3 shrink-0" />
            </Link>
          )}
          <Link
            to="/tournaments/$tournamentId"
            params={{ tournamentId: tournament._id }}
            className="hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            <Trophy className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 truncate">{tournament.name}</span>
            <ChevronRight className="h-3 w-3 shrink-0" />
          </Link>
        </div>

        {/* Review timeline — explicit timestamps, no progress bar.
            Reviewed timestamp is approximated from _creationTime until issue
            #124 adds a dedicated reviewedAt field. */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4" />
            Review timeline
          </div>
          <div className="text-muted-foreground space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Submitted</span>
              <span>{formatDate(submission._creationTime)}</span>
            </div>
            <div className="flex justify-between">
              <span>{reviewedLabel}</span>
              <span>
                {managedByUser ? formatDate(submission._creationTime) : "—"}
              </span>
            </div>
          </div>
        </div>
      </SidebarCard>

      {/* Scoring rules (mirrors RulesCard) — only the relevant submission type */}
      <Card>
        <CardHeader>
          <CardTitle>Scoring</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <span>{isTeamSubmission ? "Team exercise" : "Individual"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tier</span>
            <span className="capitalize">{submission.tier}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base</span>
            <span>{scoringTiers.base}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Advanced</span>
            <span>{scoringTiers.advanced}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold">
            <span>{isApproved ? "Earned" : "Possible"}</span>
            <span>{isApproved ? submission.pointsEarned : possiblePoints}</span>
          </div>
        </CardContent>
      </Card>

      {/* Submitter highlight (mirrors YourTeamCard) — only for team submissions,
          where the SidebarCard headline is the team, not the submitter. */}
      {isTeamSubmission && (
        <Card className="border-card-info-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="text-primary h-4 w-4" />
              <CardTitle>Submitter</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={submitter.imageUrl} />
                <AvatarFallback>{getInitials(submitter.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{submitter.name}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {submitter.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );

  return (
    <DetailsPageLayout title="Submission Details" sidebar={sidebar}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {formatLongDate(submission.date)}
          </CardTitle>
        </CardHeader>
        {submission.description && (
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {submission.description}
            </p>
          </CardContent>
        )}
      </Card>

      {isTeamSubmission && (
        <>
          <SectionHeader as="h2" title="Contributions" Icon={Users} />
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((p, i) => (
                    <TableRow
                      key={p._id}
                      className={
                        p.isSubmitter ? "bg-card-info-from/40" : undefined
                      }
                    >
                      <TableCell className="text-muted-foreground w-12 text-center">
                        #{i + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar size="sm">
                            <AvatarImage src={p.imageUrl} />
                            <AvatarFallback>
                              {getInitials(p.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {p.isSubmitter ? (
                          <Badge variant="secondary">Submitter</Badge>
                        ) : (
                          <Badge variant="outline">Member</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                            <div
                              className="bg-primary h-full rounded-full"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <span className="w-12 text-right text-xs">
                            {share.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}

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
                <Badge variant="outline" className="shrink-0 text-xs">
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
    </DetailsPageLayout>
  );
}
