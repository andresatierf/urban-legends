import {
  ArrowLeft,
  Award,
  CheckCircle,
  Clock,
  Crown,
  DoorOpen,
  Flame,
  Mail,
  MoreHorizontal,
  Pencil,
  Shield,
  Trash2,
  Trophy,
  UserMinus,
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import type {
  FixtureMember,
  TeamDetailsFixture,
} from "./team-details-fixtures";
import { ALL_FIXTURES, getInitials } from "./team-details-fixtures";

function TeamInfoCard({ data }: { data: TeamDetailsFixture }) {
  const { team, tournament, stats, userMembership, permissions, captain } =
    data;
  const isFull =
    team.maxMembers !== null && stats.memberCount >= team.maxMembers;
  const capacityPercent =
    team.maxMembers !== null
      ? (stats.memberCount / team.maxMembers) * 100
      : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-xl font-bold">{team.name}</CardTitle>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge
                variant={team.joinPolicy === "open" ? "default" : "secondary"}
              >
                {team.joinPolicy === "open" ? "Open" : "Closed"}
              </Badge>
              {isFull && <Badge variant="destructive">Full</Badge>}
              {userMembership && (
                <Badge variant="outline">
                  <Shield className="h-3 w-3" />
                  You: {userMembership.role}
                </Badge>
              )}
            </div>
          </div>
          {(permissions.canEdit || permissions.canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {permissions.canEdit && (
                  <DropdownMenuItem>
                    <Pencil className="h-4 w-4" />
                    Edit Team
                  </DropdownMenuItem>
                )}
                {permissions.canTransferCaptaincy && (
                  <DropdownMenuItem>
                    <Crown className="h-4 w-4" />
                    Transfer Captaincy
                  </DropdownMenuItem>
                )}
                {permissions.canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                      Delete Team
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <button className="text-muted-foreground hover:text-foreground flex w-full items-center gap-2 text-left text-sm transition-colors">
          <Trophy className="h-4 w-4 shrink-0 text-amber-500" />
          <span className="flex-1 truncate">{tournament.name}</span>
          <Badge
            variant={tournament.status === "active" ? "default" : "secondary"}
          >
            {tournament.status}
          </Badge>
        </button>

        <Separator />

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border p-2.5 text-center">
            <div className="flex items-center justify-center gap-1">
              <Award className="h-3.5 w-3.5 text-yellow-600" />
              <span className="text-lg font-bold">{stats.points}</span>
            </div>
            <p className="text-muted-foreground text-[0.625rem]">Points</p>
          </div>
          <div className="rounded-md border p-2.5 text-center">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
              <span className="text-lg font-bold">
                {(stats.approvalRate * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-muted-foreground text-[0.625rem]">Approval</p>
          </div>
          <div className="rounded-md border p-2.5 text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame className="h-3.5 w-3.5 text-orange-600" />
              <span className="text-lg font-bold">{stats.currentStreak}</span>
            </div>
            <p className="text-muted-foreground text-[0.625rem]">Day Streak</p>
          </div>
          <div className="rounded-md border p-2.5 text-center">
            <div className="flex items-center justify-center gap-1">
              <Users className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-lg font-bold">{stats.submissionCount}</span>
            </div>
            <p className="text-muted-foreground text-[0.625rem]">Submissions</p>
          </div>
        </div>

        {capacityPercent !== null && (
          <div className="space-y-1">
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>Capacity</span>
              <span>
                {stats.memberCount} / {team.maxMembers}
              </span>
            </div>
            <Progress value={capacityPercent} className="h-1.5" />
          </div>
        )}

        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <Crown className="h-3 w-3 text-amber-500" />
          Captain: {captain.name}
        </div>
      </CardContent>

      {(permissions.canInvite || permissions.canLeave) && (
        <CardFooter className="flex gap-2 border-t pt-4">
          {permissions.canInvite && (
            <Button variant="outline" size="sm" className="flex-1">
              <UserPlus className="h-4 w-4" />
              Invite
            </Button>
          )}
          {permissions.canLeave && (
            <Button variant="outline" size="sm" className="flex-1">
              <DoorOpen className="h-4 w-4" />
              Leave Team
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

function MemberRow({
  member,
  canRemove,
}: {
  member: FixtureMember;
  canRemove: boolean;
}) {
  const isCaptain = member.memberRole === "captain";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2",
        isCaptain && "bg-muted/50",
      )}
    >
      <Avatar size="sm">
        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{member.name}</span>
          {isCaptain && <Crown className="h-3 w-3 shrink-0 text-amber-500" />}
        </div>
        <span className="text-muted-foreground truncate text-xs">
          {member.email}
        </span>
      </div>
      {canRemove && (
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
          <UserMinus className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

function MembersCard({ data }: { data: TeamDetailsFixture }) {
  const { members, permissions } = data;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            Roster ({members.length})
          </CardTitle>
          <AvatarGroup>
            {members.slice(0, 5).map((m) => (
              <Avatar key={m._id} size="sm">
                <AvatarFallback>{getInitials(m.name)}</AvatarFallback>
              </Avatar>
            ))}
            {members.length > 5 && (
              <AvatarGroupCount>+{members.length - 5}</AvatarGroupCount>
            )}
          </AvatarGroup>
        </div>
      </CardHeader>
      <CardContent className="-mx-1 space-y-1">
        {members.map((member) => (
          <MemberRow
            key={member._id}
            member={member}
            canRemove={
              permissions.canManageMembers && member.memberRole !== "captain"
            }
          />
        ))}
      </CardContent>
    </Card>
  );
}

function RequestCard({
  type,
  name,
  email,
  message,
  meta,
  actions,
}: {
  type: "invite" | "request";
  name: string;
  email: string;
  message?: string;
  meta: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border p-3">
      <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
        {type === "invite" ? (
          <Mail className="h-4 w-4" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{name}</span>
          <Badge variant="outline">
            {type === "invite" ? "Invited" : "Request"}
          </Badge>
        </div>
        <p className="text-muted-foreground text-xs">{email}</p>
        {message && <p className="mt-1 text-xs italic">"{message}"</p>}
        <div className="text-muted-foreground mt-1 flex items-center gap-1 text-[0.625rem]">
          <Clock className="h-3 w-3" />
          {meta}
        </div>
      </div>
      {actions && <div className="flex shrink-0 gap-1">{actions}</div>}
    </div>
  );
}

function RequestsColumn({ data }: { data: TeamDetailsFixture }) {
  const { joinRequests, invitations, permissions } = data;
  const pendingInvites = invitations.filter((i) => i.status === "pending");
  const pendingRequests = joinRequests.filter((r) => r.status === "pending");
  const totalPending = pendingInvites.length + pendingRequests.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          Invites & Requests
          {totalPending > 0 && (
            <Badge variant="secondary">{totalPending}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {totalPending === 0 ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground text-xs">Nothing pending</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingInvites.map((inv) => (
              <RequestCard
                key={inv._id}
                type="invite"
                name={inv.userName}
                email={inv.userEmail}
                meta={`Invited by ${inv.invitedBy}`}
                actions={
                  permissions.canInvite ? (
                    <Button variant="ghost" size="sm">
                      Cancel
                    </Button>
                  ) : undefined
                }
              />
            ))}
            {pendingRequests.map((req) => (
              <RequestCard
                key={req._id}
                type="request"
                name={req.userName}
                email={req.userEmail}
                message={req.message}
                meta={new Date(req.createdAt).toLocaleDateString()}
                actions={
                  permissions.canManageMembers ? (
                    <>
                      <Button variant="ghost" size="sm">
                        Reject
                      </Button>
                      <Button size="sm">Approve</Button>
                    </>
                  ) : undefined
                }
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TeamDetailsVariantCContent({ data }: { data: TeamDetailsFixture }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <TeamInfoCard data={data} />
        <MembersCard data={data} />
      </div>
      <div className="space-y-6">
        <RequestsColumn data={data} />
      </div>
    </div>
  );
}

export function TeamDetailsVariantC() {
  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center gap-3">
          <ArrowLeft className="h-5 w-5" />
          <h1 className="text-2xl font-bold">
            Variant C — Two-Column Workspace
          </h1>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          Split layout: team info + roster on the left, requests + activity on
          the right. Everything visible at once.
        </p>
        <Separator className="mt-4" />
      </div>

      {ALL_FIXTURES.map(({ label, fixture }) => (
        <section key={label} className="space-y-4">
          <h2 className="text-lg font-semibold">{label}</h2>
          <TeamDetailsVariantCContent data={fixture} />
        </section>
      ))}
    </div>
  );
}
