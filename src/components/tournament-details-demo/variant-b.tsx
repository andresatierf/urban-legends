import {
  Calendar,
  ChevronRight,
  Crown,
  Pencil,
  Shield,
  Trophy,
  Users,
} from "lucide-react";

import { useFormattedDate } from "@/hooks/useFormattedDate";
import { cn } from "@/lib/utils";

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
import { Card, CardContent, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { getInitials } from "../users/utils";

function StatusBadge({ status }: { status: "active" | "upcoming" | "ended" }) {
  const colors = {
    active:
      "bg-emerald-500/20 text-emerald-100 border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-200",
    upcoming:
      "bg-white/20 text-white border-white/30 dark:bg-white/10 dark:text-white/80",
    ended:
      "bg-white/10 text-white/70 border-white/20 dark:bg-white/10 dark:text-white/60",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        colors[status],
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
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
      <span className="text-xs text-white/70">
        Starts in {daysUntil} day{daysUntil === 1 ? "" : "s"}
      </span>
    );
  }
  if (data.status === "ended") {
    return <span className="text-xs text-white/70">Tournament ended</span>;
  }

  return (
    <div className="mt-3 max-w-md space-y-1">
      <Progress value={pct} className="h-1.5 bg-white/20" />
      <div className="flex justify-between text-xs text-white/70">
        <span>{pct}%</span>
        <span>
          {daysLeft} day{daysLeft === 1 ? "" : "s"} left
        </span>
      </div>
    </div>
  );
}

