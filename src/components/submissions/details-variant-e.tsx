import {
  CalendarDays,
  Check,
  Crown,
  ImageIcon,
  Mail,
  Pencil,
  RefreshCw,
  Star,
  Trash2,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";

import { DetailsPageLayout } from "@/components/details-page-layout";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image } from "@/components/ui/image";
import {
  SidebarCard,
  type SidebarCardAction,
  type SidebarCardBadge,
  type SidebarCardStat,
} from "@/components/ui/sidebar-card";
import { getInitials } from "@/components/users/utils";

import type { SubmissionDetailsData } from "./details-demo-fixtures";
import {
  managedByLabel,
  stateBadgeVariant,
} from "./review/submission-review-card-shared";

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

export function SubmissionDetailsVariantE({
  data,
}: {
  data: SubmissionDetailsData;
}) {
  const { submission, team, tournament, submitter, teammates, managedByUser } =
    data;
  const participants = [
    { ...submitter, role: "submitter" as const },
    ...teammates.map((t) => ({ ...t, role: "member" as const })),
  ];

  const badges: SidebarCardBadge[] = [
    { label: submission.state, variant: stateBadgeVariant(submission.state) },
    {
      label: submission.tier,
      variant: submission.tier === "advanced" ? "default" : "secondary",
    },
    {
      label: data.isTeamExercise ? "Team" : "Individual",
      variant: "outline",
      icon: data.isTeamExercise ? Users : Zap,
    },
  ];

  const stats: SidebarCardStat[] = [
    { label: "Points", value: `${submission.pointsEarned}` },
    { label: "Evidence", value: `${data.evidence.length}` },
    { label: "Players", value: `${participants.length}` },
    { label: "Tier", value: submission.tier },
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

  // Mirrors PerformanceCard: icon rows grouped with colored icons.
  const performance: SidebarCardStat[][] = [
    [
      {
        icon: Star,
        iconColor: "text-amber-500",
        label: "Points",
        value: String(submission.pointsEarned),
      },
      {
        icon: ImageIcon,
        iconColor: "text-blue-600",
        label: "Evidence",
        value: String(data.evidence.length),
      },
      {
        icon: Users,
        iconColor: "text-purple-600",
        label: "Players",
        value: String(participants.length),
      },
    ],
    [
      {
        icon: CalendarDays,
        iconColor: "text-green-600",
        label: "Date",
        value: formatShortDate(submission.date),
      },
      {
        icon: Trophy,
        iconColor: "text-orange-600",
        label: "Tournament",
        value: tournament.name.split(" ")[0] ?? tournament.name,
      },
    ],
  ];

  const sidebar = (
    <>
      <SidebarCard
        icon={Users}
        badges={badges}
        title={team.name}
        description={tournament.name}
        descriptionIcon={Trophy}
        stats={stats}
        actions={actions.length > 0 ? actions : undefined}
      />

      <SidebarCard
        title="Performance"
        description={formatShortDate(submission.date)}
        stats={performance}
      />
    </>
  );

  return (
    <DetailsPageLayout title="Submission Details" sidebar={sidebar}>
      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4" />
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

      {/* Participants — mirrors MemberRoster */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participants
            </CardTitle>
            <AvatarGroup>
              {participants.slice(0, 4).map((p) => (
                <Avatar key={p._id} size="sm">
                  <AvatarImage src={p.imageUrl} />
                  <AvatarFallback>{getInitials(p.name)}</AvatarFallback>
                </Avatar>
              ))}
              {participants.length > 4 && (
                <AvatarGroupCount>+{participants.length - 4}</AvatarGroupCount>
              )}
            </AvatarGroup>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-border divide-y">
            {participants.map((p) => (
              <div
                key={p._id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={p.imageUrl} />
                    <AvatarFallback>{getInitials(p.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{p.name}</span>
                      <Badge
                        variant={
                          p.role === "submitter" ? "default" : "secondary"
                        }
                      >
                        {p.role === "submitter" && (
                          <Crown className="h-3 w-3" />
                        )}
                        {p.role}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Mail className="h-3 w-3" />
                      {p.email}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Evidence */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Evidence
            </CardTitle>
            <Badge variant="outline">{data.evidence.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {data.evidence.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {data.evidence.map((img, idx) => (
                <div
                  key={img._id}
                  className="overflow-hidden rounded-md border"
                >
                  <Image
                    src={img.url}
                    alt={img.filename ?? `Evidence ${idx + 1}`}
                    width={400}
                    height={400}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-4 text-sm">
              No evidence attached.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Review trail */}
      {managedByUser && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Crown className="h-4 w-4" />
              {managedByLabel(submission.state)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                <AvatarImage src={managedByUser.imageUrl} />
                <AvatarFallback>
                  {getInitials(managedByUser.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{managedByUser.name}</p>
                <p className="text-muted-foreground text-xs">
                  {managedByUser.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </DetailsPageLayout>
  );
}
