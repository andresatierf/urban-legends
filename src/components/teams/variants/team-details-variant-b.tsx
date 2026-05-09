import {
  Activity,
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle,
  Crown,
  DoorOpen,
  Flame,
  Mail,
  MoreHorizontal,
  Pencil,
  Shield,
  Trash2,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { TeamDetailsFixture } from "./team-details-fixtures";
import { ALL_FIXTURES } from "./team-details-fixtures";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function HeroHeader({ data }: { data: TeamDetailsFixture }) {
  const { team, tournament, captain, stats, permissions, userMembership } =
    data;
  const isFull =
    team.maxMembers !== null && stats.memberCount >= team.maxMembers;

  const hasActions =
    permissions.canEdit ||
    permissions.canDelete ||
    permissions.canInvite ||
    permissions.canLeave ||
    permissions.canTransferCaptaincy;

  return (
    <div className="bg-card ring-foreground/10 rounded-lg ring-1">
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="bg-primary text-primary-foreground flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-2xl font-bold">
            {team.name.charAt(0)}
          </div>
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              {team.name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
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
            </div>
            <div className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 shrink-0" />
              <span className="truncate">{tournament.name}</span>
              <Badge
                variant={
                  tournament.status === "active" ? "default" : "secondary"
                }
              >
                {tournament.status}
              </Badge>
            </div>
            <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
              <Crown className="h-4 w-4 shrink-0 text-amber-500" />
              <span>Captain: {captain.name}</span>
            </div>
          </div>
        </div>
        {hasActions && (
          <div className="flex items-center gap-2">
            {permissions.canInvite && (
              <Button variant="outline" size="sm">
                <UserPlus className="h-4 w-4" />
                Invite
              </Button>
            )}
            {permissions.canLeave && (
              <Button variant="outline" size="sm">
                <DoorOpen className="h-4 w-4" />
                Leave
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
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
          </div>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-3 gap-px sm:grid-cols-6">
        <MiniStat
          icon={Award}
          label="Points"
          value={String(stats.points)}
          color="text-yellow-600"
        />
        <MiniStat
          icon={Users}
          label="Members"
          value={`${stats.memberCount}${team.maxMembers ? `/${team.maxMembers}` : ""}`}
          color="text-blue-600"
        />
        <MiniStat
          icon={Activity}
          label="Submissions"
          value={String(stats.submissionCount)}
          color="text-indigo-600"
        />
        <MiniStat
          icon={CheckCircle}
          label="Approval"
          value={`${(stats.approvalRate * 100).toFixed(0)}%`}
          color="text-green-600"
        />
        <MiniStat
          icon={Flame}
          label="Streak"
          value={`${stats.currentStreak}d`}
          color="text-orange-600"
        />
        <MiniStat
          icon={Calendar}
          label="Completion"
          value={`${(stats.completionRate * 100).toFixed(0)}%`}
          color="text-purple-600"
        />
      </div>
    </div>
  );
}

function MiniStat({
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
    <div className="flex flex-col items-center gap-1 px-2 py-3 text-center">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className="text-sm font-semibold">{value}</span>
      <span className="text-muted-foreground text-[0.625rem]">{label}</span>
    </div>
  );
}

function MembersTab({ data }: { data: TeamDetailsFixture }) {
  const { members, permissions } = data;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => (
        <Card key={member._id}>
          <CardContent className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">
                  {member.name}
                </span>
                {member.memberRole === "captain" && (
                  <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                )}
              </div>
              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                <Mail className="h-3 w-3" />
                <span className="truncate">{member.email}</span>
              </div>
              <Badge
                className="mt-1"
                variant={
                  member.memberRole === "captain" ? "default" : "secondary"
                }
              >
                {member.memberRole}
              </Badge>
            </div>
            {permissions.canManageMembers &&
              member.memberRole !== "captain" && (
                <Button variant="ghost" size="icon" className="shrink-0">
                  <DoorOpen className="h-4 w-4" />
                </Button>
              )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RequestsTab({ data }: { data: TeamDetailsFixture }) {
  const { joinRequests, invitations, permissions } = data;
  const pendingInvites = invitations.filter((i) => i.status === "pending");
  const pendingRequests = joinRequests.filter((r) => r.status === "pending");

  if (pendingInvites.length === 0 && pendingRequests.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground text-sm">
          No pending invites or requests
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Pending Invitations ({pendingInvites.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingInvites.map((inv) => (
              <div
                key={inv._id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{getInitials(inv.userName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{inv.userName}</p>
                    <p className="text-muted-foreground text-xs">
                      {inv.userEmail}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Pending</Badge>
                  {permissions.canInvite && (
                    <Button variant="ghost" size="sm">
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Join Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req._id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{getInitials(req.userName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{req.userName}</p>
                    <p className="text-muted-foreground text-xs">
                      {req.userEmail}
                    </p>
                    {req.message && (
                      <p className="mt-0.5 max-w-sm text-xs italic">
                        "{req.message}"
                      </p>
                    )}
                  </div>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TeamDetailsVariantBContent({ data }: { data: TeamDetailsFixture }) {
  const pendingCount =
    data.invitations.filter((i) => i.status === "pending").length +
    data.joinRequests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <HeroHeader data={data} />

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="h-3.5 w-3.5" />
            Members ({data.stats.memberCount})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Requests
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="members">
          <MembersTab data={data} />
        </TabsContent>
        <TabsContent value="requests">
          <RequestsTab data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function TeamDetailsVariantB() {
  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center gap-3">
          <ArrowLeft className="h-5 w-5" />
          <h1 className="text-2xl font-bold">
            Variant B — Profile Hero + Tabs
          </h1>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          Full-width hero header with inline stats, tabbed content below. Clean,
          focused, one-section-at-a-time.
        </p>
        <Separator className="mt-4" />
      </div>

      {ALL_FIXTURES.map(({ label, fixture }) => (
        <section key={label} className="space-y-4">
          <h2 className="text-lg font-semibold">{label}</h2>
          <TeamDetailsVariantBContent data={fixture} />
        </section>
      ))}
    </div>
  );
}
