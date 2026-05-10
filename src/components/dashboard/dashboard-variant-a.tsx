"use client";

import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle,
  Clock,
  Crown,
  FileText,
  Inbox,
  LayoutDashboard,
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
import { cn } from "@/lib/utils";

import type { DashboardFixtureData } from "./dashboard-variant-fixtures";
import { ActivityIcon, formatRelative } from "./dashboard-variant-shared";

/**
 * Variant A — Command Center (Action-First)
 *
 * The dashboard is a triage surface. Pending actions occupy the top half;
 * everything else (teams, tournaments, feed) is secondary. The viewer
 * lands, clears their queue, and moves on.
 */
export function DashboardVariantA({ data }: { data: DashboardFixtureData }) {
  const today = new Date().toISOString().slice(0, 10);
  const urgentDeadlines = data.deadlines.filter((d) => d.daysUntilEnd <= 3);
  const hasUrgent =
    urgentDeadlines.length > 0 ||
    data.pendingSubmissions.length > 0 ||
    data.invitations.length > 0 ||
    data.joinRequests.length > 0;

  return (
    <div className="space-y-8">
      {/* Header with attention counter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {data.userName}</h1>
          <p className="text-muted-foreground">
            {hasUrgent
              ? "You have items that need your attention."
              : "You're all caught up!"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm">
            <Plus className="mr-1 size-4" />
            New Submission
          </Button>
          <Button variant="outline" size="sm">
            <Trophy className="mr-1 size-4" />
            Browse Tournaments
          </Button>
        </div>
      </div>

      {/* Admin command strip */}
      {data.isAdmin && data.adminStats && (
        <AdminCommandStrip stats={data.adminStats} />
      )}

      {/* Action queue — the main surface */}
      <section aria-label="Pending actions">
        <div className="mb-4 flex items-center gap-2">
          <Inbox className="text-primary size-5" />
          <h2 className="text-lg font-semibold">Action Queue</h2>
          {hasUrgent && (
            <Badge variant="destructive" className="ml-1">
              {data.pendingSubmissions.length +
                data.invitations.length +
                data.joinRequests.length +
                urgentDeadlines.length}
            </Badge>
          )}
        </div>

        {!hasUrgent && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="text-muted-foreground mb-3 size-10" />
              <p className="text-muted-foreground font-medium">
                No pending actions — you're all clear!
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {/* Urgent deadlines */}
          {urgentDeadlines.map((d) => (
            <Card key={d.tournament._id}>
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-red-500" />
                  <CardTitle className="text-red-600">
                    Deadline Approaching
                  </CardTitle>
                </div>
                <CardDescription>{d.tournament.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Ends in{" "}
                  <span className="font-bold text-red-600">
                    {d.daysUntilEnd} day{d.daysUntilEnd !== 1 ? "s" : ""}
                  </span>
                </p>
              </CardContent>
              <CardFooter>
                <Button size="xs" variant="outline">
                  View Tournament
                  <ArrowRight className="ml-1 size-3" />
                </Button>
              </CardFooter>
            </Card>
          ))}

          {/* Pending submissions */}
          {data.pendingSubmissions.map((s) => (
            <Card key={s.id}>
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <Clock className="text-muted-foreground size-4" />
                  <CardTitle>Pending Submission</CardTitle>
                </div>
                <CardDescription>
                  {s.teamName} · {s.tournamentName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Submitted {s.date}
                </p>
              </CardContent>
              <CardFooter>
                <Badge variant="secondary">Awaiting review</Badge>
              </CardFooter>
            </Card>
          ))}

          {/* Invitations */}
          {data.invitations.map((inv) => (
            <Card key={inv.id}>
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <Bell className="size-4 text-blue-500" />
                  <CardTitle>Team Invitation</CardTitle>
                </div>
                <CardDescription>
                  {inv.teamName} · {inv.tournamentName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Invited by{" "}
                  <span className="font-medium">{inv.invitedBy}</span>
                </p>
              </CardContent>
              <CardFooter className="gap-2">
                <Button size="xs">Accept</Button>
                <Button size="xs" variant="outline">
                  Decline
                </Button>
              </CardFooter>
            </Card>
          ))}

          {/* Join requests (captain) */}
          {data.joinRequests.map((jr) => (
            <Card key={jr.id}>
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <UserPlus className="size-4 text-green-500" />
                  <CardTitle>Join Request</CardTitle>
                </div>
                <CardDescription>{jr.teamName}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  <span className="font-medium">{jr.userName}</span> wants to
                  join
                </p>
              </CardContent>
              <CardFooter className="gap-2">
                <Button size="xs">Approve</Button>
                <Button size="xs" variant="outline">
                  Reject
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Secondary content: Teams + Tournaments + Activity in a 3-col layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Teams column */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Users className="text-muted-foreground size-4" />
            <h2 className="font-semibold">My Teams</h2>
          </div>
          <div className="space-y-3">
            {data.teams.map((t) => (
              <Card key={t.team._id} size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-1.5">
                    {t.team.name}
                    {t.userRole === "captain" && (
                      <Crown className="size-3 text-yellow-500" />
                    )}
                  </CardTitle>
                  <CardDescription>{t.tournament.name}</CardDescription>
                  <CardAction>
                    <Badge variant="outline">{t.memberCount} members</Badge>
                  </CardAction>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">
                    {t.team.points} pts
                  </span>
                  <Badge variant="secondary">{t.userRole}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Active tournaments column */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="text-muted-foreground size-4" />
            <h2 className="font-semibold">Active Tournaments</h2>
          </div>
          <div className="space-y-3">
            {data.teams
              .filter(
                (t) =>
                  t.tournament.startDate <= today &&
                  t.tournament.endDate >= today,
              )
              .map((t) => (
                <Card key={t.tournament._id} size="sm">
                  <CardHeader>
                    <CardTitle>{t.tournament.name}</CardTitle>
                    <CardDescription>via {t.team.name}</CardDescription>
                    <CardAction>
                      <Badge>Active</Badge>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-xs">
                      Ends {t.tournament.endDate}
                    </p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </section>

        {/* Activity + deadlines column */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <LayoutDashboard className="text-muted-foreground size-4" />
            <h2 className="font-semibold">Recent Activity</h2>
          </div>
          <Card>
            <CardContent>
              <ul className="divide-y">
                {data.activities.slice(0, 6).map((a, i) => (
                  <li key={i} className="flex items-start gap-2 py-2">
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

          {data.deadlines.length > 0 && (
            <>
              <div className="mt-6 mb-3 flex items-center gap-2">
                <Clock className="text-muted-foreground size-4" />
                <h2 className="font-semibold">Upcoming Deadlines</h2>
              </div>
              <div className="space-y-2">
                {data.deadlines.map((d) => (
                  <Card key={d.tournament._id} size="sm">
                    <CardContent className="flex items-center justify-between">
                      <span className="text-xs font-medium">
                        {d.tournament.name}
                      </span>
                      <Badge
                        variant={
                          d.daysUntilEnd <= 3 ? "destructive" : "secondary"
                        }
                      >
                        {d.daysUntilEnd}d left
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin Command Strip
// ---------------------------------------------------------------------------

function AdminCommandStrip({
  stats,
}: {
  stats: NonNullable<DashboardFixtureData["adminStats"]>;
}) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="text-primary size-5" />
          <CardTitle className="text-base">Admin Command Center</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat
            label="Users"
            value={stats.users.total}
            sub={`+${stats.users.newThisWeek} this week`}
          />
          <MiniStat
            label="Tournaments"
            value={stats.tournaments.total}
            sub={`${stats.tournaments.active} active`}
          />
          <MiniStat label="Teams" value={stats.teams.total} />
          <MiniStat
            label="Pending Reviews"
            value={stats.submissions.pending}
            highlight={stats.submissions.pending > 0}
          />
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button size="xs" variant="outline">
          <Users className="mr-1 size-3" />
          Manage Users
        </Button>
        <Button size="xs" variant="outline">
          <Trophy className="mr-1 size-3" />
          Manage Tournaments
        </Button>
        <Button size="xs" variant="outline">
          <FileText className="mr-1 size-3" />
          Review Submissions
        </Button>
      </CardFooter>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={cn("text-xl font-bold", highlight && "text-destructive")}>
        {value}
      </p>
      {sub && <p className="text-muted-foreground text-[0.65rem]">{sub}</p>}
    </div>
  );
}
