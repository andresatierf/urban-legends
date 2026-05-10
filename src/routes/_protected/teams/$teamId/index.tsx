import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  Activity,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Crown,
  DoorOpen,
  Flame,
  Mail,
  Pencil,
  Shield,
  Trash2,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { useCallback, useState } from "react";

import { InviteMemberFormDialog } from "@/components/form/invite-member-form";
import { TransferCaptaincyFormDialog } from "@/components/form/transfer-captaincy-form";
import { UpsertTeamFormDialog } from "@/components/form/upsert-team-form";
import { InvitedUsersList } from "@/components/invitations/invited-users-list";
import { JoinRequestsList } from "@/components/invitations/join-requests-list";
import { SectionHeader } from "@/components/section-header";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import {
  SidebarCard,
  type SidebarCardAction,
  type SidebarCardBadge,
  type SidebarCardStat,
} from "@/components/ui/sidebar-card";
import { getInitials } from "@/components/users/utils";
import { useUser } from "@/hooks/useUser";
import { tryMutate } from "@/lib/utils";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

type TeamDetails = NonNullable<FunctionReturnType<typeof api.teams.getDetails>>;

export const Route = createFileRoute("/_protected/teams/$teamId/")({
  component: TeamDetailsPage,
});

function TeamDetailsPage() {
  const { teamId } = Route.useParams();
  const data = useQuery(api.teams.getDetails, {
    teamId: teamId as Id<"teams">,
  });

  if (!data) {
    return <PageSkeleton headerTitle="Team Details" sections={3} />;
  }

  const isCaptain = data.userMembership?.role === "captain";

  return (
    <>
      <SectionHeader as="h1" title="Team Details">
        <Button variant="outline" asChild>
          <Link to="/teams">
            <ArrowLeft />
            Back
          </Link>
        </Button>
      </SectionHeader>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Sidebar data={data} />
        <div className="space-y-6">
          <MemberRoster data={data} />
          <InvitedUsersList teamId={data.team._id} canCancel={isCaptain} />
          {data.team.joinPolicy !== "closed" && (
            <JoinRequestsList teamId={data.team._id} />
          )}
        </div>
      </div>
    </>
  );
}

function Sidebar({ data }: { data: TeamDetails }) {
  const { team, tournament, statistics, userMembership } = data;
  const isFull =
    team.maxMembers !== undefined && statistics.memberCount >= team.maxMembers;

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editTeamDialogOpen, setEditTeamDialogOpen] = useState(false);
  const [transferCaptaincyDialogOpen, setTransferCaptaincyDialogOpen] =
    useState(false);

  const deleteTeam = useMutation(api.teams.removeUserTeam);
  const leaveTeam = useMutation(api.teams.leaveTeam);

  const handleDeleteTeam = useCallback(() => {
    void tryMutate({
      fn: () => deleteTeam({ teamId: team._id }),
      successToast: "Team deleted successfully",
      defaultFailureToast: "Failed to delete team",
    });
  }, [deleteTeam, team._id]);

  const handleLeaveTeam = useCallback(() => {
    void tryMutate({
      fn: () => leaveTeam({ teamId: team._id }),
      successToast: "Successfully left the team",
      defaultFailureToast: "Failed to leave team",
    });
  }, [leaveTeam, team._id]);

  const badges: SidebarCardBadge[] = [
    {
      label: team.joinPolicy === "open" ? "Open" : "Closed",
      variant: team.joinPolicy === "open" ? "default" : "secondary",
    },
  ];
  if (isFull) {
    badges.push({ label: "Full", variant: "destructive" });
  }
  if (userMembership) {
    badges.push({
      label: userMembership.role,
      variant: "outline",
      icon: Shield,
    });
  }

  const stats: SidebarCardStat[] = [
    { label: "Points", value: String(statistics.points) },
    {
      label: "Members",
      value: `${statistics.memberCount}${team.maxMembers ? `/${team.maxMembers}` : ""}`,
    },
    { label: "Submissions", value: String(statistics.submissionCount) },
    {
      label: "Approval",
      value: `${(statistics.approvalRate * 100).toFixed(0)}%`,
    },
  ];

  const actions: SidebarCardAction[] = [];
  if (data.canInvite) {
    actions.push({
      label: "Invite Member",
      icon: UserPlus,
      onClick: () => setInviteDialogOpen(true),
    });
  }
  if (data.canEdit) {
    actions.push({
      label: "Edit Team",
      icon: Pencil,
      onClick: () => setEditTeamDialogOpen(true),
    });
  }
  if (data.canTransferCaptaincy) {
    actions.push({
      label: "Transfer Captaincy",
      icon: Crown,
      onClick: () => setTransferCaptaincyDialogOpen(true),
    });
  }
  if (data.canLeave) {
    actions.push({
      label: "Leave Team",
      icon: DoorOpen,
      onClick: handleLeaveTeam,
    });
  }
  if (data.canDelete) {
    actions.push({
      label: "Delete Team",
      icon: Trash2,
      variant: "destructive",
      onClick: handleDeleteTeam,
    });
  }

  return (
    <div className="space-y-4">
      {data.canInvite && (
        <InviteMemberFormDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          teamId={team._id}
        />
      )}
      {data.canEdit && (
        <UpsertTeamFormDialog
          open={editTeamDialogOpen}
          onOpenChange={setEditTeamDialogOpen}
          tournamentId={team.tournamentId}
          team={team}
        />
      )}
      {data.canTransferCaptaincy && (
        <TransferCaptaincyFormDialog
          open={transferCaptaincyDialogOpen}
          onOpenChange={setTransferCaptaincyDialogOpen}
          teamId={team._id}
        />
      )}

      <SidebarCard
        icon={Users}
        badges={badges}
        title={team.name}
        description={tournament?.name}
        descriptionIcon={Trophy}
        descriptionLink={
          tournament
            ? {
                to: "/tournaments/$tournamentId",
                params: { tournamentId: team.tournamentId },
              }
            : undefined
        }
        stats={stats}
        actions={actions}
      />

      <PerformanceCard teamId={team._id} tournamentId={team.tournamentId} />
    </div>
  );
}

