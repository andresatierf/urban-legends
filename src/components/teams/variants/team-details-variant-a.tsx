import {
  Activity,
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle,
  ChevronRight,
  Crown,
  DoorOpen,
  Flame,
  Mail,
  Pencil,
  Shield,
  Trash2,
  Trophy,
  User,
  UserPlus,
  Users,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { TeamDetailsFixture } from "./team-details-fixtures";
import { ALL_FIXTURES, getInitials } from "./team-details-fixtures";

function Sidebar({ data }: { data: TeamDetailsFixture }) {
  const { team, tournament, stats, permissions, userMembership } = data;
  const isFull =
    team.maxMembers !== null && stats.memberCount >= team.maxMembers;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">{team.name}</CardTitle>
          <CardDescription className="flex flex-wrap gap-1.5 pt-1">
            <Badge
              variant={team.joinPolicy === "open" ? "default" : "secondary"}
            >
              {team.joinPolicy === "open" ? "Open" : "Closed"}
            </Badge>
            {isFull && <Badge variant="destructive">Full</Badge>}
            {userMembership && (
              <Badge variant="outline">
                <Shield className="h-3 w-3" />
                {userMembership.role}
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <button className="text-muted-foreground hover:text-foreground flex w-full items-center gap-2 text-left text-sm transition-colors">
            <Trophy className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">{tournament.name}</span>
            <ChevronRight className="h-3 w-3 shrink-0" />
          </button>
          <Badge
            variant={tournament.status === "active" ? "default" : "secondary"}
          >
            {tournament.status}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <StatRow
            icon={Award}
            label="Points"
            value={String(stats.points)}
            color="text-yellow-600"
          />
          <StatRow
            icon={Users}
            label="Members"
            value={`${stats.memberCount}${team.maxMembers ? ` / ${team.maxMembers}` : ""}`}
            color="text-blue-600"
          />
          <StatRow
            icon={Activity}
            label="Submissions"
            value={String(stats.submissionCount)}
            color="text-indigo-600"
          />
          <StatRow
            icon={CheckCircle}
            label="Approval"
            value={`${(stats.approvalRate * 100).toFixed(0)}%`}
            color="text-green-600"
          />
          <StatRow
            icon={Flame}
            label="Streak"
            value={`${stats.currentStreak}d`}
            color="text-orange-600"
          />
          <StatRow
            icon={Calendar}
            label="Completion"
            value={`${(stats.completionRate * 100).toFixed(0)}%`}
            color="text-purple-600"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {permissions.canInvite && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <UserPlus className="h-4 w-4" />
              Invite Member
            </Button>
          )}
          {permissions.canEdit && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <Pencil className="h-4 w-4" />
              Edit Team
            </Button>
          )}
          {permissions.canTransferCaptaincy && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <Crown className="h-4 w-4" />
              Transfer Captaincy
            </Button>
          )}
          {permissions.canLeave && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <DoorOpen className="h-4 w-4" />
              Leave Team
            </Button>
          )}
          {permissions.canDelete && (
            <Button
              variant="destructive"
              size="sm"
              className="w-full justify-start"
            >
              <Trash2 className="h-4 w-4" />
              Delete Team
            </Button>
          )}
          {!permissions.canEdit &&
            !permissions.canLeave &&
            !permissions.canInvite && (
              <p className="text-muted-foreground text-xs">
                No actions available
              </p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatRow({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Award;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        <span className="text-muted-foreground">{label}</span>
      </div>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function MemberRoster({ data }: { data: TeamDetailsFixture }) {
  const { members, permissions } = data;

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
              {permissions.canManageMembers &&
                member.memberRole !== "captain" && (
                  <Button variant="ghost" size="sm">
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

function RequestsPanel({ data }: { data: TeamDetailsFixture }) {
  const { joinRequests, invitations, permissions } = data;
  const pendingInvites = invitations.filter((i) => i.status === "pending");
  const pendingRequests = joinRequests.filter((r) => r.status === "pending");

  if (pendingInvites.length === 0 && pendingRequests.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground text-sm">
            No pending invites or requests
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <UserPlus className="h-4 w-4" />
              Pending Invitations
              <Badge variant="secondary">{pendingInvites.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvites.map((inv) => (
                <div
                  key={inv._id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{inv.userName}</p>
                    <p className="text-muted-foreground text-xs">
                      {inv.userEmail}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Invited by {inv.invitedBy}
                    </p>
                  </div>
                  {permissions.canInvite && (
                    <Button variant="ghost" size="sm">
                      Cancel
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              Join Requests
              <Badge variant="secondary">{pendingRequests.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div
                  key={req._id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{req.userName}</p>
                    <p className="text-muted-foreground text-xs">
                      {req.userEmail}
                    </p>
                    {req.message && (
                      <p className="mt-1 text-xs italic">"{req.message}"</p>
                    )}
                  </div>
                  {permissions.canManageMembers && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        Reject
                      </Button>
                      <Button size="sm">Approve</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TeamDetailsVariantAContent({ data }: { data: TeamDetailsFixture }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Sidebar data={data} />
      <div className="space-y-6">
        <MemberRoster data={data} />
        <RequestsPanel data={data} />
      </div>
    </div>
  );
}

export function TeamDetailsVariantA() {
  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center gap-3">
          <ArrowLeft className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Variant A — Sidebar Dashboard</h1>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          Fixed sidebar for metadata & actions, main area for roster and
          requests. Dense, information-rich, admin-oriented.
        </p>
        <Separator className="mt-4" />
      </div>

      {ALL_FIXTURES.map(({ label, fixture }) => (
        <section key={label} className="space-y-4">
          <h2 className="text-lg font-semibold">{label}</h2>
          <TeamDetailsVariantAContent data={fixture} />
        </section>
      ))}
    </div>
  );
}
