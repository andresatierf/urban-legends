"use client";

import {
  ArrowUpRight,
  BarChart3,
  Calendar,
  Clock,
  Crown,
  FileText,
  Plus,
  Shield,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import type { DashboardFixtureData } from "./dashboard-variant-fixtures";
import { ActivityIcon, formatRelative } from "./dashboard-variant-shared";

/**
 * Variant B — Overview Hub (Status-First)
 *
 * The dashboard is a status board. A hero stats strip anchors the top,
 * followed by status-rich team and tournament cards with progress bars.
 * The viewer lands, sees where everything stands at a glance, then
 * drills in. Admin overview is a prominent stats dashboard.
 */
export function DashboardVariantB({ data }: { data: DashboardFixtureData }) {
  const today = new Date().toISOString().slice(0, 10);
  const activeTournaments = data.teams.filter(
    (t) => t.tournament.startDate <= today && t.tournament.endDate >= today,
  );
  const upcomingTournaments = data.teams.filter(
    (t) => t.tournament.startDate > today,
  );
  const endedTournaments = data.teams.filter(
    (t) => t.tournament.endDate < today,
  );

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Good {getTimeOfDay()}, {data.userName}. Here's your overview.
        </p>
      </div>

      {/* Stats hero strip */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <HeroStat
          icon={<Users className="size-5 text-blue-500" />}
          label="Teams"
          value={data.teams.length}
          bg="bg-blue-50 dark:bg-blue-950/30"
        />
        <HeroStat
          icon={<Trophy className="size-5 text-green-500" />}
          label="Active Tournaments"
          value={data.activeTournamentsCount}
          bg="bg-green-50 dark:bg-green-950/30"
        />
        <HeroStat
          icon={<FileText className="size-5 text-yellow-500" />}
          label="Pending Submissions"
          value={data.pendingSubmissionsCount}
          bg="bg-yellow-50 dark:bg-yellow-950/30"
        />
        <HeroStat
          icon={<Calendar className="size-5 text-purple-500" />}
          label="Invitations"
          value={data.invitationsCount}
          bg="bg-purple-50 dark:bg-purple-950/30"
        />
      </div>

      {/* Admin panel */}
      {data.isAdmin && data.adminStats && (
        <AdminPanel stats={data.adminStats} />
      )}

      {/* Teams & tournaments — status-rich cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Team status cards */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Users className="size-5" />
              My Teams
            </h2>
            <Button size="xs" variant="ghost">
              View All <ArrowUpRight className="ml-1 size-3" />
            </Button>
          </div>
          <div className="space-y-4">
            {data.teams.map((t) => {
              const progress = getTournamentProgress(t.tournament);
              const status = getTournamentStatus(progress);
              return (
                <Card key={t.team._id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {t.team.name}
                      {t.userRole === "captain" && (
                        <Crown className="size-3.5 text-yellow-500" />
                      )}
                    </CardTitle>
                    <CardDescription>{t.tournament.name}</CardDescription>
                    <CardAction>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Tournament progress
                      </span>
                      <span className="font-medium">
                        {Math.round(Math.max(0, Math.min(100, progress)))}%
                      </span>
                    </div>
                    <Progress
                      value={Math.max(0, Math.min(100, progress))}
                      className="h-2"
                    />
                    <div className="flex gap-4">
                      <Metric label="Members" value={t.memberCount} />
                      <Metric label="Points" value={t.team.points} />
                      <Metric label="Role" value={t.userRole} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Right: Tournament timeline + status */}
        <section className="space-y-6">
          {/* Active tournaments */}
          {activeTournaments.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Trophy className="size-5 text-green-500" />
                Now Playing
              </h2>
              <div className="space-y-3">
                {activeTournaments.map((t) => (
                  <TournamentStatusCard
                    key={t.tournament._id}
                    data={t}
                    status="active"
                    deadlineDays={
                      data.deadlines.find(
                        (d) => d.tournament._id === t.tournament._id,
                      )?.daysUntilEnd
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming tournaments */}
          {upcomingTournaments.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Calendar className="size-5 text-blue-500" />
                Coming Soon
              </h2>
              <div className="space-y-3">
                {upcomingTournaments.map((t) => (
                  <TournamentStatusCard
                    key={t.tournament._id}
                    data={t}
                    status="upcoming"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Ended tournaments */}
          {endedTournaments.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <BarChart3 className="size-5 text-gray-400" />
                Past Tournaments
              </h2>
              <div className="space-y-3">
                {endedTournaments.map((t) => (
                  <TournamentStatusCard
                    key={t.tournament._id}
                    data={t}
                    status="ended"
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Bottom row: invitations, submissions, activity */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Invitations */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="size-4 text-blue-500" />
              Invitations
            </CardTitle>
            {data.invitations.length > 0 && (
              <CardAction>
                <Badge>{data.invitations.length}</Badge>
              </CardAction>
            )}
          </CardHeader>
          <CardContent>
            {data.invitations.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-xs">
                No pending invitations
              </p>
            ) : (
              <ul className="divide-y">
                {data.invitations.map((inv) => (
                  <li key={inv.id} className="py-3">
                    <p className="text-xs font-medium">{inv.teamName}</p>
                    <p className="text-muted-foreground text-[0.65rem]">
                      {inv.tournamentName} · by {inv.invitedBy}
                    </p>
                    <div className="mt-2 flex gap-1">
                      <Button size="xs">Accept</Button>
                      <Button size="xs" variant="outline">
                        Decline
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Pending submissions */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-4 text-yellow-500" />
              Pending Submissions
            </CardTitle>
            {data.pendingSubmissions.length > 0 && (
              <CardAction>
                <Badge variant="secondary">
                  {data.pendingSubmissions.length}
                </Badge>
              </CardAction>
            )}
          </CardHeader>
          <CardContent>
            {data.pendingSubmissions.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-xs">
                All submissions reviewed
              </p>
            ) : (
              <ul className="divide-y">
                {data.pendingSubmissions.map((s) => (
                  <li key={s.id} className="py-3">
                    <p className="text-xs font-medium">{s.teamName}</p>
                    <p className="text-muted-foreground text-[0.65rem]">
                      {s.tournamentName} · {s.date}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Activity feed */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {data.activities.slice(0, 5).map((a, i) => (
                <li key={i} className="flex items-start gap-2 py-2.5">
                  <ActivityIcon icon={a.icon} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs">{a.description}</p>
                    <p className="text-muted-foreground text-[0.65rem]">
                      {formatRelative(a.timestamp)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions bar */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-3">
          <span className="text-muted-foreground mr-2 text-xs font-medium">
            Quick Actions
          </span>
          <Button size="sm" variant="outline">
            <Plus className="mr-1 size-3" />
            New Submission
          </Button>
          <Button size="sm" variant="outline">
            <Trophy className="mr-1 size-3" />
            Browse Tournaments
          </Button>
          <Button size="sm" variant="outline">
            <Users className="mr-1 size-3" />
            My Teams
          </Button>
          <Button size="sm" variant="outline">
            <FileText className="mr-1 size-3" />
            My Submissions
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin Panel
// ---------------------------------------------------------------------------

function AdminPanel({
  stats,
}: {
  stats: NonNullable<DashboardFixtureData["adminStats"]>;
}) {
  const approvalRate =
    stats.submissions.total > 0
      ? Math.round((stats.submissions.approved / stats.submissions.total) * 100)
      : 0;

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <Shield className="text-primary size-5" />
          <CardTitle className="text-base">Platform Overview</CardTitle>
        </div>
        <CardDescription>
          Admin dashboard — platform-wide statistics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <AdminStat label="Total Users" value={stats.users.total}>
            <span className="text-green-600">
              +{stats.users.newThisWeek} this week
            </span>
          </AdminStat>
          <AdminStat label="Tournaments" value={stats.tournaments.total}>
            <div className="flex gap-2">
              <Badge variant="default">{stats.tournaments.active} active</Badge>
              <Badge variant="secondary">
                {stats.tournaments.upcoming} upcoming
              </Badge>
            </div>
          </AdminStat>
          <AdminStat label="Teams" value={stats.teams.total} />
          <AdminStat label="Approval Rate" value={`${approvalRate}%`}>
            <div className="mt-1">
              <Progress value={approvalRate} className="h-1.5" />
            </div>
          </AdminStat>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-3 dark:bg-yellow-950/30">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-yellow-600" />
            <span className="text-sm font-medium">
              {stats.submissions.pending} submissions awaiting review
            </span>
          </div>
          <Button size="xs">Review Now</Button>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button size="xs" variant="outline">
          Manage Users
        </Button>
        <Button size="xs" variant="outline">
          Manage Tournaments
        </Button>
        <Button size="xs" variant="outline">
          Manage Teams
        </Button>
      </CardFooter>
    </Card>
  );
}

function AdminStat({
  label,
  value,
  children,
}: {
  label: string;
  value: number | string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {children && <div className="mt-1 text-[0.65rem]">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tournament Status Card
// ---------------------------------------------------------------------------

function TournamentStatusCard({
  data,
  status,
  deadlineDays,
}: {
  data: DashboardFixtureData["teams"][number];
  status: "active" | "upcoming" | "ended";
  deadlineDays?: number;
}) {
  const statusColors = {
    active: "border-l-green-500",
    upcoming: "border-l-blue-500",
    ended: "border-l-gray-400",
  };

  return (
    <Card className={cn("border-l-4", statusColors[status])}>
      <CardHeader>
        <CardTitle>{data.tournament.name}</CardTitle>
        <CardDescription>
          {data.tournament.startDate} → {data.tournament.endDate}
        </CardDescription>
        {deadlineDays !== undefined && deadlineDays <= 3 && (
          <CardAction>
            <Badge variant="destructive">{deadlineDays}d left</Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs">
            <Users className="size-3" />
            <span>{data.team.name}</span>
          </div>
          <span className="text-muted-foreground text-xs">
            {data.team.points} pts
          </span>
          {data.userRole === "captain" && (
            <Badge variant="secondary" className="text-[0.6rem]">
              <Crown className="mr-0.5 size-2.5" />
              Captain
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function HeroStat({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
}) {
  return (
    <Card className={cn("p-4", bg)}>
      <CardContent className="flex items-center gap-3 p-0">
        {icon}
        <div>
          <p className="text-muted-foreground text-[0.65rem]">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-muted-foreground text-[0.65rem]">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function getTournamentProgress(tournament: {
  startDate: string;
  endDate: string;
}): number {
  const now = Date.now();
  const start = new Date(tournament.startDate).getTime();
  const end = new Date(tournament.endDate).getTime();
  if (now >= end) return 100;
  if (now <= start) return 0;
  return ((now - start) / (end - start)) * 100;
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function getTournamentStatus(progress: number): {
  label: string;
  variant: "default" | "outline";
} {
  if (progress > 0 && progress < 100)
    return { label: "Active", variant: "default" };
  if (progress >= 100) return { label: "Ended", variant: "outline" };
  return { label: "Upcoming", variant: "outline" };
}