function PerformanceCard({
  teamId,
  tournamentId,
}: {
  teamId: Id<"teams">;
  tournamentId: Id<"tournaments">;
}) {
  const stats = useQuery(api.teams.getStatistics, { teamId });
  const tournamentTeams = useQuery(api.teams.list, { tournamentId });

  if (!stats || !tournamentTeams) return null;

  const ranked = [...tournamentTeams].sort((a, b) => b.points - a.points);
  const rank = ranked.findIndex((t) => t._id === teamId) + 1;
  const totalTeams = ranked.length;

  return (
    <SidebarCard
      title="Performance"
      description={`Day ${stats.daysSoFar} of ${stats.tournamentDays}`}
      stats={[
        [
          {
            icon: Trophy,
            iconColor: "text-amber-500",
            label: "Rank",
            value: `#${rank} / ${totalTeams}`,
          },
          {
            icon: Flame,
            iconColor: "text-orange-600",
            label: "Streak",
            value: `${stats.currentStreak}d`,
          },
          {
            icon: Calendar,
            iconColor: "text-purple-600",
            label: "Completion",
            value: `${(stats.completionRate * 100).toFixed(0)}%`,
          },
          {
            icon: TrendingUp,
            iconColor: "text-blue-600",
            label: "Pts/day",
            value: stats.averagePointsPerDay.toFixed(1),
          },
        ],
        [
          {
            icon: CheckCircle,
            iconColor: "text-green-600",
            label: "Approved",
            value: String(stats.approvedSubmissions),
          },
          {
            icon: Activity,
            iconColor: "text-yellow-600",
            label: "Pending",
            value: String(stats.pendingSubmissions),
          },
          {
            icon: Activity,
            iconColor: "text-red-600",
            label: "Rejected",
            value: String(stats.rejectedSubmissions),
          },
        ],
      ]}
    />
  );
}

function MemberRoster({ data }: { data: TeamDetails }) {
  const { team, members, canManageMembers } = data;
  const { user } = useUser();
  const removeMember = useMutation(api.teams.removeMember);

  const handleRemove = (userId: Id<"users">) => {
    void tryMutate({
      fn: () => removeMember({ teamId: team._id, userId }),
      successToast: "Member removed",
      defaultFailureToast: "Failed to remove member",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </CardTitle>
          <AvatarGroup>
            {members.slice(0, 4).map((m) => (
              <Avatar key={m._id} size="sm">
                <AvatarFallback>{getInitials(m.name)}</AvatarFallback>
              </Avatar>
            ))}
            {members.length > 4 && (
              <AvatarGroupCount>+{members.length - 4}</AvatarGroupCount>
            )}
          </AvatarGroup>
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-border divide-y">
          {members.map((member) => (
            <div
              key={member._id}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{member.name}</span>
                    <Badge
                      variant={
                        member.memberRole === "captain"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {member.memberRole === "captain" && (
                        <Crown className="h-3 w-3" />
                      )}
                      {member.memberRole}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Mail className="h-3 w-3" />
                    {member.email}
                  </div>
                </div>
              </div>
              {canManageMembers &&
                member.memberRole !== "captain" &&
                member._id !== user?._id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(member._id)}
                  >
                    <DoorOpen className="h-4 w-4" />
                    Remove
                  </Button>
                )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
