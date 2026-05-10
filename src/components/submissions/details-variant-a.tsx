import {
  CalendarDays,
  Check,
  Crown,
  ImageIcon,
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
import { Separator } from "@/components/ui/separator";
import { SidebarCard } from "@/components/ui/sidebar-card";
import { getInitials } from "@/components/users/utils";
import { cn } from "@/lib/utils";

import type { SubmissionDetailsData } from "./details-demo-fixtures";
import { EvidenceGallery } from "./display/evidence-gallery";
import { stateBadgeVariant } from "./review/submission-review-card-shared";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function SubmissionDetailsVariantA({
  data,
}: {
  data: SubmissionDetailsData;
}) {
  const { submission, team, tournament, submitter, teammates, managedByUser } =
    data;

  const stateBadges = [
    {
      label: submission.state,
      variant: stateBadgeVariant(submission.state) as
        | "default"
        | "destructive"
        | "secondary"
        | "outline",
    },
    {
      label: submission.tier,
      variant: (submission.tier === "advanced" ? "default" : "secondary") as
        | "default"
        | "secondary",
    },
    {
      label: data.isTeamExercise ? "Team Exercise" : "Individual",
      variant: "outline" as const,
      icon: data.isTeamExercise ? Users : Zap,
    },
  ];

  const stats = [
    [
      { label: "Points", value: `${submission.pointsEarned}`, icon: Star },
      {
        label: "Evidence",
        value: `${data.evidence.length}`,
        icon: ImageIcon,
      },
    ],
    [
      {
        label: "Date",
        value: new Date(submission.date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }),
        icon: CalendarDays,
      },
      {
        label: "Participants",
        value: `${1 + teammates.length}`,
        icon: Users,
      },
    ],
  ];

  const actions = [
    ...(data.canApprove
      ? [
          {
            label: "Approve",
            icon: Check,
            variant: "default" as const,
            onClick: () => {},
          },
        ]
      : []),
    ...(data.canReject
      ? [
          {
            label: "Reject",
            icon: X,
            variant: "destructive" as const,
            onClick: () => {},
          },
        ]
      : []),
    ...(data.canEdit
      ? [
          {
            label:
              submission.state === "rejected" ? "Resubmit" : "Edit Submission",
            icon: submission.state === "rejected" ? RefreshCw : Pencil,
            onClick: () => {},
          },
        ]
      : []),
    ...(data.canDelete
      ? [
          {
            label: "Delete",
            icon: Trash2,
            variant: "outline" as const,
            onClick: () => {},
          },
        ]
      : []),
  ];

  const sidebar = (
    <>
      <SidebarCard
        icon={Trophy}
        badges={stateBadges}
        title={team.name}
        description={tournament.name}
        descriptionIcon={Crown}
        stats={stats}
        actions={actions.length > 0 ? actions : undefined}
      />
      {managedByUser && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {submission.state === "approved"
                ? "Approved by"
                : submission.state === "rejected"
                  ? "Rejected by"
                  : "Managed by"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={managedByUser.imageUrl} />
                <AvatarFallback className="text-xs">
                  {getInitials(managedByUser.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{managedByUser.name}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );

  return (
    <DetailsPageLayout title="Submission Details" sidebar={sidebar}>
      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {formatDate(submission.date)}
          </CardTitle>
          {submission.description && (
            <CardDescription>{submission.description}</CardDescription>
          )}
        </CardHeader>
      </Card>

      {/* Evidence Gallery */}
      {data.evidence.length > 0 && (
        <>
          <SectionHeader title="Evidence" />
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {data.evidence.map((img, idx) => (
                  <div
                    key={img._id}
                    className="group relative overflow-hidden rounded-lg"
                  >
                    <Image
                      src={img.url}
                      alt={img.filename ?? `Evidence ${idx + 1}`}
                      width={400}
                      height={400}
                      className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Participants */}
      <SectionHeader title="Participants" />
      <Card>
        <CardContent className="divide-y pt-6">
          <div className="flex items-center gap-3 pb-3">
            <Avatar>
              <AvatarImage src={submitter.imageUrl} />
              <AvatarFallback>{getInitials(submitter.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{submitter.name}</p>
                <Badge variant="secondary">Submitter</Badge>
              </div>
              <p className="text-muted-foreground text-sm">{submitter.email}</p>
            </div>
          </div>
          {teammates.map((t) => (
            <div key={t._id} className="flex items-center gap-3 py-3">
              <Avatar>
                <AvatarImage src={t.imageUrl} />
                <AvatarFallback>{getInitials(t.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{t.name}</p>
                <p className="text-muted-foreground text-sm">{t.email}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </DetailsPageLayout>
  );
}
