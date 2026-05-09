import {
  BarChart3,
  Calendar,
  ChevronRight,
  Clock,
  Crown,
  Pencil,
  Shield,
  Trophy,
  Users,
} from "lucide-react";

import { useFormattedDate } from "@/hooks/useFormattedDate";

import { SectionHeader } from "../section-header";
import type { DemoTournamentDetails } from "../tournament-details-demo-fixtures";
import { ALL_SCENARIOS } from "../tournament-details-demo-fixtures";
import { TournamentDetailsDemoNav } from "../tournament-details-demo-nav";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function StatusBadge({ status }: { status: "active" | "upcoming" | "ended" }) {
  switch (status) {
    case "active":
      return <Badge variant="default">Active</Badge>;
    case "upcoming":
      return <Badge variant="outline">Upcoming</Badge>;
    case "ended":
      return <Badge variant="secondary">Ended</Badge>;
  }
}

function TournamentProgress({ data }: { data: DemoTournamentDetails }) {
  const start = new Date(data.tournament.startDate).getTime();
  const end = new Date(data.tournament.endDate).getTime();
  const now = Date.now();
  const total = end - start;
  const elapsed = Math.max(0, Math.min(now - start, total));
  const pct = total > 0 ? Math.round((elapsed / total) * 100) : 0;
  const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

  if (data.status === "upcoming") {
    const daysUntil = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
    return (
      <div className="text-muted-foreground text-xs">
        Starts in {daysUntil} day{daysUntil === 1 ? "" : "s"}
      </div>
    );
  }

  if (data.status === "ended") {
    return (
      <div className="text-muted-foreground text-xs">Tournament ended</div>
    );
  }

  return (
    <div className="space-y-1">
      <Progress value={pct} className="h-2" />
      <div className="text-muted-foreground flex justify-between text-xs">
        <span>{pct}% complete</span>
        <span>
          {daysLeft} day{daysLeft === 1 ? "" : "s"} left
        </span>
      </div>
    </div>
  );
}

function DashboardLayout({ data }: { data: DemoTournamentDetails }) {
  const { format } = useFormattedDate();
  const sortedTeams = [...data.teams].sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-6">
      {/* Header: title + status + actions */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold">{data.tournament.name}</h2>
            <StatusBadge status={data.status} />
          </div>
          <p className="text-muted-foreground max-w-2xl text-sm">
            {data.tournament.description}
          </p>
        </div>
        <div className="flex gap-2">
          {data.canViewLeaderboard && (
            <Button variant="outline" size="sm">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Button>
          )}
          {data.canEdit && (
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary rounded-lg p-2">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold">
                {data.statistics.totalTeams}
              </div>
              <div className="text-muted-foreground text-xs">Teams</div>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold">
                {data.statistics.totalParticipants}
              </div>
              <div className="text-muted-foreground text-xs">Participants</div>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold">
                {data.statistics.averageTeamSize.toFixed(1)}
              </div>
              <div className="text-muted-foreground text-xs">Avg Size</div>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-muted-foreground text-xs">
                <Calendar className="mr-1 inline h-3 w-3" />
                {format(data.tournament.startDate, "short")} –{" "}
                {format(data.tournament.endDate, "short")}
              </div>
              <TournamentProgress data={data} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two-column: teams (main) + sidebar */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main: teams grid */}
        <div className="space-y-4">
          <SectionHeader as="h2" title="Teams" Icon={Users} />
          <div className="grid gap-3 sm:grid-cols-2">
            {sortedTeams.map((team, i) => {
              const isUserTeam = data.userTeam?._id === team._id;
              return (
                <Card
                  key={team._id}
                  className={
                    isUserTeam
                      ? "border-blue-300 dark:border-blue-700"
                      : undefined
                  }
                >
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs font-semibold">
                          #{i + 1}
                        </span>
                        <CardTitle>{team.name}</CardTitle>
                        {isUserTeam && (
                          <Badge variant="secondary" className="text-[0.6rem]">
                            Your team
                          </Badge>
                        )}
                      </div>
                      <span className="font-bold">{team.points} pts</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <AvatarGroup>
                        {team.members.slice(0, 4).map((m) => (
                          <Avatar key={m._id} size="sm">
                            <AvatarFallback>
                              {getInitials(m.name)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {team.members.length > 4 && (
                          <AvatarGroupCount>
                            +{team.members.length - 4}
                          </AvatarGroupCount>
                        )}
                      </AvatarGroup>
                      <div className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Users className="h-3 w-3" />
                        {team.memberCount}
                        {team.maxMembers && `/${team.maxMembers}`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        View
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                      {!data.userTeam && team.joinPolicy === "open" && (
                        <Button size="sm" className="flex-1">
                          Join
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* User team card */}
          {data.userTeam && (
            <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Your Team
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{data.userTeam.name}</span>
                  <Badge variant="secondary">Captain</Badge>
                </div>
                <div className="text-muted-foreground flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {data.userTeam.memberCount} members
                  </span>
                  <span className="font-semibold">
                    {data.userTeam.points} pts
                  </span>
                </div>
                <Separator />
                <div className="space-y-1">
                  {data.userTeam.members.map((m) => (
                    <div
                      key={m._id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Avatar size="sm">
                        <AvatarFallback>{getInitials(m.name)}</AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate">{m.name}</span>
                      {m.memberRole === "captain" && (
                        <Crown className="h-3 w-3 text-amber-500" />
                      )}
                    </div>
                  ))}
                </div>
                <Button className="w-full" size="sm">
                  View Team
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tournament info */}
          <Card>
            <CardHeader>
              <CardTitle>Tournament Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start</span>
                <span>{format(data.tournament.startDate, "long")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End</span>
                <span>{format(data.tournament.endDate, "long")}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Team size</span>
                <span>
                  {data.tournament.teamMinSize ?? "—"} –{" "}
                  {data.tournament.teamMaxSize ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Daily limit</span>
                <span>
                  {data.tournament.maxSubmissionsPerDay ?? "Unlimited"}{" "}
                  submissions
                </span>
              </div>
              <Separator />
              <CardDescription>Scoring</CardDescription>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Individual</span>
                <span>
                  {data.tournament.scoringConfig.individualPoints.base} /{" "}
                  {data.tournament.scoringConfig.individualPoints.advanced} pts
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Team exercise</span>
                <span>
                  {data.tournament.scoringConfig.teamExercisePoints.base} /{" "}
                  {data.tournament.scoringConfig.teamExercisePoints.advanced}{" "}
                  pts
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function VariantA() {
  return (
    <div>
      <TournamentDetailsDemoNav />
      <SectionHeader
        as="h1"
        title="Variant A — Dashboard"
        description="Stats-forward grid with team cards ranked by points and a sidebar for user context and tournament info."
      />
      {ALL_SCENARIOS.map(({ label, data }) => (
        <div key={label} className="mt-8">
          <SectionHeader as="h2" title={label} />
          <div className="mt-4">
            <DashboardLayout data={data} />
          </div>
        </div>
      ))}
    </div>
  );
}