function MagazineLayout({ data }: { data: DemoTournamentDetails }) {
  const { format } = useFormattedDate();
  const sortedTeams = [...data.teams].sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="bg-primary relative overflow-hidden rounded-xl px-6 py-8 text-white sm:px-10 sm:py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/20" />
        <div className="relative space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold sm:text-3xl">
              {data.tournament.name}
            </h2>
            <StatusBadge status={data.status} />
          </div>
          <p className="max-w-2xl text-sm text-white/80">
            {data.tournament.description}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(data.tournament.startDate, "short")} –{" "}
              {format(data.tournament.endDate, "short")}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {data.statistics.totalTeams} teams ·{" "}
              {data.statistics.totalParticipants} participants
            </span>
          </div>
          <TournamentProgress data={data} />
          <div className="flex gap-2 pt-2">
            {data.canViewLeaderboard && (
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/20 text-white hover:bg-white/30"
              >
                <Trophy className="h-4 w-4" />
                Leaderboard
              </Button>
            )}
            {data.canEdit && (
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/20 text-white hover:bg-white/30"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* User team banner */}
      {data.userTeam && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <Shield className="text-primary h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{data.userTeam.name}</span>
                  <Badge variant="secondary" className="text-[0.6rem]">
                    Captain
                  </Badge>
                </div>
                <div className="text-muted-foreground text-xs">
                  {data.userTeam.memberCount} members · {data.userTeam.points}{" "}
                  pts
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AvatarGroup>
                {data.userTeam.members.slice(0, 4).map((m) => (
                  <Avatar key={m._id} size="sm">
                    <AvatarFallback>{getInitials(m.name)}</AvatarFallback>
                  </Avatar>
                ))}
                {data.userTeam.members.length > 4 && (
                  <AvatarGroupCount>
                    +{data.userTeam.members.length - 4}
                  </AvatarGroupCount>
                )}
              </AvatarGroup>
              <Button size="sm" variant="outline">
                View Team
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabbed content */}
      <Tabs defaultValue="teams">
        <TabsList>
          <TabsTrigger value="teams">
            <Users className="h-3.5 w-3.5" />
            Teams ({data.teams.length})
          </TabsTrigger>
          <TabsTrigger value="overview">
            <Trophy className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="mt-4">
          {!data.userTeam && data.status !== "ended" && (
            <Card className="mb-4 border-dashed">
              <CardContent className="flex items-center justify-between py-3">
                <span className="text-muted-foreground text-sm">
                  You haven&apos;t joined a team yet. Browse the teams below or
                  create your own.
                </span>
                <Button size="sm">Create Team</Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {sortedTeams.map((team, i) => {
              const isUserTeam = data.userTeam?._id === team._id;
              return (
                <Card
                  key={team._id}
                  className={
                    isUserTeam
                      ? "border-blue-200 dark:border-blue-800"
                      : undefined
                  }
                >
                  <CardContent className="flex items-center gap-4">
                    <div className="text-muted-foreground bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{team.name}</span>
                        <Badge
                          variant={
                            team.joinPolicy === "open" ? "default" : "secondary"
                          }
                        >
                          {team.joinPolicy === "open" ? "Open" : "Closed"}
                        </Badge>
                        {isUserTeam && (
                          <Badge variant="outline" className="text-[0.6rem]">
                            Your team
                          </Badge>
                        )}
                      </div>
                      <div className="text-muted-foreground mt-0.5 flex items-center gap-3 text-xs">
                        <span>
                          {team.memberCount}
                          {team.maxMembers && `/${team.maxMembers}`} members
                        </span>
                        <span className="font-medium">{team.points} pts</span>
                      </div>
                    </div>
                    <AvatarGroup>
                      {team.members.slice(0, 3).map((m) => (
                        <Avatar key={m._id} size="sm">
                          <AvatarFallback>{getInitials(m.name)}</AvatarFallback>
                        </Avatar>
                      ))}
                      {team.members.length > 3 && (
                        <AvatarGroupCount>
                          +{team.members.length - 3}
                        </AvatarGroupCount>
                      )}
                    </AvatarGroup>
                    <Button size="sm" variant="outline">
                      View
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-1 text-center">
                <div className="text-2xl font-bold">
                  {data.statistics.totalTeams}
                </div>
                <div className="text-muted-foreground text-xs">Teams</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-1 text-center">
                <div className="text-2xl font-bold">
                  {data.statistics.totalParticipants}
                </div>
                <div className="text-muted-foreground text-xs">
                  Participants
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-1 text-center">
                <div className="text-2xl font-bold">
                  {data.statistics.averageTeamSize.toFixed(1)}
                </div>
                <div className="text-muted-foreground text-xs">
                  Avg Team Size
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardContent className="space-y-3 text-sm">
              <CardTitle>Rules & Scoring</CardTitle>
              <Separator />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-muted-foreground mb-1 text-xs font-medium">
                    Team Size
                  </div>
                  <div>
                    {data.tournament.teamMinSize ?? "—"} –{" "}
                    {data.tournament.teamMaxSize ?? "—"} members
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1 text-xs font-medium">
                    Daily Limit
                  </div>
                  <div>
                    {data.tournament.maxSubmissionsPerDay ?? "Unlimited"}{" "}
                    submissions/day
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1 text-xs font-medium">
                    Individual Points
                  </div>
                  <div>
                    Base: {data.tournament.scoringConfig.individualPoints.base}{" "}
                    · Adv:{" "}
                    {data.tournament.scoringConfig.individualPoints.advanced}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1 text-xs font-medium">
                    Team Exercise Points
                  </div>
                  <div>
                    Base:{" "}
                    {data.tournament.scoringConfig.teamExercisePoints.base} ·
                    Adv:{" "}
                    {data.tournament.scoringConfig.teamExercisePoints.advanced}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top 3 mini-podium */}
          {sortedTeams.length >= 3 && (
            <div className="mt-4">
              <CardTitle className="mb-3">Current Standings</CardTitle>
              <div className="grid grid-cols-3 gap-3">
                {[sortedTeams[1], sortedTeams[0], sortedTeams[2]].map(
                  (team, idx) => {
                    const rank = [2, 1, 3][idx];
                    const heights = ["mt-4", "mt-0", "mt-6"];
                    const icons = [
                      <Trophy
                        key="silver"
                        className="text-podium-silver h-6 w-6"
                      />,
                      <Trophy
                        key="gold"
                        className="text-podium-gold h-8 w-8"
                      />,
                      <Trophy
                        key="bronze"
                        className="text-podium-bronze h-6 w-6"
                      />,
                    ];
                    return (
                      <Card key={team._id} className={heights[idx]}>
                        <CardContent className="flex flex-col items-center pt-1 text-center">
                          {icons[idx]}
                          <div className="mt-1 text-sm font-semibold">
                            {team.name}
                          </div>
                          <div className="text-lg font-bold">
                            {team.points} pts
                          </div>
                          <div className="text-muted-foreground text-xs">
                            #{rank}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  },
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function VariantB() {
  return (
    <div>
      <TournamentDetailsDemoNav />
      <SectionHeader
        as="h1"
        title="Variant B — Magazine"
        description="Full-width hero header with tabbed content area. User team appears as a persistent banner."
      />
      {ALL_SCENARIOS.map(({ label, data }) => (
        <div key={label} className="mt-8">
          <SectionHeader as="h2" title={label} />
          <div className="mt-4">
            <MagazineLayout data={data} />
          </div>
        </div>
      ))}
    </div>
  );
}
