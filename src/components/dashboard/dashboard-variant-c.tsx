"use client";

import {
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  Crown,
  FileText,
  Plus,
  Shield,
  Target,
  Trophy,
  UserPlus,
  Users,
  XCircle,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import type {
  DashboardFixtureData,
  DemoActivity,
} from "./dashboard-variant-fixtures";

/**
 * Variant C — Activity Stream (Feed-First)
 *
 * The dashboard is a social-style feed. A central timeline shows all
 * recent events with rich context. Compact sidebar widgets provide
 * at-a-glance summaries of teams, tournaments, and deadlines.
 * The viewer scrolls the feed to stay current and acts inline.
 */
export function DashboardVariantC({ data }: { data: DashboardFixtureData }) {
  const feedItems = buildFeedItems(data);

  return (
    <div className="space-y-6">
      {/* Compact header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activity Feed</h1>
          <p className="text-muted-foreground">
            What's happening across your tournaments, {data.userName}
          </p>
        </div>
        <Button size="sm">
          <Plus className="mr-1 size-4" />
          New Submission
        </Button>
      </div>

      {/* Admin bar */}
      {data.isAdmin && data.adminStats && <AdminBar stats={data.adminStats} />}

      {/* Main layout: feed + sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Central feed */}
        <section className="space-y-1">
          <h2 className="sr-only">Activity timeline</h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="bg-border absolute top-0 bottom-0 left-5 w-px" />

            {feedItems.map((item, i) => (
              <FeedCard key={i} item={item} />
            ))}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          {/* Quick stats */}
          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-4" />
                At a Glance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <GlanceStat
                  icon={<Users className="size-3.5 text-blue-500" />}
                  label="Teams"
                  value={data.teams.length}
                />
                <GlanceStat
                  icon={<Trophy className="size-3.5 text-green-500" />}
                  label="Active"
                  value={data.activeTournamentsCount}
                />
                <GlanceStat
                  icon={<FileText className="size-3.5 text-yellow-500" />}
                  label="Pending"
                  value={data.pendingSubmissionsCount}
                />
                <GlanceStat
                  icon={<Bell className="size-3.5 text-purple-500" />}
                  label="Invitations"
                  value={data.invitationsCount}
                />
              </div>
            </CardContent>
          </Card>

          {/* Teams summary */}
          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4" />
                My Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.teams.map((t) => (
                  <li
                    key={t.team._id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-1.5">
                      {t.userRole === "captain" && (
                        <Crown className="size-3 text-yellow-500" />
                      )}
                      <span className="truncate text-xs font-medium">
                        {t.team.name}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-[0.65rem]">
                      {t.team.points} pts
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Deadlines */}
          {data.deadlines.length > 0 && (
            <Card size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="size-4" />
                  Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.deadlines.map((d) => (
                    <li
                      key={d.tournament._id}
                      className="flex items-center justify-between"
                    >
                      <span className="truncate text-xs">
                        {d.tournament.name}
                      </span>
                      <Badge
                        variant={
                          d.daysUntilEnd <= 3 ? "destructive" : "secondary"
                        }
                      >
                        {d.daysUntilEnd}d
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Quick actions */}
          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="size-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start"
              >
                <Trophy className="mr-2 size-3.5" />
                Browse Tournaments
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start"
              >
                <FileText className="mr-2 size-3.5" />
                My Submissions
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start"
              >
                <Users className="mr-2 size-3.5" />
                My Teams
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feed items
// ---------------------------------------------------------------------------

type FeedItem =
  | { kind: "activity"; data: DemoActivity }
  | {
      kind: "invitation";
      teamName: string;
      tournamentName: string;
      invitedBy: string;
      timestamp: number;
    }
  | {
      kind: "join-request";
      userName: string;
      teamName: string;
      timestamp: number;
    }
  | {
      kind: "deadline";
      tournamentName: string;
      daysLeft: number;
      timestamp: number;
    }
  | {
      kind: "submission";
      teamName: string;
      tournamentName: string;
      date: string;
      timestamp: number;
    };

function buildFeedItems(data: DashboardFixtureData): FeedItem[] {
  const items: (FeedItem & { _ts: number })[] = [];

  for (const a of data.activities) {
    items.push({ kind: "activity", data: a, _ts: a.timestamp });
  }

  for (const inv of data.invitations) {
    items.push({
      kind: "invitation",
      teamName: inv.teamName,
      tournamentName: inv.tournamentName,
      invitedBy: inv.invitedBy,
      timestamp: inv.timestamp,
      _ts: inv.timestamp,
    });
  }

  for (const jr of data.joinRequests) {
    items.push({
      kind: "join-request",
      userName: jr.userName,
      teamName: jr.teamName,
      timestamp: jr.timestamp,
      _ts: jr.timestamp,
    });
  }

  for (const d of data.deadlines) {
    const ts = Date.now() - d.daysUntilEnd * 1000;
    items.push({
      kind: "deadline",
      tournamentName: d.tournament.name,
      daysLeft: d.daysUntilEnd,
      timestamp: ts,
      _ts: ts,
    });
  }

  for (const s of data.pendingSubmissions) {
    const ts = new Date(s.date).getTime();
    items.push({
      kind: "submission",
      teamName: s.teamName,
      tournamentName: s.tournamentName,
      date: s.date,
      timestamp: ts,
      _ts: ts,
    });
  }

  items.sort((a, b) => b._ts - a._ts);
  return items;
}

// ---------------------------------------------------------------------------
// Feed Card
// ---------------------------------------------------------------------------

function FeedCard({ item }: { item: FeedItem }) {
  return (
    <div className="relative flex gap-3 pb-4 pl-10">
      {/* Timeline dot */}
      <div
        className={cn(
          "absolute top-1 left-[14px] z-10 size-2.5 rounded-full ring-2 ring-white dark:ring-gray-950",
          item.kind === "invitation" && "bg-blue-500",
          item.kind === "join-request" && "bg-green-500",
          item.kind === "deadline" && "bg-red-500",
          item.kind === "submission" && "bg-yellow-500",
          item.kind === "activity" && "bg-gray-400",
        )}
      />

      {/* Content */}
      {item.kind === "activity" && <ActivityFeedCard activity={item.data} />}
      {item.kind === "invitation" && <InvitationFeedCard item={item} />}
      {item.kind === "join-request" && <JoinRequestFeedCard item={item} />}
      {item.kind === "deadline" && <DeadlineFeedCard item={item} />}
      {item.kind === "submission" && <SubmissionFeedCard item={item} />}
    </div>
  );
}

function ActivityFeedCard({ activity }: { activity: DemoActivity }) {
  return (
    <Card size="sm" className="flex-1">
      <CardContent className="flex items-start gap-2">
        <ActivityIcon icon={activity.icon} />
        <div className="min-w-0 flex-1">
          <p className="text-xs">{activity.description}</p>
          <p className="text-muted-foreground text-[0.65rem]">
            {formatRelative(activity.timestamp)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function InvitationFeedCard({
  item,
}: {
  item: Extract<FeedItem, { kind: "invitation" }>;
}) {
  return (
    <Card size="sm" className="flex-1 border-blue-200 dark:border-blue-900">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-blue-500" />
          <CardTitle>Team Invitation</CardTitle>
        </div>
        <CardDescription>
          {item.teamName} · {item.tournamentName}
        </CardDescription>
        <CardAction className="flex gap-1">
          <Button size="xs">Accept</Button>
          <Button size="xs" variant="outline">
            Decline
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <span className="text-xs">
          Invited by <span className="font-medium">{item.invitedBy}</span>
        </span>
        <span className="text-muted-foreground text-[0.65rem]">
          {formatRelative(item.timestamp)}
        </span>
      </CardContent>
    </Card>
  );
}

function JoinRequestFeedCard({
  item,
}: {
  item: Extract<FeedItem, { kind: "join-request" }>;
}) {
  return (
    <Card size="sm" className="flex-1 border-green-200 dark:border-green-900">
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserPlus className="size-4 text-green-500" />
          <CardTitle>Join Request</CardTitle>
        </div>
        <CardDescription>{item.teamName}</CardDescription>
        <CardAction className="flex gap-1">
          <Button size="xs">Approve</Button>
          <Button size="xs" variant="outline">
            Reject
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <span className="text-xs">
          <span className="font-medium">{item.userName}</span> wants to join
        </span>
        <span className="text-muted-foreground text-[0.65rem]">
          {formatRelative(item.timestamp)}
        </span>
      </CardContent>
    </Card>
  );
}

function DeadlineFeedCard({
  item,
}: {
  item: Extract<FeedItem, { kind: "deadline" }>;
}) {
  return (
    <Card
      size="sm"
      className={cn(
        "flex-1",
        item.daysLeft <= 3
          ? "border-red-200 dark:border-red-900"
          : "border-yellow-200 dark:border-yellow-900",
      )}
    >
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar
            className={cn(
              "size-4",
              item.daysLeft <= 3 ? "text-red-500" : "text-yellow-500",
            )}
          />
          <div>
            <p className="text-xs font-medium">{item.tournamentName}</p>
            <p className="text-muted-foreground text-[0.65rem]">
              Tournament ending soon
            </p>
          </div>
        </div>
        <Badge variant={item.daysLeft <= 3 ? "destructive" : "secondary"}>
          {item.daysLeft}d left
        </Badge>
      </CardContent>
    </Card>
  );
}

function SubmissionFeedCard({
  item,
}: {
  item: Extract<FeedItem, { kind: "submission" }>;
}) {
  return (
    <Card size="sm" className="flex-1">
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="text-muted-foreground size-4" />
          <div>
            <p className="text-xs font-medium">
              Submission pending — {item.teamName}
            </p>
            <p className="text-muted-foreground text-[0.65rem]">
              {item.tournamentName} · {item.date}
            </p>
          </div>
        </div>
        <Badge variant="secondary">Pending</Badge>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Admin Bar
// ---------------------------------------------------------------------------

function AdminBar({
  stats,
}: {
  stats: NonNullable<DashboardFixtureData["adminStats"]>;
}) {
  const approvalRate =
    stats.submissions.total > 0
      ? Math.round((stats.submissions.approved / stats.submissions.total) * 100)
      : 0;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Shield className="text-primary size-5" />
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <AdminMiniStat label="Users" value={stats.users.total} />
            <AdminMiniStat
              label="Tournaments"
              value={stats.tournaments.total}
            />
            <AdminMiniStat label="Teams" value={stats.teams.total} />
            <AdminMiniStat
              label="Pending"
              value={stats.submissions.pending}
              highlight={stats.submissions.pending > 0}
            />
            <AdminMiniStat label="Approval" value={`${approvalRate}%`} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="xs" variant="outline">
            <Users className="mr-1 size-3" />
            Users
          </Button>
          <Button size="xs" variant="outline">
            <Trophy className="mr-1 size-3" />
            Tournaments
          </Button>
          <Button size="xs">
            <FileText className="mr-1 size-3" />
            Review ({stats.submissions.pending})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminMiniStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <p className="text-muted-foreground text-[0.6rem] tracking-wide uppercase">
        {label}
      </p>
      <p className={cn("text-sm font-bold", highlight && "text-destructive")}>
        {value}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function GlanceStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-900/50">
      {icon}
      <div>
        <p className="text-lg leading-none font-bold">{value}</p>
        <p className="text-muted-foreground text-[0.6rem]">{label}</p>
      </div>
    </div>
  );
}

const ICON_MAP: Record<string, React.ElementType> = {
  "check-circle": CheckCircle,
  "x-circle": XCircle,
  users: Users,
  "user-plus": UserPlus,
};

function ActivityIcon({ icon }: { icon: string }) {
  const Icon = ICON_MAP[icon] ?? Clock;
  return <Icon className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />;
}

function formatRelative(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
